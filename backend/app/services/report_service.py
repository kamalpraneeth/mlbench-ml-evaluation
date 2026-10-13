import csv
import io
import json
from datetime import datetime, timezone
from typing import Any
from sqlalchemy.orm import Session

from app.models import ReportModel, ModelRecordModel, BenchmarkModel, ExperimentModel


class ReportService:
    @staticmethod
    def list_reports(db: Session) -> list[ReportModel]:
        return db.query(ReportModel).order_by(ReportModel.created_at.desc()).all()

    @staticmethod
    def get_report(db: Session, report_id: str) -> ReportModel | None:
        return db.query(ReportModel).filter(ReportModel.id == report_id).first()

    @staticmethod
    def create_report(
        db: Session,
        title: str,
        report_type: str = "Evaluation",
        model_ids: list[str] = None,
        experiment_ids: list[str] = None,
        benchmark_ids: list[str] = None,
        summary: dict[str, Any] = None,
    ) -> ReportModel:
        model_ids = model_ids or []
        experiment_ids = experiment_ids or []
        benchmark_ids = benchmark_ids or []
        summary = summary or {}

        report = ReportModel(
            title=title,
            report_type=report_type,
            model_ids_json=json.dumps(model_ids),
            experiment_ids_json=json.dumps(experiment_ids),
            benchmark_ids_json=json.dumps(benchmark_ids),
            summary_json=json.dumps(summary),
            metrics_summary_json=json.dumps(summary.get("metrics", {})),
            export_formats_json=json.dumps(["json", "csv"]),
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def export_report_csv(report: ReportModel) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Report Title", report.title])
        writer.writerow(["Report Type", report.report_type])
        writer.writerow(["Generated At", report.created_at.isoformat() if report.created_at else ""])
        writer.writerow([])
        writer.writerow(["Summary Key", "Value"])
        summary = json.loads(report.summary_json) if report.summary_json else {}
        for k, v in summary.items():
            writer.writerow([k, str(v)])
        return output.getvalue()
