import os
from typing import Any
import numpy as np
import torch
from app.ml.training.pytorch_trainer import PyTorchMLP


class PyTorchInferenceRuntime:
    """Inference engine for PyTorch models."""

    def __init__(self, checkpoint_path: str):
        if not os.path.exists(checkpoint_path):
            raise FileNotFoundError(f"PyTorch checkpoint not found at {checkpoint_path}")
        
        self.checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
        self.model = PyTorchMLP(
            input_dim=self.checkpoint["input_dim"],
            output_dim=self.checkpoint["output_dim"],
            hidden_dim=self.checkpoint["hidden_dim"],
            num_layers=self.checkpoint["num_layers"],
            dropout=self.checkpoint.get("dropout", 0.0),
            is_regression=self.checkpoint["is_regression"],
        )
        self.model.load_state_dict(self.checkpoint["model_state_dict"])
        self.model.eval()

    def predict(self, X: np.ndarray) -> np.ndarray:
        tensor_x = torch.tensor(X, dtype=torch.float32)
        with torch.no_grad():
            out = self.model(tensor_x)
            return out.cpu().numpy()
