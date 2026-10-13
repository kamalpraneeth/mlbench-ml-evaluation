from typing import Any, Optional
import numpy as np


class TFLiteInferenceRuntime:
    """Optional TensorFlow Lite inference runtime with graceful degradation."""

    _tf_available: Optional[bool] = None

    @classmethod
    def is_available(cls) -> bool:
        if cls._tf_available is None:
            try:
                import tensorflow as tf
                cls._tf_available = hasattr(tf, "lite")
            except Exception:
                cls._tf_available = False
        return cls._tf_available

    def __init__(self, tflite_model_path: str):
        if not self.is_available():
            raise RuntimeError("TensorFlow Lite runtime is not available in the current Python environment.")
        
        import tensorflow as tf
        self.interpreter = tf.lite.Interpreter(model_path=tflite_model_path)
        self.interpreter.allocate_tensors()
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()

    def predict(self, X: np.ndarray) -> np.ndarray:
        arr = X.astype(np.float32)
        # TFLite input shape setting
        self.interpreter.resize_tensor_input(self.input_details[0]["index"], arr.shape)
        self.interpreter.allocate_tensors()
        self.interpreter.set_tensor(self.input_details[0]["index"], arr)
        self.interpreter.invoke()
        output_data = self.interpreter.get_tensor(self.output_details[0]["index"])
        return output_data
