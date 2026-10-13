class MLBenchError(Exception):
    """Base exception for all MLBench operations."""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class DatasetNotFoundError(MLBenchError):
    def __init__(self, dataset_id: str):
        super().__init__(f"Dataset with ID '{dataset_id}' not found.", status_code=404)


class ExperimentNotFoundError(MLBenchError):
    def __init__(self, experiment_id: str):
        super().__init__(f"Experiment with ID '{experiment_id}' not found.", status_code=404)


class ModelNotFoundError(MLBenchError):
    def __init__(self, model_id: str):
        super().__init__(f"Model with ID '{model_id}' not found.", status_code=404)


class BenchmarkNotFoundError(MLBenchError):
    def __init__(self, benchmark_id: str):
        super().__init__(f"Benchmark run with ID '{benchmark_id}' not found.", status_code=404)


class PreprocessingError(MLBenchError):
    def __init__(self, message: str):
        super().__init__(f"Data preprocessing failed: {message}", status_code=422)


class TrainingError(MLBenchError):
    def __init__(self, message: str):
        super().__init__(f"Model training failed: {message}", status_code=500)


class ExportError(MLBenchError):
    def __init__(self, message: str):
        super().__init__(f"Model export failed: {message}", status_code=500)


class BenchmarkExecutionError(MLBenchError):
    def __init__(self, message: str):
        super().__init__(f"Benchmark execution failed: {message}", status_code=500)
