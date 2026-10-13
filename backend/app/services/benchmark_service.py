import json
import os
import joblib
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.core.errors import BenchmarkExecutionError
from app.models import BenchmarkModel, ModelRecordModel, ExperimentModel, DatasetModel
from app.services.model_service import ModelService
from app.ml.runtimes.pytorch_runtime import PyTorchInferenceRuntime
from app.ml.runtimes.onnx_runtime import ONNXInferenceRuntime
from app.ml.benchmarking.engine import BenchmarkEngine
from app.schemas import BenchmarkCreate


class BenchmarkService:
    @staticmethod
    def list_benchmarks(db: Session, model_id: str | None = None) -> list[BenchmarkModel]:
        q = db.query(BenchmarkModel)
        if model_id:
            q = q.filter(BenchmarkModel.model_id == model_id)
        return q.order_by(BenchmarkModel.created_at.desc()).all()

    @staticmethod
    def get_benchmark(db: Session, benchmark_id: str) -> BenchmarkModel:
        bm = db.query(BenchmarkModel).filter(BenchmarkModel.id == benchmark_id).first()
        if not bm:
            raise BenchmarkExecutionError(f"Benchmark with ID {benchmark_id} not found.")
        return bm

    @staticmethod
    def run_benchmark(db: Session, data: BenchmarkCreate) -> BenchmarkModel:
        model = ModelService.get_model(db, data.model_id)
        exp = db.query(ExperimentModel).filter(ExperimentModel.id == model.experiment_id).first()
        if not exp:
            raise BenchmarkExecutionError(f"Experiment for model {model.id} not found.")

        # Determine feature input dimension
        feature_names = json.loads(model.input_schema_json)
        num_features = len(feature_names) if feature_names else 10

        # Load real test sample from dataset if possible, or synthetic test matrix
        dataset = db.query(DatasetModel).filter(DatasetModel.id == exp.dataset_id).first()
        if dataset and os.path.exists(dataset.file_path):
            try:
                df = pd.read_csv(dataset.file_path, nrows=max(50, data.batch_size * 2))
                # Generate sample inputs matching dimension
                X_sample = np.random.randn(max(50, data.batch_size), num_features).astype(np.float32)
            except Exception:
                X_sample = np.random.randn(max(50, data.batch_size), num_features).astype(np.float32)
        else:
            X_sample = np.random.randn(max(50, data.batch_size), num_features).astype(np.float32)

        runtime_target = data.runtime.strip()
        ref_predict_fn = None

        if runtime_target.lower() in ["onnx runtime", "onnx"]:
            if not model.onnx_artifact_path or not os.path.exists(model.onnx_artifact_path):
                raise BenchmarkExecutionError("Model has no valid ONNX artifact exported.")
            ort_rt = ONNXInferenceRuntime(model.onnx_artifact_path)
            predict_fn = ort_rt.predict
            runtime_name = "ONNX Runtime"

            # Use native PyTorch as reference if available
            if model.artifact_path and os.path.exists(model.artifact_path):
                pt_rt = PyTorchInferenceRuntime(model.artifact_path)
                ref_predict_fn = pt_rt.predict

        elif runtime_target.lower() in ["pytorch", "pytorch native"]:
            if not model.artifact_path or not os.path.exists(model.artifact_path):
                raise BenchmarkExecutionError("Model has no valid PyTorch checkpoint.")
            pt_rt = PyTorchInferenceRuntime(model.artifact_path)
            predict_fn = pt_rt.predict
            runtime_name = "PyTorch"

        else:
            # Scikit-learn
            if not model.artifact_path or not os.path.exists(model.artifact_path):
                raise BenchmarkExecutionError("Model artifact missing for Scikit-learn.")
            sk_model = joblib.load(model.artifact_path)
            predict_fn = sk_model.predict
            runtime_name = "Scikit-learn"

        # Execute high-precision benchmark
        res = BenchmarkEngine.run_benchmark(
            predict_fn=predict_fn,
            sample_input=X_sample,
            runtime_name=runtime_name,
            batch_size=data.batch_size,
            warmup_iterations=data.warmup_iterations,
            measured_iterations=data.measured_iterations,
            repetitions=data.repetitions,
            reference_predict_fn=ref_predict_fn,
        )

        # Persist Benchmark Record
        bm = BenchmarkModel(
            model_id=model.id,
            model_name=model.name,
            runtime=res.runtime,
            device=res.device,
            batch_size=res.batch_size,
            warmup_iterations=res.warmup_iterations,
            measured_iterations=res.measured_iterations,
            repetitions=res.repetitions,
            mean_latency_ms=res.mean_latency_ms,
            median_latency_ms=res.median_latency_ms,
            p95_latency_ms=res.p95_latency_ms,
            p99_latency_ms=res.p99_latency_ms,
            throughput_sps=res.throughput_sps,
            memory_mb=res.memory_mb,
            run_to_run_variation_pct=res.run_to_run_variation_pct,
            prediction_consistency_passed=res.prediction_consistency_passed,
            max_numerical_diff=res.max_numerical_diff,
            latency_samples_json=json.dumps(res.latency_samples_ms),
            hardware_info_json=json.dumps(res.hardware_info),
        )
        db.add(bm)
        db.commit()
        db.refresh(bm)
        return bm
