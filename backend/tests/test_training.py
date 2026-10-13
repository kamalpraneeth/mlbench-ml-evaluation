import numpy as np
from app.ml.training.sklearn_trainer import SklearnTrainer
from app.ml.training.pytorch_trainer import PyTorchTrainer


def test_sklearn_trainer_classification():
    X_train = np.random.randn(100, 5).astype(np.float32)
    y_train = np.random.choice([0, 1], size=100)
    X_val = np.random.randn(20, 5).astype(np.float32)
    y_val = np.random.choice([0, 1], size=20)
    X_test = np.random.randn(20, 5).astype(np.float32)
    y_test = np.random.choice([0, 1], size=20)

    trainer = SklearnTrainer(model_type="RandomForestClassifier", task_type="classification")
    res = trainer.train(X_train, y_train, X_val, y_val, X_test, y_test, target_names=["C0", "C1"])

    assert res.framework == "scikit-learn"
    assert "accuracy" in res.metrics
    assert res.metrics["accuracy"] >= 0.0
    assert res.confusion_matrix is not None


def test_pytorch_trainer_classification():
    X_train = np.random.randn(100, 5).astype(np.float32)
    y_train = np.random.choice([0, 1], size=100)
    X_val = np.random.randn(20, 5).astype(np.float32)
    y_val = np.random.choice([0, 1], size=20)
    X_test = np.random.randn(20, 5).astype(np.float32)
    y_test = np.random.choice([0, 1], size=20)

    trainer = PyTorchTrainer(model_type="PyTorchMLP", task_type="classification")
    res = trainer.train(
        X_train, y_train, X_val, y_val, X_test, y_test,
        target_names=["C0", "C1"],
        hyperparameters={"epochs": 5, "batch_size": 16, "hidden_dim": 32}
    )

    assert res.framework == "pytorch"
    assert "accuracy" in res.metrics
    assert len(res.loss_curve) == 5
    assert res.onnx_path is not None
