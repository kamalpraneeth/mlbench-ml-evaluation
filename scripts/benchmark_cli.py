"""CLI Benchmarking utility for MLBench.

Allows running reproducible command-line benchmarks against any registered model.
"""

import argparse
import json
import os
import sys

# Ensure backend on path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

from app.db.session import SessionLocal
from app.models import ModelRecordModel
from app.services.benchmark_service import BenchmarkService
from app.schemas import BenchmarkCreate


def main():
    parser = argparse.ArgumentParser(description="MLBench CLI Benchmark Runner")
    parser.add_argument("--model-id", type=str, help="ID of registered model to benchmark")
    parser.add_argument("--runtime", type=str, default="PyTorch", choices=["PyTorch", "ONNX Runtime", "Scikit-learn"], help="Target runtime")
    parser.add_argument("--batch-size", type=int, default=1, help="Inference batch size")
    parser.add_argument("--warmup", type=int, default=10, help="Number of warmup iterations")
    parser.add_argument("--iterations", type=int, default=100, help="Number of measured iterations")
    parser.add_argument("--repetitions", type=int, default=3, help="Number of repetitions for CV")
    parser.add_argument("--list-models", action="store_true", help="List all available models")

    args = parser.parse_args()
    db = SessionLocal()

    try:
        if args.list_models:
            models = db.query(ModelRecordModel).all()
            print("\n=== REGISTERED MODELS ===")
            for m in models:
                formats = json.loads(m.formats_json) if m.formats_json else []
                print(f"ID: {m.id} | Name: {m.name} | Framework: {m.framework} | Formats: {formats}")
            return

        model_id = args.model_id
        if not model_id:
            first_m = db.query(ModelRecordModel).first()
            if not first_m:
                print("No models registered in database. Run 'python scripts/init_db.py' first.")
                return
            model_id = first_m.id
            print(f"No --model-id specified. Using default: {first_m.name} ({model_id})")

        print(f"\n[BENCHMARK] Executing {args.runtime} benchmark (Batch: {args.batch_size}, Iterations: {args.iterations})...")
        payload = BenchmarkCreate(
            model_id=model_id,
            runtime=args.runtime,
            batch_size=args.batch_size,
            warmup_iterations=args.warmup,
            measured_iterations=args.iterations,
            repetitions=args.repetitions,
        )

        bm = BenchmarkService.run_benchmark(db, payload)
        print("\n=== BENCHMARK EXECUTION RESULTS ===")
        print(f"Model: {bm.model_name}")
        print(f"Runtime: {bm.runtime} ({bm.device})")
        print(f"Batch Size: {bm.batch_size}")
        print(f"Mean Latency: {bm.mean_latency_ms:.3f} ms")
        print(f"Median Latency: {bm.median_latency_ms:.3f} ms")
        print(f"P95 Latency: {bm.p95_latency_ms:.3f} ms")
        print(f"P99 Latency: {bm.p99_latency_ms:.3f} ms")
        print(f"Throughput: {bm.throughput_sps:,.1f} samples/sec")
        print(f"Memory Usage: {bm.memory_mb:.1f} MB")
        print(f"Variation (CV): {bm.run_to_run_variation_pct:.2f}%")
        print(f"Prediction Consistency: {'PASSED' if bm.prediction_consistency_passed else 'FAILED'}")
        print(f"Benchmark Record ID: {bm.id}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
