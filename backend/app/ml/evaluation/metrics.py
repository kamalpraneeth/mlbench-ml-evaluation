from typing import Any, Optional
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    roc_auc_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)


def compute_classification_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_proba: Optional[np.ndarray] = None,
    target_names: Optional[list[str]] = None,
) -> dict[str, Any]:
    """Computes comprehensive classification metrics from held-out ground truth and predictions."""
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, average="weighted", zero_division=0))
    rec = float(recall_score(y_true, y_pred, average="weighted", zero_division=0))
    f1 = float(f1_score(y_true, y_pred, average="weighted", zero_division=0))

    cm = confusion_matrix(y_true, y_pred)
    labels = target_names if target_names else [str(i) for i in range(len(cm))]

    cm_dict = {
        "labels": labels,
        "matrix": cm.tolist(),
        "total_samples": int(len(y_true)),
    }

    metrics: dict[str, Any] = {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "sample_count": int(len(y_true)),
    }

    # Attempt ROC-AUC calculation if probabilities are provided
    if y_proba is not None:
        try:
            n_classes = len(np.unique(y_true))
            if n_classes == 2 and y_proba.ndim == 2:
                # Binary classification
                auc = float(roc_auc_score(y_true, y_proba[:, 1]))
                metrics["roc_auc"] = round(auc, 4)
            elif n_classes > 2 and y_proba.ndim == 2:
                # Multiclass classification
                auc = float(roc_auc_score(y_true, y_proba, multi_class="ovr", average="weighted"))
                metrics["roc_auc"] = round(auc, 4)
        except Exception:
            metrics["roc_auc"] = None
    else:
        metrics["roc_auc"] = None

    return {
        "metrics": metrics,
        "confusion_matrix": cm_dict,
    }


def compute_regression_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
) -> dict[str, Any]:
    """Computes standard regression metrics (MAE, MSE, RMSE, R2)."""
    mae = float(mean_absolute_error(y_true, y_pred))
    mse = float(mean_squared_error(y_true, y_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_true, y_pred))

    metrics: dict[str, Any] = {
        "mae": round(mae, 4),
        "mse": round(mse, 4),
        "rmse": round(rmse, 4),
        "r2_score": round(r2, 4),
        "sample_count": int(len(y_true)),
    }

    return {
        "metrics": metrics,
        "confusion_matrix": None,
    }
