import os
import pandas as pd
import pytest
from app.core.errors import PreprocessingError
from app.ml.data.loader import load_dataset_csv
from app.ml.data.validator import validate_and_profile_dataset
from app.core.config import settings


def test_load_sample_csv():
    csv_path = settings.SAMPLE_DATA_DIR / "customer_support.csv"
    assert os.path.exists(csv_path)
    df = load_dataset_csv(csv_path)
    assert isinstance(df, pd.DataFrame)
    assert len(df) > 100
    assert "category" in df.columns


def test_load_nonexistent_csv():
    with pytest.raises(PreprocessingError):
        load_dataset_csv("nonexistent_path_xyz.csv")


def test_validate_and_profile_dataset():
    df = pd.DataFrame({
        "feature_a": [1.0, 2.0, 3.0, 4.0] * 10,
        "feature_b": ["x", "y", "x", "y"] * 10,
        "target": ["cat1", "cat2", "cat1", "cat2"] * 10,
    })
    res = validate_and_profile_dataset(df, target_column="target", task_type="classification")
    assert res["row_count"] == 40
    assert res["col_count"] == 3
    assert res["quality_score"] > 50.0
    assert len(res["columns"]) == 3


def test_validate_missing_target():
    df = pd.DataFrame({"a": [1, 2, 3] * 10, "b": [4, 5, 6] * 10})
    with pytest.raises(PreprocessingError):
        validate_and_profile_dataset(df, target_column="missing_target", task_type="classification")
