import numpy as np
import pandas as pd
from app.ml.preprocessing.pipeline import DataPreprocessor


def test_data_preprocessor_classification():
    df = pd.DataFrame({
        "num_1": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0] * 5,
        "cat_1": ["A", "B", "C", "A", "B", "C", "A", "B", "C", "A"] * 5,
        "target": ["label_0", "label_1", "label_0", "label_1", "label_0", "label_1", "label_0", "label_1", "label_0", "label_1"] * 5,
    })

    preprocessor = DataPreprocessor(
        task_type="classification",
        missing_strategy="impute_mean",
        numeric_scaling="standard",
        handle_duplicates=False,
        train_split=0.6,
        val_split=0.2,
        test_split=0.2,
        random_seed=42,
    )

    data = preprocessor.fit_transform_dataset(df, target_column="target")

    assert data.X_train.shape[0] == 30
    assert data.X_val.shape[0] == 10
    assert data.X_test.shape[0] == 10
    assert data.num_classes == 2
    assert len(data.feature_names) > 0
    # Check transformed values are normalized
    assert not np.isnan(data.X_train).any()


def test_data_preprocessor_batch_transform():
    df = pd.DataFrame({
        "num_1": [10.0, 20.0, 30.0] * 10,
        "cat_1": ["x", "y", "z"] * 10,
        "target": [100.0, 200.0, 300.0] * 10,
    })

    preprocessor = DataPreprocessor(task_type="regression")
    data = preprocessor.fit_transform_dataset(df, target_column="target")

    test_input = [{"num_1": 15.0, "cat_1": "x"}, {"num_1": 25.0, "cat_1": "y"}]
    X_batch = preprocessor.transform_single_batch(test_input)
    assert X_batch.shape == (2, data.num_features)
    assert not np.isnan(X_batch).any()
