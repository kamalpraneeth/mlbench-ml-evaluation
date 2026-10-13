from dataclasses import dataclass
from typing import Any, Optional
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, OneHotEncoder, LabelEncoder
from sklearn.impute import SimpleImputer
from app.core.errors import PreprocessingError


@dataclass
class PreprocessedData:
    X_train: np.ndarray
    y_train: np.ndarray
    X_val: np.ndarray
    y_val: np.ndarray
    X_test: np.ndarray
    y_test: np.ndarray
    feature_names: list[str]
    target_classes: Optional[list[str]]
    num_features: int
    num_classes: int
    pipeline_state: dict[str, Any]


class DataPreprocessor:
    """End-to-end reproducible preprocessing pipeline with zero data leakage."""

    def __init__(
        self,
        task_type: str = "classification",
        missing_strategy: str = "impute_mean",
        numeric_scaling: str = "standard",
        handle_duplicates: bool = True,
        train_split: float = 0.70,
        val_split: float = 0.15,
        test_split: float = 0.15,
        random_seed: int = 42,
    ):
        self.task_type = task_type
        self.missing_strategy = missing_strategy
        self.numeric_scaling = numeric_scaling
        self.handle_duplicates = handle_duplicates
        self.train_split = train_split
        self.val_split = val_split
        self.test_split = test_split
        self.random_seed = random_seed

        # Transformers fitted on training data only
        self.numeric_imputer: Optional[SimpleImputer] = None
        self.categorical_imputer: Optional[SimpleImputer] = None
        self.scaler: Optional[Any] = None
        self.one_hot_encoder: Optional[OneHotEncoder] = None
        self.label_encoder: Optional[LabelEncoder] = None

        self.num_cols: list[str] = []
        self.cat_cols: list[str] = []
        self.final_feature_names: list[str] = []
        self.target_classes_: Optional[list[str]] = None

    def fit_transform_dataset(self, df: pd.DataFrame, target_column: str) -> PreprocessedData:
        data = df.copy()

        # Handle duplicates if requested
        if self.handle_duplicates:
            data = data.drop_duplicates()

        # Drop identifier columns (id, ticket_id, property_id, log_id)
        drop_cols = [c for c in data.columns if c.lower().endswith(("_id", "id")) and c != target_column]
        if drop_cols:
            data = data.drop(columns=drop_cols)

        if target_column not in data.columns:
            raise PreprocessingError(f"Target column '{target_column}' missing after column preparation.")

        # Separate X and y
        y_raw = data[target_column].copy()
        X_raw = data.drop(columns=[target_column]).copy()

        # Identify numerical and categorical columns
        self.num_cols = [c for c in X_raw.columns if np.issubdtype(X_raw[c].dtype, np.number)]
        self.cat_cols = [c for c in X_raw.columns if c not in self.num_cols]

        # Target encoding
        if self.task_type == "classification":
            self.label_encoder = LabelEncoder()
            y_clean = y_raw.astype(str)
            y_arr = self.label_encoder.fit_transform(y_clean)
            self.target_classes_ = [str(c) for c in self.label_encoder.classes_]
            num_classes = len(self.target_classes_)
        else:
            y_arr = y_raw.astype(float).to_numpy()
            self.target_classes_ = None
            num_classes = 1

        # Train / Val / Test splitting
        test_ratio = self.test_split
        val_ratio_of_remain = self.val_split / (self.train_split + self.val_split)

        stratify = y_arr if (self.task_type == "classification" and len(np.unique(y_arr)) > 1) else None

        try:
            X_train_val, X_test_df, y_train_val, y_test_arr = train_test_split(
                X_raw, y_arr, test_size=test_ratio, random_state=self.random_seed, stratify=stratify
            )
            stratify_train = y_train_val if (self.task_type == "classification" and len(np.unique(y_train_val)) > 1) else None
            X_train_df, X_val_df, y_train_arr, y_val_arr = train_test_split(
                X_train_val, y_train_val, test_size=val_ratio_of_remain, random_state=self.random_seed, stratify=stratify_train
            )
        except Exception:
            # Fallback to non-stratified split if rare classes cannot be stratified
            X_train_val, X_test_df, y_train_val, y_test_arr = train_test_split(
                X_raw, y_arr, test_size=test_ratio, random_state=self.random_seed
            )
            X_train_df, X_val_df, y_train_arr, y_val_arr = train_test_split(
                X_train_val, y_train_val, test_size=val_ratio_of_remain, random_state=self.random_seed
            )

        # FIT TRANSFORMERS ONLY ON X_train_df
        # 1. Numeric imputation & scaling
        X_train_num = np.empty((len(X_train_df), 0), dtype=np.float32)
        X_val_num = np.empty((len(X_val_df), 0), dtype=np.float32)
        X_test_num = np.empty((len(X_test_df), 0), dtype=np.float32)
        num_feature_names = []

        if self.num_cols:
            num_strat = "median" if "median" in self.missing_strategy else "mean"
            self.numeric_imputer = SimpleImputer(strategy=num_strat)
            X_train_num_imp = self.numeric_imputer.fit_transform(X_train_df[self.num_cols])
            X_val_num_imp = self.numeric_imputer.transform(X_val_df[self.num_cols])
            X_test_num_imp = self.numeric_imputer.transform(X_test_df[self.num_cols])

            if self.numeric_scaling == "minmax":
                self.scaler = MinMaxScaler()
            elif self.numeric_scaling == "robust":
                self.scaler = RobustScaler()
            elif self.numeric_scaling == "none":
                self.scaler = None
            else:
                self.scaler = StandardScaler()

            if self.scaler is not None:
                X_train_num = self.scaler.fit_transform(X_train_num_imp)
                X_val_num = self.scaler.transform(X_val_num_imp)
                X_test_num = self.scaler.transform(X_test_num_imp)
            else:
                X_train_num = X_train_num_imp
                X_val_num = X_val_num_imp
                X_test_num = X_test_num_imp

            num_feature_names = list(self.num_cols)

        # 2. Categorical imputation & encoding
        X_train_cat = np.empty((len(X_train_df), 0), dtype=np.float32)
        X_val_cat = np.empty((len(X_val_df), 0), dtype=np.float32)
        X_test_cat = np.empty((len(X_test_df), 0), dtype=np.float32)
        cat_feature_names = []

        if self.cat_cols:
            self.categorical_imputer = SimpleImputer(strategy="most_frequent")
            X_train_cat_imp = self.categorical_imputer.fit_transform(X_train_df[self.cat_cols].astype(str))
            X_val_cat_imp = self.categorical_imputer.transform(X_val_df[self.cat_cols].astype(str))
            X_test_cat_imp = self.categorical_imputer.transform(X_test_df[self.cat_cols].astype(str))

            self.one_hot_encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
            X_train_cat = self.one_hot_encoder.fit_transform(X_train_cat_imp)
            X_val_cat = self.one_hot_encoder.transform(X_val_cat_imp)
            X_test_cat = self.one_hot_encoder.transform(X_test_cat_imp)

            cat_feature_names = list(self.one_hot_encoder.get_feature_names_out(self.cat_cols))

        # Assemble final feature matrices
        X_train = np.hstack([X_train_num, X_train_cat]).astype(np.float32)
        X_val = np.hstack([X_val_num, X_val_cat]).astype(np.float32)
        X_test = np.hstack([X_test_num, X_test_cat]).astype(np.float32)

        self.final_feature_names = num_feature_names + cat_feature_names

        pipeline_state = {
            "task_type": self.task_type,
            "num_cols": self.num_cols,
            "cat_cols": self.cat_cols,
            "final_feature_names": self.final_feature_names,
            "target_classes": self.target_classes_,
            "num_features": len(self.final_feature_names),
            "num_classes": num_classes,
        }

        return PreprocessedData(
            X_train=X_train,
            y_train=y_train_arr,
            X_val=X_val,
            y_val=y_val_arr,
            X_test=X_test,
            y_test=y_test_arr,
            feature_names=self.final_feature_names,
            target_classes=self.target_classes_,
            num_features=len(self.final_feature_names),
            num_classes=num_classes,
            pipeline_state=pipeline_state,
        )

    def transform_single_batch(self, raw_dicts: list[dict[str, Any]]) -> np.ndarray:
        """Transforms a batch of input dictionaries for real-time model inference."""
        df = pd.DataFrame(raw_dicts)

        X_num = np.empty((len(df), 0), dtype=np.float32)
        if self.num_cols:
            for c in self.num_cols:
                if c not in df.columns:
                    df[c] = 0.0
            num_data = df[self.num_cols].to_numpy()
            if self.numeric_imputer:
                num_data = self.numeric_imputer.transform(num_data)
            if self.scaler:
                num_data = self.scaler.transform(num_data)
            X_num = num_data

        X_cat = np.empty((len(df), 0), dtype=np.float32)
        if self.cat_cols:
            for c in self.cat_cols:
                if c not in df.columns:
                    df[c] = "unknown"
            cat_data = df[self.cat_cols].astype(str).to_numpy()
            if self.categorical_imputer:
                cat_data = self.categorical_imputer.transform(cat_data)
            if self.one_hot_encoder:
                X_cat = self.one_hot_encoder.transform(cat_data)

        X = np.hstack([X_num, X_cat]).astype(np.float32)
        return X
