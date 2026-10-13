import json
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.report_service import ReportService
from app.schemas import ReportResponse

router = APIRouter(prefix="/reports", tags=["Reports"])


def serialize_report(r) -> ReportResponse:
    return ReportResponse(
        id=r.id,
        title=r.title,
        report_type=r.report_type,
        model_ids=json.loads(r.model_ids_json) if r.model_ids_json else [],
        experiment_ids=json.loads(r.experiment_ids_json) if r.experiment_ids_json else [],
        benchmark_ids=json.loads(r.benchmark_ids_json) if r.benchmark_ids_json else [],
        summary=json.loads(r.summary_json) if r.summary_json else {},
        metrics_summary=json.loads(r.metrics_summary_json) if r.metrics_summary_json else {},
        export_formats=json.loads(r.export_formats_json) if r.export_formats_json else ["json", "csv"],
        created_at=r.created_at,
    )


@router.get("", response_model=list[ReportResponse])
def list_reports(db: Session = Depends(get_db)):
    reports = ReportService.list_reports(db)
    return [serialize_report(r) for r in reports]


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: str, db: Session = Depends(get_db)):
    r = ReportService.get_report(db, report_id)
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")
    return serialize_report(r)


@router.get("/{report_id}/export")
def export_report(report_id: str, format: str = Query("json", pattern="^(json|csv)$"), db: Session = Depends(get_db)):
    r = ReportService.get_report(db, report_id)
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")

    if format == "csv":
        csv_content = ReportService.export_report_csv(r)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=mlbench_report_{report_id}.csv"},
        )

    # JSON export
    data = serialize_report(r).model_dump(mode="json")
    return data
