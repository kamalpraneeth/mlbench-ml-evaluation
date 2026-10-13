import os
import numpy as np
import onnx
import onnxruntime as ort
import torch
import torch.nn as nn
from app.ml.runtimes.onnx_runtime import ONNXInferenceRuntime


def test_onnx_export_and_runtime_consistency(tmp_path):
    class SimpleNet(nn.Module):
        def __init__(self):
            super().__init__()
            self.fc1 = nn.Linear(8, 16)
            self.relu = nn.ReLU()
            self.fc2 = nn.Linear(16, 2)

        def forward(self, x):
            return self.fc2(self.relu(self.fc1(x)))

    net = SimpleNet()
    net.eval()
    dummy_input = torch.randn(1, 8, dtype=torch.float32)
    onnx_file = str(tmp_path / "model.onnx")

    torch.onnx.export(
        net,
        dummy_input,
        onnx_file,
        dynamo=False,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
    )

    assert os.path.exists(onnx_file)
    # Check ONNX validity
    onnx_model = onnx.load(onnx_file)
    onnx.checker.check_model(onnx_model)

    # Test runtime consistency
    ort_rt = ONNXInferenceRuntime(onnx_file)
    test_batch = np.random.randn(4, 8).astype(np.float32)

    with torch.no_grad():
        py_out = net(torch.tensor(test_batch)).numpy()

    ort_out = ort_rt.predict(test_batch)

    # Verify numerical closeness within 1e-4 tolerance
    assert np.allclose(py_out, ort_out, rtol=1e-3, atol=1e-4)
