import json
import time
from typing import Any
import joblib
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.core.errors import ModelNotFoundError, MLBenchError
from app.models import ModelRecordModel, ExperimentModel
from app.ml.runtimes.pytorch_runtime import PyTorchInferenceRuntime
from app.ml.runtimes.onnx_runtime import ONNXInferenceRuntime
from app.ml.runtimes.tflite_runtime import TFLiteInferenceRuntime
from app.schemas import PredictResponse


class ModelService:
    @staticmethod
    def list_models(db: Session) -> list[ModelRecordModel]:
        return db.query(ModelRecordModel).order_by(ModelRecordModel.created_at.desc()).all()

    @staticmethod
    def get_model(db: Session, model_id: str) -> ModelRecordModel:
        model = db.query(ModelRecordModel).filter(ModelRecordModel.id == model_id).first()
        if not model:
            raise ModelNotFoundError(model_id)
        return model

    @staticmethod
    def predict(db: Session, model_id: str, inputs: list[dict[str, Any]], runtime: str = "native") -> PredictResponse:
        model = ModelService.get_model(db, model_id)
        exp = db.query(ExperimentModel).filter(ExperimentModel.id == model.experiment_id).first()
        if not exp:
            raise MLBenchError("Associated experiment for model not found.")

        # Reconstruct input features
        prep_cfg = json.loads(exp.preprocessing_config_json)
        feature_names = prep_cfg.get("final_feature_names", [])

        # Build feature matrix
        df_inputs = pd.DataFrame(inputs)
        X = np.zeros((len(inputs), len(feature_names)), dtype=np.float32)
        for i, col in enumerate(feature_names):
            if col in df_inputs.columns:
                X[:, i] = pd.to_numeric(df_inputs[col], errors="coerce").fillna(0.0).to_numpy()

        t0 = time.perf_counter()
        probs = None

        if runtime == "onnx" and model.onnx_artifact_path:
            ort_rt = ONNXInferenceRuntime(model.onnx_artifact_path)
            raw_out = ort_rt.predict(X)
            runtime_used = "ONNX Runtime"
            if model.task_type == "classification":
                # Softmax if logits
                exp_vals = np.exp(raw_out - np.max(raw_out, axis=1, keepdims=True))
                probs_arr = exp_vals / np.sum(exp_vals, axis=1, keepdims=True)
                preds = np.argmax(probs_arr, axis=1).tolist()
                probs = probs_arr.tolist()
            else:
                preds = raw_out.flatten().tolist()
        elif model.framework.lower() == "pytorch" and model.artifact_path:
            pt_rt = PyTorchInferenceRuntime(model.artifact_path)
            raw_out = pt_rt.predict(X)
            runtime_used = "PyTorch Native"
            if model.task_type == "classification":
                exp_vals = np.exp(raw_out - np.max(raw_out, axis=1, keepdims=True))
                probs_arr = exp_vals / np.sum(exp_vals, axis=1, keepdims=True)
                preds = np.argmax(probs_arr, axis=1).tolist()
                probs = probs_arr.tolist()
            else:
                preds = raw_out.flatten().tolist()
        else:
            # Scikit-learn native
            estimator = joblib.load(model.artifact_path)
            raw_preds = estimator.predict(X)
            runtime_used = "Scikit-learn Native"
            preds = raw_preds.tolist()
            if hasattr(estimator, "predict_proba"):
                probs = estimator.predict_proba(X).tolist()

        latency_ms = round((time.perf_counter() - t0) * 1000.0, 3)

        # Map integer predictions to class labels if available
        output_schema = json.loads(model.output_schema_json)
        classes = output_schema.get("classes")
        if classes and model.task_type == "classification":
            preds = [classes[int(p)] if int(p) < len(classes) else str(p) for p in preds]

        return PredictResponse(
            model_id=model.id,
            runtime_used=runtime_used,
            predictions=preds,
            probabilities=probs,
            latency_ms=latency_ms,
        )
