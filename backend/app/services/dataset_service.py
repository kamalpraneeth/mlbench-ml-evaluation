import json
import os
import shutil
from pathlib import Path
from typing import Optional
import pandas as pd
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import DatasetNotFoundError, PreprocessingError
from app.models import DatasetModel
from app.ml.data.loader import load_dataset_csv
from app.ml.data.validator import validate_and_profile_dataset
from app.schemas import DatasetCreate, DatasetPreview, DatasetQuality


class DatasetService:
    @staticmethod
    def list_datasets(db: Session) -> list[DatasetModel]:
        return db.query(DatasetModel).order_by(DatasetModel.created_at.desc()).all()

    @staticmethod
    def get_dataset(db: Session, dataset_id: str) -> DatasetModel:
        ds = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
        if not ds:
            raise DatasetNotFoundError(dataset_id)
        return ds

    @staticmethod
    def create_dataset_from_file(
        db: Session,
        name: str,
        file_path: str | Path,
        filename: str,
        task_type: str = "classification",
        target_column: str = "category",
    ) -> DatasetModel:
        df = load_dataset_csv(file_path)
        profile = validate_and_profile_dataset(df, target_column, task_type)

        dataset = DatasetModel(
            name=name,
            filename=filename,
            file_path=str(file_path),
            task_type=task_type,
            target_column=target_column,
            row_count=profile["row_count"],
            col_count=profile["col_count"],
            columns_json=json.dumps(list(df.columns)),
            summary_stats_json=json.dumps(profile["columns"]),
            quality_warnings_json=json.dumps(profile["warnings"]),
            status="Ready",
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        return dataset

    @staticmethod
    def register_sample_dataset(db: Session, sample_key: str) -> DatasetModel:
        sample_map = {
            "customer_support": {
                "name": "Customer Support Tickets",
                "filename": "customer_support.csv",
                "task_type": "classification",
                "target_column": "category",
            },
            "house_prices": {
                "name": "House Price Prediction",
                "filename": "house_prices.csv",
                "task_type": "regression",
                "target_column": "price",
            },
            "log_analytics": {
                "name": "Server Log Anomaly Analytics",
                "filename": "log_analytics.csv",
                "task_type": "classification",
                "target_column": "is_anomaly",
            },
        }

        info = sample_map.get(sample_key)
        if not info:
            raise PreprocessingError(f"Unknown sample key '{sample_key}'. Available: {list(sample_map.keys())}")

        src_path = settings.SAMPLE_DATA_DIR / info["filename"]
        if not src_path.exists():
            raise PreprocessingError(f"Sample data file {src_path} not found.")

        return DatasetService.create_dataset_from_file(
            db=db,
            name=info["name"],
            file_path=src_path,
            filename=info["filename"],
            task_type=info["task_type"],
            target_column=info["target_column"],
        )

    @staticmethod
    def get_dataset_preview(db: Session, dataset_id: str, limit: int = 25) -> DatasetPreview:
        ds = DatasetService.get_dataset(db, dataset_id)
        df = pd.read_csv(ds.file_path, nrows=limit)
        # Clean NaNs for JSON serialization
        clean_df = df.fillna("")
        return DatasetPreview(
            columns=list(clean_df.columns),
            rows=clean_df.to_dict(orient="records"),
            total_rows=ds.row_count,
            total_columns=ds.col_count,
        )

    @staticmethod
    def get_dataset_quality(db: Session, dataset_id: str) -> DatasetQuality:
        ds = DatasetService.get_dataset(db, dataset_id)
        df = pd.read_csv(ds.file_path)
        profile = validate_and_profile_dataset(df, ds.target_column, ds.task_type)
        return DatasetQuality(
            dataset_id=ds.id,
            row_count=profile["row_count"],
            col_count=profile["col_count"],
            missing_values_total=profile["missing_values_total"],
            duplicate_rows_count=profile["duplicate_rows_count"],
            quality_score=profile["quality_score"],
            warnings=profile["warnings"],
            columns=profile["columns"],
        )
