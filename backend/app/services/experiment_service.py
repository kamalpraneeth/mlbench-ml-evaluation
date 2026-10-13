from datetime import datetime, timezone
import json
import os
from typing import Any, Optional
import pandas as pd
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import ExperimentNotFoundError, TrainingError
from app.models import ExperimentModel, ModelRecordModel, EvaluationModel
from app.services.dataset_service import DatasetService
from app.ml.preprocessing.pipeline import DataPreprocessor
from app.ml.training.sklearn_trainer import SklearnTrainer
from app.ml.training.pytorch_trainer import PyTorchTrainer
from app.schemas import ExperimentCreate


class ExperimentService:
    @staticmethod
    def list_experiments(
        db: Session,
        task: Optional[str] = None,
        framework: Optional[str] = None,
        status: Optional[str] = None,
    ) -> list[ExperimentModel]:
        query = db.query(ExperimentModel)
        if task:
            query = query.filter(ExperimentModel.task_type == task)
        if framework:
            query = query.filter(ExperimentModel.framework == framework)
        if status:
            query = query.filter(ExperimentModel.status == status)
        return query.order_by(ExperimentModel.created_at.desc()).all()

    @staticmethod
    def get_experiment(db: Session, experiment_id: str) -> ExperimentModel:
        exp = db.query(ExperimentModel).filter(ExperimentModel.id == experiment_id).first()
        if not exp:
            raise ExperimentNotFoundError(experiment_id)
        return exp

    @staticmethod
    def run_experiment(db: Session, data: ExperimentCreate) -> ExperimentModel:
        dataset = DatasetService.get_dataset(db, data.dataset_id)
        df = pd.read_csv(dataset.file_path)

        prep_cfg = data.preprocessing
        preprocessor = DataPreprocessor(
            task_type=data.task_type,
            missing_strategy=prep_cfg.missing_value_strategy,
            numeric_scaling=prep_cfg.numeric_scaling,
            handle_duplicates=prep_cfg.handle_duplicates,
            train_split=prep_cfg.train_split,
            val_split=prep_cfg.val_split,
            test_split=prep_cfg.test_split,
            random_seed=prep_cfg.random_seed,
        )

        preprocessed = preprocessor.fit_transform_dataset(df, target_column=dataset.target_column)

        # Create experiment row in DB
        exp = ExperimentModel(
            name=data.name,
            task_type=data.task_type,
            dataset_id=dataset.id,
            framework=data.framework,
            model_type=data.model_type,
            status="Training",
            hyperparameters_json=json.dumps(data.hyperparameters),
            preprocessing_config_json=json.dumps(preprocessed.pipeline_state),
            created_at=datetime.now(timezone.utc),
        )
        db.add(exp)
        db.commit()
        db.refresh(exp)

        # Train model
        try:
            if data.framework.lower() == "scikit-learn":
                trainer = SklearnTrainer(model_type=data.model_type, task_type=data.task_type)
            elif data.framework.lower() == "pytorch":
                trainer = PyTorchTrainer(model_type=data.model_type, task_type=data.task_type)
            else:
                raise TrainingError(f"Unsupported framework: {data.framework}")

            result = trainer.train(
                X_train=preprocessed.X_train,
                y_train=preprocessed.y_train,
                X_val=preprocessed.X_val,
                y_val=preprocessed.y_val,
                X_test=preprocessed.X_test,
                y_test=preprocessed.y_test,
                target_names=preprocessed.target_classes,
                hyperparameters=data.hyperparameters,
            )

            # Update experiment with actual results
            exp.status = "Completed"
            exp.metrics_json = json.dumps(result.metrics)
            exp.confusion_matrix_json = json.dumps(result.confusion_matrix) if result.confusion_matrix else "{}"
            exp.loss_curve_json = json.dumps(result.loss_curve)
            exp.logs_text = result.logs
            exp.training_duration_sec = result.training_duration_sec
            exp.artifact_path = result.artifact_path
            exp.completed_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(exp)

            # Register Model in Model Registry
            formats = ["native"]
            if result.onnx_path:
                formats.append("onnx")

            model_record = ModelRecordModel(
                experiment_id=exp.id,
                name=f"{exp.name} ({exp.model_type})",
                version="v1.0.0",
                framework=data.framework,
                task_type=data.task_type,
                dataset_name=dataset.name,
                input_schema_json=json.dumps(preprocessed.feature_names),
                output_schema_json=json.dumps({
                    "task": data.task_type,
                    "classes": preprocessed.target_classes,
                }),
                formats_json=json.dumps(formats),
                artifact_path=result.artifact_path,
                onnx_artifact_path=result.onnx_path,
                artifact_size_bytes=result.artifact_size_bytes,
                validation_status="Validated",
                metrics_json=json.dumps(result.metrics),
            )
            db.add(model_record)

            # Create Evaluation record
            evaluation = EvaluationModel(
                experiment_id=exp.id,
                model_id=model_record.id,
                dataset_id=dataset.id,
                split="test",
                sample_count=len(preprocessed.y_test),
                metrics_json=json.dumps(result.metrics),
                confusion_matrix_json=json.dumps(result.confusion_matrix) if result.confusion_matrix else "{}",
            )
            db.add(evaluation)
            db.commit()

            return exp
        except Exception as e:
            exp.status = "Failed"
            exp.logs_text = f"[ERROR] Execution failed: {str(e)}"
            exp.completed_at = datetime.now(timezone.utc)
            db.commit()
            raise TrainingError(str(e))
