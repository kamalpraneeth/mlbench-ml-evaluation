from datetime import datetime, timezone, timedelta
import json
import random
import time
from sqlalchemy.orm import Session
from app.models import PipelineModel


DEFAULT_PIPELINES = [
    {
        "name": "Daily Model Evaluation",
        "trigger_type": "Scheduled",
        "schedule": "0 2 * * *",
        "status": "Success",
        "duration_sec": 42.5,
    },
    {
        "name": "Weekly Benchmark",
        "trigger_type": "Scheduled",
        "schedule": "0 3 * * 0",
        "status": "Success",
        "duration_sec": 128.4,
    },
    {
        "name": "Model Drift Detection",
        "trigger_type": "Scheduled",
        "schedule": "0 */6 * * *",
        "status": "Running",
        "duration_sec": 18.2,
    },
    {
        "name": "Automated Report Generation",
        "trigger_type": "Scheduled",
        "schedule": "0 1 * * 1",
        "status": "Success",
        "duration_sec": 9.8,
    },
]


class PipelineService:
    @staticmethod
    def ensure_default_pipelines(db: Session) -> None:
        count = db.query(PipelineModel).count()
        if count == 0:
            now = datetime.now(timezone.utc)
            for p_data in DEFAULT_PIPELINES:
                history = [
                    {
                        "run_id": f"RUN-{random.randint(1000, 9999)}",
                        "status": "Success",
                        "duration_sec": p_data["duration_sec"],
                        "timestamp": (now - timedelta(days=1)).isoformat(),
                    }
                ]
                pipe = PipelineModel(
                    name=p_data["name"],
                    trigger_type=p_data["trigger_type"],
                    schedule=p_data["schedule"],
                    status=p_data["status"],
                    last_run=now - timedelta(hours=random.randint(1, 12)),
                    next_run=now + timedelta(hours=random.randint(6, 24)),
                    duration_sec=p_data["duration_sec"],
                    run_history_json=json.dumps(history),
                )
                db.add(pipe)
            db.commit()

    @staticmethod
    def list_pipelines(db: Session) -> list[PipelineModel]:
        PipelineService.ensure_default_pipelines(db)
        return db.query(PipelineModel).all()

    @staticmethod
    def trigger_pipeline(db: Session, pipeline_id: str) -> PipelineModel:
        pipe = db.query(PipelineModel).filter(PipelineModel.id == pipeline_id).first()
        if not pipe:
            raise ValueError(f"Pipeline {pipeline_id} not found.")

        now = datetime.now(timezone.utc)
        pipe.status = "Success"
        pipe.last_run = now
        pipe.duration_sec = round(random.uniform(15.0, 45.0), 1)

        history = json.loads(pipe.run_history_json) if pipe.run_history_json else []
        history.insert(0, {
            "run_id": f"RUN-{random.randint(10000, 99999)}",
            "status": "Success",
            "duration_sec": pipe.duration_sec,
            "timestamp": now.isoformat(),
        })
        pipe.run_history_json = json.dumps(history[:10])
        db.commit()
        db.refresh(pipe)
        return pipe
