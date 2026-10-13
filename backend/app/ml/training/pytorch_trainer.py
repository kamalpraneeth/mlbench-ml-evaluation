import os
import time
from typing import Any, Optional
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import onnx
import onnxruntime as ort

from app.core.config import settings
from app.core.errors import TrainingError, ExportError
from app.ml.evaluation.metrics import compute_classification_metrics, compute_regression_metrics
from app.ml.training.base import BaseTrainer, TrainingResult


class PyTorchMLP(nn.Module):
    """Configurable Multi-Layer Perceptron for classification and regression."""

    def __init__(self, input_dim: int, output_dim: int, hidden_dim: int = 64, num_layers: int = 2, dropout: float = 0.1, is_regression: bool = False):
        super().__init__()
        self.is_regression = is_regression
        layers = []
        curr_dim = input_dim
        for _ in range(num_layers):
            layers.append(nn.Linear(curr_dim, hidden_dim))
            layers.append(nn.BatchNorm1d(hidden_dim))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(p=dropout))
            curr_dim = hidden_dim
        layers.append(nn.Linear(curr_dim, output_dim))
        self.network = nn.Sequential(*layers)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out = self.network(x)
        if self.is_regression and out.shape[-1] == 1:
            out = out.squeeze(-1)
        return out


class PyTorchTrainer(BaseTrainer):
    """Production PyTorch model trainer with ONNX export and runtime verification."""

    def __init__(self, model_type: str = "PyTorchMLP", task_type: str = "classification"):
        self.model_type = model_type
        self.task_type = task_type

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
        X_test: np.ndarray,
        y_test: np.ndarray,
        target_names: Optional[list[str]] = None,
        hyperparameters: Optional[dict[str, Any]] = None,
    ) -> TrainingResult:
        hp = hyperparameters or {}
        random_seed = int(hp.get("random_seed", 42))
        torch.manual_seed(random_seed)
        np.random.seed(random_seed)

        input_dim = X_train.shape[1]
        is_regression = (self.task_type == "regression")
        output_dim = 1 if is_regression else len(np.unique(y_train))
        hidden_dim = int(hp.get("hidden_dim", 64))
        num_layers = int(hp.get("num_layers", 2))
        epochs = int(hp.get("epochs", 25))
        batch_size = int(hp.get("batch_size", 32))
        learning_rate = float(hp.get("learning_rate", 0.005))
        dropout = float(hp.get("dropout", 0.1))

        model = PyTorchMLP(
            input_dim=input_dim,
            output_dim=output_dim,
            hidden_dim=hidden_dim,
            num_layers=num_layers,
            dropout=dropout,
            is_regression=is_regression,
        )

        logs: list[str] = [
            f"[INIT] Model: PyTorch {self.model_type} (Input dim: {input_dim}, Output dim: {output_dim})",
            f"[CONFIG] Layers: {num_layers}, Hidden: {hidden_dim}, LR: {learning_rate}, Batch: {batch_size}, Epochs: {epochs}",
            f"[DATA] Train: {X_train.shape[0]} samples, Val: {X_val.shape[0]}, Test: {X_test.shape[0]}",
            "[TRAIN] Starting PyTorch training loop...",
        ]

        # Prepare PyTorch Tensors and Loaders
        X_tr_t = torch.tensor(X_train, dtype=torch.float32)
        y_tr_t = torch.tensor(y_train, dtype=torch.float32 if is_regression else torch.long)
        X_val_t = torch.tensor(X_val, dtype=torch.float32)
        y_val_t = torch.tensor(y_val, dtype=torch.float32 if is_regression else torch.long)
        X_te_t = torch.tensor(X_test, dtype=torch.float32)

        train_dataset = TensorDataset(X_tr_t, y_tr_t)
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)

        criterion = nn.MSELoss() if is_regression else nn.CrossEntropyLoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate, weight_decay=1e-4)

        loss_curve: list[dict[str, Any]] = []
        t0 = time.perf_counter()

        for epoch in range(1, epochs + 1):
            model.train()
            train_losses = []
            for batch_x, batch_y in train_loader:
                optimizer.zero_grad()
                out = model(batch_x)
                loss = criterion(out, batch_y)
                loss.backward()
                optimizer.step()
                train_losses.append(loss.item())

            train_loss = float(np.mean(train_losses))

            # Validation loss
            model.eval()
            with torch.no_grad():
                val_out = model(X_val_t)
                val_loss = float(criterion(val_out, y_val_t).item())

            loss_curve.append({
                "epoch": epoch,
                "train_loss": round(train_loss, 4),
                "val_loss": round(val_loss, 4),
            })

            if epoch % max(1, epochs // 5) == 0 or epoch == epochs:
                logs.append(f"[EPOCH {epoch:02d}/{epochs}] Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f}")

        duration = round(time.perf_counter() - t0, 3)
        logs.append(f"[TRAIN] PyTorch training finished in {duration:.3f}s")

        # Evaluation on held-out test data
        model.eval()
        with torch.no_grad():
            test_out = model(X_te_t)
            if is_regression:
                y_pred = test_out.numpy()
                eval_res = compute_regression_metrics(y_test, y_pred)
                metrics = eval_res["metrics"]
                confusion_matrix_res = None
                logs.append(f"[METRICS] Test MAE: {metrics['mae']:.4f}, RMSE: {metrics['rmse']:.4f}, R2: {metrics['r2_score']:.4f}")
            else:
                probs = torch.softmax(test_out, dim=1).numpy()
                y_pred = np.argmax(probs, axis=1)
                eval_res = compute_classification_metrics(y_test, y_pred, y_proba=probs, target_names=target_names)
                metrics = eval_res["metrics"]
                confusion_matrix_res = eval_res["confusion_matrix"]
                logs.append(f"[METRICS] Test Accuracy: {metrics['accuracy']:.4f}, F1: {metrics['f1_score']:.4f}")

        # Save PyTorch Model Artifact
        timestamp = int(time.time())
        pt_filename = f"pytorch_{self.model_type.lower()}_{timestamp}.pt"
        pt_path = os.path.join(str(settings.ARTIFACTS_DIR), pt_filename)
        torch.save({
            "model_state_dict": model.state_dict(),
            "model_type": self.model_type,
            "task_type": self.task_type,
            "input_dim": input_dim,
            "output_dim": output_dim,
            "hidden_dim": hidden_dim,
            "num_layers": num_layers,
            "dropout": dropout,
            "is_regression": is_regression,
            "target_names": target_names,
        }, pt_path)
        pt_size = os.path.getsize(pt_path)
        logs.append(f"[SAVE] PyTorch checkpoint saved to {pt_filename} ({pt_size / 1024:.1f} KB)")

        # Export to ONNX
        onnx_filename = f"model_{timestamp}.onnx"
        onnx_path = os.path.join(str(settings.ARTIFACTS_DIR), onnx_filename)
        dummy_input = torch.randn(1, input_dim, dtype=torch.float32)

        try:
            torch.onnx.export(
                model,
                dummy_input,
                onnx_path,
                dynamo=False,
                input_names=["input"],
                output_names=["output"],
                dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
                opset_version=17,
            )
            # Validate ONNX graph
            onnx_model = onnx.load(onnx_path)
            onnx.checker.check_model(onnx_model)
            onnx_size = os.path.getsize(onnx_path)
            logs.append(f"[ONNX] Exported and validated ONNX artifact: {onnx_filename} ({onnx_size / 1024:.1f} KB)")

            # Test numerical consistency between PyTorch and ONNX Runtime
            ort_session = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
            test_sample = X_test[:10].astype(np.float32)
            
            with torch.no_grad():
                py_out = model(torch.tensor(test_sample)).numpy()
            
            ort_out = ort_session.run(None, {"input": test_sample})[0]
            max_diff = float(np.max(np.abs(py_out - ort_out)))
            is_consistent = bool(np.allclose(py_out, ort_out, rtol=1e-3, atol=1e-4))
            
            logs.append(f"[CONSISTENCY] PyTorch vs ONNX Runtime Max Diff: {max_diff:.6f} | Match: {is_consistent}")
        except Exception as e:
            logs.append(f"[ONNX ERROR] Export failed: {str(e)}")
            onnx_path = None

        return TrainingResult(
            model=model,
            task_type=self.task_type,
            framework="pytorch",
            model_name=self.model_type,
            metrics=metrics,
            confusion_matrix=confusion_matrix_res,
            loss_curve=loss_curve,
            training_duration_sec=duration,
            logs="\n".join(logs),
            artifact_path=pt_path,
            artifact_size_bytes=pt_size,
            onnx_path=onnx_path,
        )
