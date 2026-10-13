from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import logger
from app.core.errors import MLBenchError
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.api.v1.router import api_router
from app.services.dataset_service import DatasetService
from app.services.experiment_service import ExperimentService
from app.services.benchmark_service import BenchmarkService
from app.schemas import ExperimentCreate, BenchmarkCreate, PreprocessingConfig


def seed_initial_demo_data():
    """Initializes sample datasets and trains baseline models if DB is empty."""
    db = SessionLocal()
    try:
        from app.models import DatasetModel, ExperimentModel, ModelRecordModel

        # 1. Register sample datasets if none exist
        if db.query(DatasetModel).count() == 0:
            logger.info("Initializing sample datasets...")
            cs_ds = DatasetService.register_sample_dataset(db, "customer_support")
            hp_ds = DatasetService.register_sample_dataset(db, "house_prices")
            log_ds = DatasetService.register_sample_dataset(db, "log_analytics")
            logger.info("Sample datasets successfully registered.")

            # 2. Train baseline models so user sees immediate live data
            logger.info("Training initial baseline models...")
            # Experiment 1: Scikit-learn Classifier
            exp1 = ExperimentService.run_experiment(
                db,
                ExperimentCreate(
                    name="Customer Support Classifier (Random Forest)",
                    task_type="classification",
                    dataset_id=cs_ds.id,
                    framework="scikit-learn",
                    model_type="RandomForestClassifier",
                    preprocessing=PreprocessingConfig(
                        missing_value_strategy="impute_mean",
                        numeric_scaling="standard",
                        categorical_encoding="onehot",
                    ),
                    hyperparameters={"n_estimators": 50, "max_depth": 8, "random_seed": 42},
                ),
            )

            # Experiment 2: PyTorch MLP Classifier
            exp2 = ExperimentService.run_experiment(
                db,
                ExperimentCreate(
                    name="Customer Support Neural Net (PyTorch MLP)",
                    task_type="classification",
                    dataset_id=cs_ds.id,
                    framework="pytorch",
                    model_type="PyTorchMLP",
                    preprocessing=PreprocessingConfig(
                        missing_value_strategy="impute_mean",
                        numeric_scaling="standard",
                        categorical_encoding="onehot",
                    ),
                    hyperparameters={"epochs": 15, "batch_size": 32, "learning_rate": 0.005, "random_seed": 42},
                ),
            )

            # Experiment 3: Scikit-learn Regressor
            exp3 = ExperimentService.run_experiment(
                db,
                ExperimentCreate(
                    name="House Price Regressor (Random Forest)",
                    task_type="regression",
                    dataset_id=hp_ds.id,
                    framework="scikit-learn",
                    model_type="RandomForestRegressor",
                    preprocessing=PreprocessingConfig(
                        missing_value_strategy="impute_mean",
                        numeric_scaling="standard",
                    ),
                    hyperparameters={"n_estimators": 50, "max_depth": 8, "random_seed": 42},
                ),
            )

            logger.info("Baseline experiments trained successfully.")

            # 3. Run benchmarks for models
            models = db.query(ModelRecordModel).all()
            for m in models:
                if m.framework == "pytorch":
                    # Benchmark native PyTorch
                    BenchmarkService.run_benchmark(
                        db,
                        BenchmarkCreate(
                            model_id=m.id,
                            runtime="PyTorch",
                            batch_size=1,
                            warmup_iterations=5,
                            measured_iterations=30,
                            repetitions=2,
                        ),
                    )
                    # Benchmark ONNX Runtime
                    if m.onnx_artifact_path:
                        BenchmarkService.run_benchmark(
                            db,
                            BenchmarkCreate(
                                model_id=m.id,
                                runtime="ONNX Runtime",
                                batch_size=1,
                                warmup_iterations=5,
                                measured_iterations=30,
                                repetitions=2,
                            ),
                        )
                else:
                    # Benchmark Scikit-learn
                    BenchmarkService.run_benchmark(
                        db,
                        BenchmarkCreate(
                            model_id=m.id,
                            runtime="Scikit-learn",
                            batch_size=1,
                            warmup_iterations=5,
                            measured_iterations=30,
                            repetitions=2,
                        ),
                    )

            logger.info("Baseline benchmarks created successfully.")
    except Exception as e:
        logger.error(f"Error seeding demo data: {e}", exc_info=True)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed demo data
    logger.info("Starting MLBench FastAPI backend...")
    Base.metadata.create_all(bind=engine)
    seed_initial_demo_data()
    yield
    # Shutdown
    logger.info("Shutting down MLBench FastAPI backend...")


app = FastAPI(
    title="MLBench API",
    description="Cross-Framework Model Evaluation & Benchmarking Platform API",
    version=settings.VERSION,
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error handling
@app.exception_handler(MLBenchError)
async def mlbench_exception_handler(request: Request, exc: MLBenchError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "type": exc.__class__.__name__},
    )


@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "tagline": "Train. Compare. Benchmark. Optimize.",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_PREFIX,
    }


# Mount API V1
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
