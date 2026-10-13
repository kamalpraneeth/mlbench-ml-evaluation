from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.comparison_service import ComparisonService
from app.schemas import ComparisonRequest, ComparisonResponse

router = APIRouter(prefix="/comparisons", tags=["Comparisons"])


@router.post("", response_model=ComparisonResponse)
def compare_models(req: ComparisonRequest, db: Session = Depends(get_db)):
    return ComparisonService.compare_models(db, req.model_ids)
