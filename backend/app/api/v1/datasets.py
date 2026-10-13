import os
import shutil
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.services.dataset_service import DatasetService
from app.schemas import DatasetResponse, DatasetPreview, DatasetQuality, DatasetCreate

router = APIRouter(prefix="/datasets", tags=["Datasets"])


@router.get("", response_model=list[DatasetResponse])
def list_datasets(db: Session = Depends(get_db)):
    datasets = DatasetService.list_datasets(db)
    # If no datasets in DB yet, auto-register default samples
    if not datasets:
        try:
            DatasetService.register_sample_dataset(db, "customer_support")
            DatasetService.register_sample_dataset(db, "house_prices")
            DatasetService.register_sample_dataset(db, "log_analytics")
            datasets = DatasetService.list_datasets(db)
        except Exception:
            pass
    return datasets


@router.post("", response_model=DatasetResponse)
def create_dataset(data: DatasetCreate, db: Session = Depends(get_db)):
    if data.sample_key:
        return DatasetService.register_sample_dataset(db, data.sample_key)
    raise HTTPException(status_code=400, detail="Either sample_key or file upload is required.")


@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset_file(
    file: UploadFile = File(...),
    name: str = Form(...),
    task_type: str = Form("classification"),
    target_column: str = Form("category"),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    dest_path = settings.SAMPLE_DATA_DIR / f"upload_{file.filename}"
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return DatasetService.create_dataset_from_file(
        db=db,
        name=name,
        file_path=dest_path,
        filename=file.filename,
        task_type=task_type,
        target_column=target_column,
    )


@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(dataset_id: str, db: Session = Depends(get_db)):
    return DatasetService.get_dataset(db, dataset_id)


@router.get("/{dataset_id}/preview", response_model=DatasetPreview)
def get_dataset_preview(dataset_id: str, limit: int = 25, db: Session = Depends(get_db)):
    return DatasetService.get_dataset_preview(db, dataset_id, limit=limit)


@router.get("/{dataset_id}/quality", response_model=DatasetQuality)
def get_dataset_quality(dataset_id: str, db: Session = Depends(get_db)):
    return DatasetService.get_dataset_quality(db, dataset_id)
