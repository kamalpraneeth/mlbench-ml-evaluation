import logging
import sys
from typing import Any


class CustomFormatter(logging.Formatter):
    """Clean structured console formatter with timestamp and level."""
    
    def format(self, record: logging.LogRecord) -> str:
        record.asctime = self.formatTime(record, "%Y-%m-%d %H:%M:%S")
        log_msg = f"[{record.asctime}] [{record.levelname:^8}] [{record.name}] {record.getMessage()}"
        if record.exc_info:
            log_msg += "\n" + self.formatException(record.exc_info)
        return log_msg


def setup_logger(name: str = "mlbench", level: int = logging.INFO) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(CustomFormatter())
        logger.addHandler(handler)
        logger.setLevel(level)
    return logger


logger = setup_logger()
