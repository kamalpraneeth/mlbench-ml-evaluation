from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Optional
import numpy as np


@dataclass
class TrainingResult:
    model: Any
    task_type: str
    framework: str
    model_name: str
    metrics: dict[str, Any]
    confusion_matrix: Optional[dict[str, Any]]
    loss_curve: list[dict[str, Any]]
    training_duration_sec: float
    logs: str
    artifact_path: str
    artifact_size_bytes: int
    onnx_path: Optional[str] = None
    tflite_path: Optional[str] = None


class BaseTrainer(ABC):
    @abstractmethod
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
        pass
