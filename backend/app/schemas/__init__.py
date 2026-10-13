from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


# ==========================================
# Common / System Schemas
# ==========================================

class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    database: str
    timestamp: datetime


class FrameworkStatus(BaseModel):
    name: str
    available: bool
    version: Optional[str] = None
    device: Optional[str] = "CPU"


class SystemStatusResponse(BaseModel):
    api_server: str
    database: str
    frameworks: dict[str, FrameworkStatus]
    disk_space_used_gb: float
    disk_space_total_gb: float
    disk_usage_pct: float
    cpu_usage_pct: float
    memory_usage_pct: float
    memory_used_gb: float
    memory_total_gb: float
    environment: str
    version: str


# ==========================================
# Dataset Schemas
# ==========================================

class DatasetCreate(BaseModel):
    name: str
    filename: Optional[str] = None
    sample_key: Optional[str] = None  # e.g. "customer_support", "house_prices", "log_analytics"
    task_type: str = "classification"
    target_column: str


class ColumnMetadata(BaseModel):
    name: str
    dtype: str
    missing_count: int
    missing_pct: float
    unique_count: int
    is_numeric: bool
    mean: Optional[float] = None
    std: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None


class DatasetPreview(BaseModel):
    columns: list[str]
    rows: list[dict[str, Any]]
    total_rows: int
    total_columns: int


class DatasetQuality(BaseModel):
    dataset_id: str
    row_count: int
    col_count: int
    missing_values_total: int
    duplicate_rows_count: int
    quality_score: float
    warnings: list[str]
    columns: list[ColumnMetadata]


class DatasetResponse(BaseModel):
    id: str
    name: str
    filename: str
    task_type: str
    target_column: str
    row_count: int
    col_count: int
    status: str
    created_at: datetime


# ==========================================
# Experiment Schemas
# ==========================================

class PreprocessingConfig(BaseModel):
    missing_value_strategy: str = "impute_mean"  # impute_mean, impute_median, drop
    numeric_scaling: str = "standard"  # standard, minmax, robust, none
    categorical_encoding: str = "onehot"  # onehot, ordinal
    handle_duplicates: bool = True
    train_split: float = 0.70
    val_split: float = 0.15
    test_split: float = 0.15
    random_seed: int = 42


class ExperimentCreate(BaseModel):
    name: str
    task_type: str  # classification | regression
    dataset_id: str
    framework: str  # scikit-learn | pytorch
    model_type: str  # RandomForestClassifier, LogisticRegression, PyTorchMLPClassifier, etc.
    preprocessing: PreprocessingConfig = Field(default_factory=PreprocessingConfig)
    hyperparameters: dict[str, Any] = Field(default_factory=dict)


class ExperimentResponse(BaseModel):
    id: str
    name: str
    task_type: str
    dataset_id: str
    dataset_name: Optional[str] = None
    framework: str
    model_type: str
    status: str
    hyperparameters: dict[str, Any]
    preprocessing: dict[str, Any]
    metrics: dict[str, Any]
    confusion_matrix: Optional[dict[str, Any]] = None
    loss_curve: Optional[list[dict[str, Any]]] = None
    logs: Optional[str] = None
    training_duration_sec: float
    created_at: datetime
    completed_at: Optional[datetime] = None


# ==========================================
# Model Record Schemas
# ==========================================

class ModelResponse(BaseModel):
    id: str
    experiment_id: str
    name: str
    version: str
    framework: str
    task_type: str
    dataset_name: str
    formats: list[str]
    artifact_size_bytes: int
    validation_status: str
    metrics: dict[str, Any]
    created_at: datetime


class PredictRequest(BaseModel):
    runtime: str = "native"  # native, onnx, tflite
    inputs: list[dict[str, Any]]


class PredictResponse(BaseModel):
    model_id: str
    runtime_used: str
    predictions: list[Any]
    probabilities: Optional[list[list[float]]] = None
    latency_ms: float


# ==========================================
# Benchmark Schemas
# ==========================================

class BenchmarkCreate(BaseModel):
    model_id: str
    runtime: str = "PyTorch"  # PyTorch, ONNX Runtime, TFLite, Scikit-learn
    batch_size: int = 1
    warmup_iterations: int = 10
    measured_iterations: int = 100
    repetitions: int = 3
    dataset_id: Optional[str] = None


class BenchmarkResponse(BaseModel):
    id: str
    model_id: str
    model_name: str
    runtime: str
    device: str
    batch_size: int
    warmup_iterations: int
    measured_iterations: int
    repetitions: int
    mean_latency_ms: float
    median_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    throughput_sps: float
    memory_mb: float
    run_to_run_variation_pct: float
    prediction_consistency_passed: bool
    max_numerical_diff: float
    latency_samples: list[float]
    hardware_info: dict[str, Any]
    created_at: datetime


# ==========================================
# Comparison Schemas
# ==========================================

class ComparisonRequest(BaseModel):
    model_ids: list[str]


class ModelComparisonItem(BaseModel):
    model_id: str
    name: str
    framework: str
    task_type: str
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1: Optional[float] = None
    mae: Optional[float] = None
    mse: Optional[float] = None
    rmse: Optional[float] = None
    r2: Optional[float] = None
    model_size_mb: float
    mean_latency_ms: Optional[float] = None
    p95_latency_ms: Optional[float] = None
    throughput_sps: Optional[float] = None
    memory_mb: Optional[float] = None
    supported_runtimes: list[str]
    consistency_passed: bool = True


class ComparisonResponse(BaseModel):
    task_type: str
    models: list[ModelComparisonItem]


# ==========================================
# Report Schemas
# ==========================================

class ReportResponse(BaseModel):
    id: str
    title: str
    report_type: str
    model_ids: list[str]
    experiment_ids: list[str]
    benchmark_ids: list[str]
    summary: dict[str, Any]
    metrics_summary: dict[str, Any]
    export_formats: list[str]
    created_at: datetime


# ==========================================
# Pipeline Schemas
# ==========================================

class PipelineResponse(BaseModel):
    id: str
    name: str
    trigger_type: str
    schedule: str
    status: str
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    duration_sec: float
    failure_reason: Optional[str] = None
    run_history: list[dict[str, Any]]
    created_at: datetime


# ==========================================
# Dashboard Schemas
# ==========================================

class DashboardSummaryResponse(BaseModel):
    total_experiments: int
    models_registered: int
    successful_evaluations: int
    benchmark_runs: int
    avg_inference_latency_ms: float
    best_performing_model: Optional[dict[str, Any]] = None
    performance_comparison: list[dict[str, Any]]
    latency_comparison: list[dict[str, Any]]
    recent_experiments: list[dict[str, Any]]
    recent_benchmarks: list[dict[str, Any]]
    system_status: dict[str, Any]
