from typing import Any
import numpy as np
import pandas as pd
from app.core.errors import PreprocessingError


def validate_and_profile_dataset(df: pd.DataFrame, target_column: str, task_type: str) -> dict[str, Any]:
    """Inspects dataset quality, computes column statistics, and identifies potential data issues."""
    if target_column not in df.columns:
        raise PreprocessingError(f"Target column '{target_column}' is not present in dataset columns: {list(df.columns)}")

    row_count, col_count = df.shape
    if row_count < 20:
        raise PreprocessingError(f"Dataset has only {row_count} rows. At least 20 rows are required for splitting.")

    target_series = df[target_column]
    if target_series.isnull().all():
        raise PreprocessingError(f"Target column '{target_column}' has all null values.")

    warnings: list[str] = []
    
    # Check duplicate rows
    duplicate_rows = int(df.duplicated().sum())
    if duplicate_rows > 0:
        warnings.append(f"Found {duplicate_rows} exact duplicate rows ({duplicate_rows / row_count * 100:.1f}%).")

    # Check target distribution
    if task_type == "classification":
        unique_classes = target_series.dropna().unique()
        if len(unique_classes) < 2:
            raise PreprocessingError(f"Classification task requires at least 2 distinct classes, found {len(unique_classes)}.")
        class_counts = target_series.value_counts()
        min_class_count = class_counts.min()
        if min_class_count < 2:
            warnings.append(f"Some classes have fewer than 2 samples: {dict(class_counts)}")
    elif task_type == "regression":
        if not np.issubdtype(target_series.dtype, np.number):
            raise PreprocessingError(f"Target column '{target_column}' for regression must be numeric, got dtype {target_series.dtype}.")
        if target_series.nunique() < 5:
            warnings.append(f"Regression target has only {target_series.nunique()} unique values.")

    columns_meta = []
    total_missing = 0

    for col in df.columns:
        series = df[col]
        missing = int(series.isnull().sum())
        total_missing += missing
        missing_pct = round(float(missing / row_count * 100), 2)
        unique_cnt = int(series.nunique())
        is_num = bool(np.issubdtype(series.dtype, np.number))

        meta = {
            "name": col,
            "dtype": str(series.dtype),
            "missing_count": missing,
            "missing_pct": missing_pct,
            "unique_count": unique_cnt,
            "is_numeric": is_num,
        }

        if is_num and not series.dropna().empty:
            meta["mean"] = round(float(series.mean()), 3)
            meta["std"] = round(float(series.std()), 3) if not np.isnan(series.std()) else 0.0
            meta["min"] = round(float(series.min()), 3)
            meta["max"] = round(float(series.max()), 3)
        else:
            meta["mean"] = None
            meta["std"] = None
            meta["min"] = None
            meta["max"] = None

        if missing_pct > 30.0:
            warnings.append(f"Column '{col}' has {missing_pct}% missing values.")

        columns_meta.append(meta)

    # Calculate overall data quality score (0 to 100)
    missing_ratio = total_missing / max(row_count * col_count, 1)
    dup_ratio = duplicate_rows / max(row_count, 1)
    quality_score = max(0.0, round(100.0 - (missing_ratio * 40.0) - (dup_ratio * 30.0), 1))

    return {
        "row_count": row_count,
        "col_count": col_count,
        "missing_values_total": total_missing,
        "duplicate_rows_count": duplicate_rows,
        "quality_score": quality_score,
        "warnings": warnings,
        "columns": columns_meta,
    }
