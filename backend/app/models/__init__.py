from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DatasetModel(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    task_type = Column(String(50), nullable=False, default="classification")
    target_column = Column(String(100), nullable=False)
    row_count = Column(Integer, default=0)
    col_count = Column(Integer, default=0)
    columns_json = Column(Text, default="[]")
    summary_stats_json = Column(Text, default="{}")
    quality_warnings_json = Column(Text, default="[]")
    status = Column(String(50), default="Ready")
    created_at = Column(DateTime, default=utc_now)

    experiments = relationship("ExperimentModel", back_populates="dataset", cascade="all, delete-orphan")


class ExperimentModel(Base):
    __tablename__ = "experiments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(120), nullable=False)
    task_type = Column(String(50), nullable=False)  # classification | regression
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False)
    framework = Column(String(50), nullable=False)  # scikit-learn | pytorch
    model_type = Column(String(100), nullable=False)
    status = Column(String(50), default="Pending")  # Pending, Training, Completed, Failed, Cancelled
    hyperparameters_json = Column(Text, default="{}")
    preprocessing_config_json = Column(Text, default="{}")
    metrics_json = Column(Text, default="{}")
    confusion_matrix_json = Column(Text, default="{}")
    loss_curve_json = Column(Text, default="[]")
    logs_text = Column(Text, default="")
    training_duration_sec = Column(Float, default=0.0)
    artifact_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)

    dataset = relationship("DatasetModel", back_populates="experiments")
    models = relationship("ModelRecordModel", back_populates="experiment", cascade="all, delete-orphan")


class ModelRecordModel(Base):
    __tablename__ = "models"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    experiment_id = Column(String(36), ForeignKey("experiments.id"), nullable=False)
    name = Column(String(120), nullable=False)
    version = Column(String(50), default="v1.0.0")
    framework = Column(String(50), nullable=False)
    task_type = Column(String(50), nullable=False)
    dataset_name = Column(String(100), default="")
    input_schema_json = Column(Text, default="[]")
    output_schema_json = Column(Text, default="{}")
    formats_json = Column(Text, default='["native"]')  # e.g. ["pytorch", "onnx", "tflite"]
    artifact_path = Column(String(500), nullable=True)
    onnx_artifact_path = Column(String(500), nullable=True)
    tflite_artifact_path = Column(String(500), nullable=True)
    artifact_size_bytes = Column(Integer, default=0)
    validation_status = Column(String(50), default="Validated")
    metrics_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=utc_now)

    experiment = relationship("ExperimentModel", back_populates="models")
    benchmarks = relationship("BenchmarkModel", back_populates="model", cascade="all, delete-orphan")


class BenchmarkModel(Base):
    __tablename__ = "benchmarks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_id = Column(String(36), ForeignKey("models.id"), nullable=False)
    model_name = Column(String(120), nullable=False)
    runtime = Column(String(50), nullable=False)  # PyTorch, ONNX Runtime, TFLite, Scikit-learn
    device = Column(String(50), default="CPU")
    batch_size = Column(Integer, default=1)
    warmup_iterations = Column(Integer, default=10)
    measured_iterations = Column(Integer, default=100)
    repetitions = Column(Integer, default=3)
    mean_latency_ms = Column(Float, default=0.0)
    median_latency_ms = Column(Float, default=0.0)
    p95_latency_ms = Column(Float, default=0.0)
    p99_latency_ms = Column(Float, default=0.0)
    throughput_sps = Column(Float, default=0.0)
    memory_mb = Column(Float, default=0.0)
    run_to_run_variation_pct = Column(Float, default=0.0)
    prediction_consistency_passed = Column(Boolean, default=True)
    max_numerical_diff = Column(Float, default=0.0)
    latency_samples_json = Column(Text, default="[]")
    hardware_info_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=utc_now)

    model = relationship("ModelRecordModel", back_populates="benchmarks")


class EvaluationModel(Base):
    __tablename__ = "evaluations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    experiment_id = Column(String(36), nullable=False)
    model_id = Column(String(36), nullable=True)
    dataset_id = Column(String(36), nullable=False)
    split = Column(String(50), default="test")
    sample_count = Column(Integer, default=0)
    metrics_json = Column(Text, default="{}")
    confusion_matrix_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=utc_now)


class ReportModel(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    report_type = Column(String(50), default="Evaluation")  # Evaluation, Benchmark, Comparison
    model_ids_json = Column(Text, default="[]")
    experiment_ids_json = Column(Text, default="[]")
    benchmark_ids_json = Column(Text, default="[]")
    summary_json = Column(Text, default="{}")
    metrics_summary_json = Column(Text, default="{}")
    export_formats_json = Column(Text, default='["json", "csv"]')
    created_at = Column(DateTime, default=utc_now)


class PipelineModel(Base):
    __tablename__ = "pipelines"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False)
    trigger_type = Column(String(50), default="Scheduled")
    schedule = Column(String(50), default="0 2 * * *")
    status = Column(String(50), default="Idle")  # Success, Running, Idle, Failed
    last_run = Column(DateTime, nullable=True)
    next_run = Column(DateTime, nullable=True)
    duration_sec = Column(Float, default=0.0)
    failure_reason = Column(Text, nullable=True)
    run_history_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=utc_now)
