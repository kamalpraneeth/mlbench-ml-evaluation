import numpy as np
from app.ml.benchmarking.engine import BenchmarkEngine, get_hardware_environment


def test_hardware_detection():
    hw = get_hardware_environment()
    assert "os" in hw
    assert "cpu_count_logical" in hw
    assert hw["cpu_count_logical"] >= 1
    assert "total_ram_gb" in hw
    assert hw["total_ram_gb"] > 0


def test_benchmark_engine_run():
    # Simple predict function
    def dummy_predict(x: np.ndarray) -> np.ndarray:
        return np.dot(x, np.ones((x.shape[1], 2)))

    dummy_input = np.random.randn(10, 8).astype(np.float32)

    res = BenchmarkEngine.run_benchmark(
        predict_fn=dummy_predict,
        sample_input=dummy_input,
        runtime_name="TestRuntime",
        batch_size=2,
        warmup_iterations=5,
        measured_iterations=20,
        repetitions=2,
    )

    assert res.runtime == "TestRuntime"
    assert res.mean_latency_ms >= 0.0
    assert res.p95_latency_ms >= res.mean_latency_ms or res.p95_latency_ms >= res.median_latency_ms
    assert res.throughput_sps > 0.0
    assert len(res.latency_samples_ms) > 0
    assert res.prediction_consistency_passed is True
