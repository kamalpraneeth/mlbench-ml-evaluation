import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.pipeline_service import PipelineService
from app.schemas import PipelineResponse

router = APIRouter(prefix="/pipelines", tags=["Pipelines"])


def serialize_pipeline(p) -> PipelineResponse:
    return PipelineResponse(
        id=p.id,
        name=p.name,
        trigger_type=p.trigger_type,
        schedule=p.schedule,
        status=p.status,
        last_run=p.last_run,
        next_run=p.next_run,
        duration_sec=p.duration_sec,
        failure_reason=p.failure_reason,
        run_history=json.loads(p.run_history_json) if p.run_history_json else [],
        created_at=p.created_at,
    )


@router.get("", response_model=list[PipelineResponse])
def list_pipelines(db: Session = Depends(get_db)):
    pipes = PipelineService.list_pipelines(db)
    return [serialize_pipeline(p) for p in pipes]


@router.post("/{pipeline_id}/trigger", response_model=PipelineResponse)
def trigger_pipeline(pipeline_id: str, db: Session = Depends(get_db)):
    pipe = PipelineService.trigger_pipeline(db, pipeline_id)
    return serialize_pipeline(pipe)
