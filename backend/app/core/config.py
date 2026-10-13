import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "MLBench"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"

    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent
    SAMPLE_DATA_DIR: Path = BASE_DIR / "sample_data"
    ARTIFACTS_DIR: Path = BASE_DIR / "artifacts"
    REPORTS_DIR: Path = BASE_DIR / "reports"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR / 'mlbench.db'}"
    )

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    # Benchmarking Defaults
    DEFAULT_WARMUP_ITERATIONS: int = 10
    DEFAULT_MEASURED_ITERATIONS: int = 100
    DEFAULT_BATCH_SIZE: int = 1
    DEFAULT_REPETITIONS: int = 3

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

# Ensure directories exist
os.makedirs(settings.SAMPLE_DATA_DIR, exist_ok=True)
os.makedirs(settings.ARTIFACTS_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
