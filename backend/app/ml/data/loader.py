import os
from pathlib import Path
from typing import Optional
import pandas as pd
from app.core.errors import PreprocessingError


MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50MB limit


def load_dataset_csv(file_path: str | Path) -> pd.DataFrame:
    """Safely loads a CSV file into a pandas DataFrame with validation."""
    path = Path(file_path)
    if not path.exists():
        raise PreprocessingError(f"File not found: {path}")
    
    file_size = path.stat().st_size
    if file_size > MAX_FILE_SIZE_BYTES:
        raise PreprocessingError(f"File size ({file_size} bytes) exceeds maximum limit of {MAX_FILE_SIZE_BYTES} bytes.")

    try:
        # Load sample first to verify CSV structure
        df = pd.read_csv(path, nrows=5)
        if df.empty or len(df.columns) < 2:
            raise PreprocessingError("CSV must contain at least 2 columns and cannot be empty.")
        
        # Load complete dataset
        full_df = pd.read_csv(path)
        return full_df
    except Exception as e:
        raise PreprocessingError(f"Failed to parse CSV file: {str(e)}")
