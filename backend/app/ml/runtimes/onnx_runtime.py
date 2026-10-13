import os
from typing import Any
import numpy as np
import onnxruntime as ort


class ONNXInferenceRuntime:
    """High-performance cross-framework inference engine using ONNX Runtime."""

    def __init__(self, onnx_model_path: str):
        if not os.path.exists(onnx_model_path):
            raise FileNotFoundError(f"ONNX model file not found at {onnx_model_path}")
        
        # CPU execution provider
        self.session = ort.InferenceSession(
            onnx_model_path,
            providers=["CPUExecutionProvider"]
        )
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name

    def predict(self, X: np.ndarray) -> np.ndarray:
        arr = X.astype(np.float32)
        outputs = self.session.run([self.output_name], {self.input_name: arr})
        return outputs[0]
