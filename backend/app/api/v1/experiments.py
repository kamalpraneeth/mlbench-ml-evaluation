import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.experiment_service import ExperimentService
from app.schemas import ExperimentCreate, ExperimentResponse

router = APIRouter(prefix="/experiments", tags=["Experiments"])


def serialize_experiment(exp) -> ExperimentResponse:
    dataset_name = exp.dataset.name if exp.dataset else "Dataset"
    return ExperimentResponse(
        id=exp.id,
        name=exp.name,
        task_type=exp.task_type,
        dataset_id=exp.dataset_id,
        dataset_name=dataset_name,
        framework=exp.framework,
        model_type=exp.model_type,
        status=exp.status,
        hyperparameters=json.loads(exp.hyperparameters_json) if exp.hyperparameters_json else {},
        preprocessing=json.loads(exp.preprocessing_config_json) if exp.preprocessing_config_json else {},
        metrics=json.loads(exp.metrics_json) if exp.metrics_json else {},
        confusion_matrix=json.loads(exp.confusion_matrix_json) if exp.confusion_matrix_json else None,
        loss_curve=json.loads(exp.loss_curve_json) if exp.loss_curve_json else None,
        logs=exp.logs_text,
        training_duration_sec=exp.training_duration_sec,
        created_at=exp.created_at,
        completed_at=exp.completed_at,
    )


@router.get("", response_model=list[ExperimentResponse])
def list_experiments(
    task: Optional[str] = None,
    framework: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    exps = ExperimentService.list_experiments(db, task=task, framework=framework, status=status)
    return [serialize_experiment(e) for e in exps]


@router.post("", response_model=ExperimentResponse)
def create_experiment(data: ExperimentCreate, db: Session = Depends(get_db)):
    exp = ExperimentService.run_experiment(db, data)
    return serialize_experiment(exp)


@router.get("/{experiment_id}", response_model=ExperimentResponse)
def get_experiment(experiment_id: str, db: Session = Depends(get_db)):
    exp = ExperimentService.get_experiment(db, experiment_id)
    return serialize_experiment(exp)


@router.get("/{experiment_id}/logs")
def get_experiment_logs(experiment_id: str, db: Session = Depends(get_db)):
    exp = ExperimentService.get_experiment(db, experiment_id)
    return {"experiment_id": exp.id, "logs": exp.logs_text}


@router.get("/{experiment_id}/metrics")
def get_experiment_metrics(experiment_id: str, db: Session = Depends(get_db)):
    exp = ExperimentService.get_experiment(db, experiment_id)
    return {
        "experiment_id": exp.id,
        "metrics": json.loads(exp.metrics_json) if exp.metrics_json else {},
        "confusion_matrix": json.loads(exp.confusion_matrix_json) if exp.confusion_matrix_json else None,
        "loss_curve": json.loads(exp.loss_curve_json) if exp.loss_curve_json else [],
    }


@router.post("/{experiment_id}/cancel")
def cancel_experiment(experiment_id: str, db: Session = Depends(get_db)):
    exp = ExperimentService.get_experiment(db, experiment_id)
    if exp.status in ["Completed", "Failed"]:
        return {"status": "Already finalized", "experiment_id": exp.id}
    exp.status = "Cancelled"
    db.commit()
    return {"status": "Cancelled", "experiment_id": exp.id}
