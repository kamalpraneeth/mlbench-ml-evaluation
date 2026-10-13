import os
import time
from typing import Any, Optional
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.linear_model import LogisticRegression, Ridge, LinearRegression
from app.core.config import settings
from app.core.errors import TrainingError
from app.ml.evaluation.metrics import compute_classification_metrics, compute_regression_metrics
from app.ml.training.base import BaseTrainer, TrainingResult


class SklearnTrainer(BaseTrainer):
    """Production-grade Scikit-learn trainer supporting baseline classification and regression models."""

    def __init__(self, model_type: str, task_type: str = "classification"):
        self.model_type = model_type
        self.task_type = task_type

    def _init_estimator(self, hp: dict[str, Any], random_seed: int = 42) -> Any:
        if self.task_type == "classification":
            if self.model_type == "LogisticRegression":
                c_val = float(hp.get("C", 1.0))
                max_iter = int(hp.get("max_iter", 500))
                return LogisticRegression(C=c_val, max_iter=max_iter, random_state=random_seed)
            elif self.model_type == "GradientBoostingClassifier":
                n_est = int(hp.get("n_estimators", 100))
                lr = float(hp.get("learning_rate", 0.1))
                max_depth = int(hp.get("max_depth", 3))
                return GradientBoostingClassifier(n_estimators=n_est, learning_rate=lr, max_depth=max_depth, random_state=random_seed)
            else:  # Default: RandomForestClassifier
                n_est = int(hp.get("n_estimators", 100))
                max_depth = int(hp.get("max_depth", 10)) if hp.get("max_depth") else None
                return RandomForestClassifier(n_estimators=n_est, max_depth=max_depth, random_state=random_seed, n_jobs=-1)
        else:
            if self.model_type == "LinearRegression":
                return LinearRegression()
            elif self.model_type == "Ridge":
                alpha = float(hp.get("alpha", 1.0))
                return Ridge(alpha=alpha, random_state=random_seed)
            elif self.model_type == "GradientBoostingRegressor":
                n_est = int(hp.get("n_estimators", 100))
                lr = float(hp.get("learning_rate", 0.1))
                max_depth = int(hp.get("max_depth", 3))
                return GradientBoostingRegressor(n_estimators=n_est, learning_rate=lr, max_depth=max_depth, random_state=random_seed)
            else:  # Default: RandomForestRegressor
                n_est = int(hp.get("n_estimators", 100))
                max_depth = int(hp.get("max_depth", 10)) if hp.get("max_depth") else None
                return RandomForestRegressor(n_estimators=n_est, max_depth=max_depth, random_state=random_seed, n_jobs=-1)

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
        estimator = self._init_estimator(hp, random_seed=random_seed)

        logs: list[str] = [
            f"[INIT] Model: Scikit-learn {self.model_type} (Task: {self.task_type})",
            f"[DATA] Train shape: {X_train.shape}, Val shape: {X_val.shape}, Test shape: {X_test.shape}",
            f"[PARAMS] Hyperparameters: {hp}",
            "[TRAIN] Fitting estimator on training data..."
        ]

        t0 = time.perf_counter()
        try:
            estimator.fit(X_train, y_train)
        except Exception as e:
            raise TrainingError(f"Scikit-learn model fitting failed: {str(e)}")
        duration = round(time.perf_counter() - t0, 3)

        logs.append(f"[TRAIN] Estimator fit completed in {duration:.3f}s")
        logs.append("[EVAL] Evaluating predictions on held-out test set...")

        # Inference on test set
        y_pred = estimator.predict(X_test)

        loss_curve = []
        if self.task_type == "classification":
            y_proba = None
            if hasattr(estimator, "predict_proba"):
                y_proba = estimator.predict_proba(X_test)
            eval_res = compute_classification_metrics(y_test, y_pred, y_proba=y_proba, target_names=target_names)
            metrics = eval_res["metrics"]
            confusion_matrix_res = eval_res["confusion_matrix"]
            logs.append(f"[METRICS] Test Accuracy: {metrics['accuracy']:.4f}, F1-Score: {metrics['f1_score']:.4f}")
        else:
            eval_res = compute_regression_metrics(y_test, y_pred)
            metrics = eval_res["metrics"]
            confusion_matrix_res = None
            logs.append(f"[METRICS] Test MAE: {metrics['mae']:.4f}, RMSE: {metrics['rmse']:.4f}, R2: {metrics['r2_score']:.4f}")

        # Save model artifact
        artifact_filename = f"sklearn_{self.model_type.lower()}_{int(time.time())}.joblib"
        artifact_path = os.path.join(str(settings.ARTIFACTS_DIR), artifact_filename)
        joblib.dump(estimator, artifact_path)
        artifact_size = os.path.getsize(artifact_path)
        logs.append(f"[SAVE] Serialized model saved to {artifact_filename} ({artifact_size / 1024:.1f} KB)")

        return TrainingResult(
            model=estimator,
            task_type=self.task_type,
            framework="scikit-learn",
            model_name=self.model_type,
            metrics=metrics,
            confusion_matrix=confusion_matrix_res,
            loss_curve=loss_curve,
            training_duration_sec=duration,
            logs="\n".join(logs),
            artifact_path=artifact_path,
            artifact_size_bytes=artifact_size,
        )
