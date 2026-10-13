import gc
import os
import platform
import sys
import time
from dataclasses import dataclass
from typing import Any, Callable, Optional
import numpy as np
import psutil

try:
    import torch
except ImportError:
    torch = None

try:
    import onnxruntime as ort
except ImportError:
    ort = None


@dataclass
class BenchmarkExecutionResult:
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
    cold_start_latency_ms: float
    throughput_sps: float
    memory_mb: float
    run_to_run_variation_pct: float
    prediction_consistency_passed: bool
    max_numerical_diff: float
    latency_samples_ms: list[float]
    hardware_info: dict[str, Any]


def get_hardware_environment() -> dict[str, Any]:
    """Retrieves verified hardware and runtime environment details."""
    cpu_freq = psutil.cpu_freq()
    vm = psutil.virtual_memory()

    return {
        "os": platform.system(),
        "os_release": platform.release(),
        "os_version": platform.version(),
        "machine": platform.machine(),
        "processor": platform.processor() or "x86_64",
        "cpu_count_physical": psutil.cpu_count(logical=False) or 1,
        "cpu_count_logical": psutil.cpu_count(logical=True) or 1,
        "cpu_freq_max_mhz": round(cpu_freq.max, 1) if cpu_freq else None,
        "total_ram_gb": round(vm.total / (1024 ** 3), 2),
        "available_ram_gb": round(vm.available / (1024 ** 3), 2),
        "python_version": sys.version.split()[0],
        "torch_version": getattr(torch, "__version__", "N/A"),
        "onnxruntime_version": getattr(ort, "__version__", "N/A"),
        "device_used": "CPU",
        "accelerator_detected": False,
    }


class BenchmarkEngine:
    """High-resolution, cross-framework benchmarking engine for ML inference."""

    @staticmethod
    def run_benchmark(
        predict_fn: Callable[[np.ndarray], Any],
        sample_input: np.ndarray,
        runtime_name: str = "PyTorch",
        batch_size: int = 1,
        warmup_iterations: int = 10,
        measured_iterations: int = 100,
        repetitions: int = 3,
        reference_predict_fn: Optional[Callable[[np.ndarray], Any]] = None,
    ) -> BenchmarkExecutionResult:
        # Prepare inputs with correct batch size
        if sample_input.shape[0] < batch_size:
            repeat_factor = int(np.ceil(batch_size / sample_input.shape[0]))
            batch_input = np.tile(sample_input, (repeat_factor, 1))[:batch_size]
        else:
            batch_input = sample_input[:batch_size]

        batch_input = batch_input.astype(np.float32)

        # 1. Cold start measurement
        gc.collect()
        t_cold_start = time.perf_counter_ns()
        _ = predict_fn(batch_input)
        t_cold_end = time.perf_counter_ns()
        cold_start_ms = round((t_cold_end - t_cold_start) / 1_000_000, 3)

        # 2. Warm-up iterations (discarded from metrics)
        for _ in range(warmup_iterations):
            _ = predict_fn(batch_input)

        # 3. Measured iterations across repetitions
        all_samples_ms: list[float] = []
        repetition_means: list[float] = []

        process = psutil.Process(os.getpid())
        mem_before = process.memory_info().rss

        total_work_samples = 0
        total_active_nanos = 0

        for _ in range(repetitions):
            rep_samples: list[float] = []
            for _ in range(measured_iterations):
                t0 = time.perf_counter_ns()
                _ = predict_fn(batch_input)
                t1 = time.perf_counter_ns()
                
                delta_ns = t1 - t0
                delta_ms = delta_ns / 1_000_000.0
                rep_samples.append(delta_ms)
                all_samples_ms.append(delta_ms)
                total_work_samples += batch_size
                total_active_nanos += delta_ns

            repetition_means.append(float(np.mean(rep_samples)))

        mem_after = process.memory_info().rss
        peak_mem_mb = round(max(mem_before, mem_after) / (1024 * 1024), 2)

        # 4. Statistical aggregation
        samples_arr = np.array(all_samples_ms)
        mean_latency = float(np.mean(samples_arr))
        median_latency = float(np.median(samples_arr))
        p95_latency = float(np.percentile(samples_arr, 95))
        p99_latency = float(np.percentile(samples_arr, 99)) if len(samples_arr) >= 100 else p95_latency

        # Run-to-run variation (Coefficient of Variation between repetition means)
        if len(repetition_means) > 1 and np.mean(repetition_means) > 0:
            variation_pct = float((np.std(repetition_means) / np.mean(repetition_means)) * 100.0)
        else:
            variation_pct = 0.0

        # Throughput = total processed samples / total active inference time
        total_time_seconds = total_active_nanos / 1_000_000_000.0
        throughput = float(total_work_samples / max(total_time_seconds, 1e-6))

        # 5. Prediction consistency check against reference if provided
        consistency_passed = True
        max_diff = 0.0
        if reference_predict_fn is not None:
            try:
                pred_tested = predict_fn(batch_input)
                pred_ref = reference_predict_fn(batch_input)
                diff = np.abs(np.array(pred_tested) - np.array(pred_ref))
                max_diff = float(np.max(diff))
                consistency_passed = bool(np.allclose(pred_tested, pred_ref, rtol=1e-3, atol=1e-4))
            except Exception:
                consistency_passed = False
                max_diff = 999.0

        # Histogram distribution sample (cap to 50 items for JSON transport)
        histogram_samples = [round(float(s), 3) for s in samples_arr[:100]]

        hw = get_hardware_environment()

        return BenchmarkExecutionResult(
            runtime=runtime_name,
            device="CPU",
            batch_size=batch_size,
            warmup_iterations=warmup_iterations,
            measured_iterations=measured_iterations,
            repetitions=repetitions,
            mean_latency_ms=round(mean_latency, 3),
            median_latency_ms=round(median_latency, 3),
            p95_latency_ms=round(p95_latency, 3),
            p99_latency_ms=round(p99_latency, 3),
            cold_start_latency_ms=cold_start_ms,
            throughput_sps=round(throughput, 1),
            memory_mb=peak_mem_mb,
            run_to_run_variation_pct=round(variation_pct, 2),
            prediction_consistency_passed=consistency_passed,
            max_numerical_diff=round(max_diff, 6),
            latency_samples_ms=histogram_samples,
            hardware_info=hw,
        )
