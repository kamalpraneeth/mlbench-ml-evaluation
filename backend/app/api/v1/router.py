from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.datasets import router as datasets_router
from app.api.v1.experiments import router as experiments_router
from app.api.v1.models import router as models_router
from app.api.v1.benchmarks import router as benchmarks_router
from app.api.v1.comparisons import router as comparisons_router
from app.api.v1.reports import router as reports_router
from app.api.v1.pipelines import router as pipelines_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(dashboard_router)
api_router.include_router(datasets_router)
api_router.include_router(experiments_router)
api_router.include_router(models_router)
api_router.include_router(benchmarks_router)
api_router.include_router(comparisons_router)
api_router.include_router(reports_router)
api_router.include_router(pipelines_router)
