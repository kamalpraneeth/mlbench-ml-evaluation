import json
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.benchmark_service import BenchmarkService
from app.schemas import BenchmarkCreate, BenchmarkResponse

router = APIRouter(prefix="/benchmarks", tags=["Benchmarks"])


def serialize_benchmark(b) -> BenchmarkResponse:
    return BenchmarkResponse(
        id=b.id,
        model_id=b.model_id,
        model_name=b.model_name,
        runtime=b.runtime,
        device=b.device,
        batch_size=b.batch_size,
        warmup_iterations=b.warmup_iterations,
        measured_iterations=b.measured_iterations,
        repetitions=b.repetitions,
        mean_latency_ms=b.mean_latency_ms,
        median_latency_ms=b.median_latency_ms,
        p95_latency_ms=b.p95_latency_ms,
        p99_latency_ms=b.p99_latency_ms,
        throughput_sps=b.throughput_sps,
        memory_mb=b.memory_mb,
        run_to_run_variation_pct=b.run_to_run_variation_pct,
        prediction_consistency_passed=b.prediction_consistency_passed,
        max_numerical_diff=b.max_numerical_diff,
        latency_samples=json.loads(b.latency_samples_json) if b.latency_samples_json else [],
        hardware_info=json.loads(b.hardware_info_json) if b.hardware_info_json else {},
        created_at=b.created_at,
    )


@router.get("", response_model=list[BenchmarkResponse])
def list_benchmarks(model_id: Optional[str] = None, db: Session = Depends(get_db)):
    bms = BenchmarkService.list_benchmarks(db, model_id=model_id)
    return [serialize_benchmark(b) for b in bms]


@router.post("", response_model=BenchmarkResponse)
def run_benchmark(data: BenchmarkCreate, db: Session = Depends(get_db)):
    bm = BenchmarkService.run_benchmark(db, data)
    return serialize_benchmark(bm)


@router.get("/{benchmark_id}", response_model=BenchmarkResponse)
def get_benchmark(benchmark_id: str, db: Session = Depends(get_db)):
    bm = BenchmarkService.get_benchmark(db, benchmark_id)
    return serialize_benchmark(bm)


@router.get("/{benchmark_id}/results")
def get_benchmark_results(benchmark_id: str, db: Session = Depends(get_db)):
    bm = BenchmarkService.get_benchmark(db, benchmark_id)
    return {
        "benchmark_id": bm.id,
        "mean_latency_ms": bm.mean_latency_ms,
        "median_latency_ms": bm.median_latency_ms,
        "p95_latency_ms": bm.p95_latency_ms,
        "p99_latency_ms": bm.p99_latency_ms,
        "throughput_sps": bm.throughput_sps,
        "memory_mb": bm.memory_mb,
        "variation_pct": bm.run_to_run_variation_pct,
        "samples": json.loads(bm.latency_samples_json) if bm.latency_samples_json else [],
        "hardware": json.loads(bm.hardware_info_json) if bm.hardware_info_json else {},
    }
