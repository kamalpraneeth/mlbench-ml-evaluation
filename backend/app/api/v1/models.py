import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import BenchmarkModel
from app.services.model_service import ModelService
from app.services.benchmark_service import BenchmarkService
from app.schemas import ModelResponse, PredictRequest, PredictResponse, BenchmarkResponse

router = APIRouter(prefix="/models", tags=["Models"])


def serialize_model(m) -> ModelResponse:
    return ModelResponse(
        id=m.id,
        experiment_id=m.experiment_id,
        name=m.name,
        version=m.version,
        framework=m.framework,
        task_type=m.task_type,
        dataset_name=m.dataset_name,
        formats=json.loads(m.formats_json) if m.formats_json else ["native"],
        artifact_size_bytes=m.artifact_size_bytes,
        validation_status=m.validation_status,
        metrics=json.loads(m.metrics_json) if m.metrics_json else {},
        created_at=m.created_at,
    )


@router.get("", response_model=list[ModelResponse])
def list_models(db: Session = Depends(get_db)):
    models = ModelService.list_models(db)
    return [serialize_model(m) for m in models]


@router.get("/{model_id}", response_model=ModelResponse)
def get_model(model_id: str, db: Session = Depends(get_db)):
    m = ModelService.get_model(db, model_id)
    return serialize_model(m)


@router.get("/{model_id}/versions")
def get_model_versions(model_id: str, db: Session = Depends(get_db)):
    m = ModelService.get_model(db, model_id)
    return [
        {
            "version": m.version,
            "created_at": m.created_at,
            "validation_status": m.validation_status,
            "artifact_size_bytes": m.artifact_size_bytes,
        }
    ]


@router.get("/{model_id}/metadata")
def get_model_metadata(model_id: str, db: Session = Depends(get_db)):
    m = ModelService.get_model(db, model_id)
    return {
        "id": m.id,
        "name": m.name,
        "framework": m.framework,
        "task_type": m.task_type,
        "input_features": json.loads(m.input_schema_json) if m.input_schema_json else [],
        "output_schema": json.loads(m.output_schema_json) if m.output_schema_json else {},
        "formats": json.loads(m.formats_json) if m.formats_json else ["native"],
        "artifact_size_bytes": m.artifact_size_bytes,
    }


@router.post("/{model_id}/predict", response_model=PredictResponse)
def predict_model(model_id: str, req: PredictRequest, db: Session = Depends(get_db)):
    return ModelService.predict(db, model_id, inputs=req.inputs, runtime=req.runtime)


@router.get("/{model_id}/benchmarks")
def get_model_benchmarks(model_id: str, db: Session = Depends(get_db)):
    bms = BenchmarkService.list_benchmarks(db, model_id=model_id)
    from app.api.v1.benchmarks import serialize_benchmark
    return [serialize_benchmark(b) for b in bms]
