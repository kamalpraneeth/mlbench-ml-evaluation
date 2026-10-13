from datetime import datetime, timezone
import platform
import psutil
from fastapi import APIRouter
from app.core.config import settings
from app.schemas import HealthResponse, SystemStatusResponse, FrameworkStatus
from app.ml.runtimes.tflite_runtime import TFLiteInferenceRuntime

router = APIRouter(tags=["Health & System"])


@router.get("/health", response_model=HealthResponse)
def get_health():
    return HealthResponse(
        status="Healthy",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database="Connected" if settings.DATABASE_URL else "Disconnected",
        timestamp=datetime.now(timezone.utc),
    )


@router.get("/system/status", response_model=SystemStatusResponse)
def get_system_status():
    # Detect ML Framework availability
    frameworks = {}

    # PyTorch
    try:
        import torch
        frameworks["PyTorch"] = FrameworkStatus(
            name="PyTorch",
            available=True,
            version=torch.__version__,
            device="CUDA" if torch.cuda.is_available() else "CPU",
        )
    except Exception:
        frameworks["PyTorch"] = FrameworkStatus(name="PyTorch", available=False)

    # Scikit-learn
    try:
        import sklearn
        frameworks["Scikit-learn"] = FrameworkStatus(
            name="Scikit-learn",
            available=True,
            version=sklearn.__version__,
            device="CPU",
        )
    except Exception:
        frameworks["Scikit-learn"] = FrameworkStatus(name="Scikit-learn", available=False)

    # ONNX Runtime
    try:
        import onnxruntime as ort
        frameworks["ONNX Runtime"] = FrameworkStatus(
            name="ONNX Runtime",
            available=True,
            version=ort.__version__,
            device="CPUExecutionProvider",
        )
    except Exception:
        frameworks["ONNX Runtime"] = FrameworkStatus(name="ONNX Runtime", available=False)

    # TensorFlow Lite
    tflite_avail = TFLiteInferenceRuntime.is_available()
    tflite_ver = None
    if tflite_avail:
        try:
            import tensorflow as tf
            tflite_ver = tf.__version__
        except Exception:
            pass
    frameworks["TensorFlow Lite"] = FrameworkStatus(
        name="TensorFlow Lite",
        available=tflite_avail,
        version=tflite_ver,
        device="CPU",
    )

    # System Resources
    vm = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    return SystemStatusResponse(
        api_server="Healthy",
        database="Connected",
        frameworks=frameworks,
        disk_space_used_gb=round(disk.used / (1024 ** 3), 1),
        disk_space_total_gb=round(disk.total / (1024 ** 3), 1),
        disk_usage_pct=round(disk.percent, 1),
        cpu_usage_pct=round(psutil.cpu_percent(interval=0.1), 1),
        memory_usage_pct=round(vm.percent, 1),
        memory_used_gb=round(vm.used / (1024 ** 3), 2),
        memory_total_gb=round(vm.total / (1024 ** 3), 2),
        environment=settings.ENVIRONMENT,
        version=settings.VERSION,
    )
