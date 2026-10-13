import json
from sqlalchemy.orm import Session
from app.models import ModelRecordModel, BenchmarkModel
from app.schemas import ComparisonResponse, ModelComparisonItem


class ComparisonService:
    @staticmethod
    def compare_models(db: Session, model_ids: list[str]) -> ComparisonResponse:
        models = db.query(ModelRecordModel).filter(ModelRecordModel.id.in_(model_ids)).all()
        if not models:
            return ComparisonResponse(task_type="classification", models=[])

        task_type = models[0].task_type
        items: list[ModelComparisonItem] = []

        for m in models:
            # Metrics
            metrics = json.loads(m.metrics_json) if m.metrics_json else {}
            # Latest benchmark
            latest_bm = (
                db.query(BenchmarkModel)
                .filter(BenchmarkModel.model_id == m.id)
                .order_by(BenchmarkModel.created_at.desc())
                .first()
            )

            formats = json.loads(m.formats_json) if m.formats_json else ["native"]
            size_mb = round(m.artifact_size_bytes / (1024 * 1024), 2)

            item = ModelComparisonItem(
                model_id=m.id,
                name=m.name,
                framework=m.framework,
                task_type=m.task_type,
                accuracy=metrics.get("accuracy"),
                precision=metrics.get("precision"),
                recall=metrics.get("recall"),
                f1=metrics.get("f1_score"),
                mae=metrics.get("mae"),
                mse=metrics.get("mse"),
                rmse=metrics.get("rmse"),
                r2=metrics.get("r2_score"),
                model_size_mb=size_mb,
                mean_latency_ms=latest_bm.mean_latency_ms if latest_bm else None,
                p95_latency_ms=latest_bm.p95_latency_ms if latest_bm else None,
                throughput_sps=latest_bm.throughput_sps if latest_bm else None,
                memory_mb=latest_bm.memory_mb if latest_bm else None,
                supported_runtimes=formats,
                consistency_passed=latest_bm.prediction_consistency_passed if latest_bm else True,
            )
            items.append(item)

        return ComparisonResponse(task_type=task_type, models=items)
