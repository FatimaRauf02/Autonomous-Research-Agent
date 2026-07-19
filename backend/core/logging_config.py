"""
Centralized logging setup using loguru.
Log files written to F:/research_agent/data/logs/
"""
import sys
from pathlib import Path
from loguru import logger

from core.config import settings


def setup_logging():
    logs_dir = Path(settings.BASE_DATA_DIR) / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)

    
    logger.remove()

   
    logger.add(
        sys.stdout,
        level="INFO",
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> — <level>{message}</level>",
        colorize=True,
    )

    
    logger.add(
        str(logs_dir / "research_agent_{time:YYYY-MM-DD}.log"),
        level="DEBUG",
        rotation="00:00",
        retention="7 days",
        compression="zip",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} — {message}",
    )

   
    logger.add(
        str(logs_dir / "errors.log"),
        level="ERROR",
        rotation="10 MB",
        retention="30 days",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line}\n{message}\n",
    )

    logger.info(f"Logging initialized. Log dir: {logs_dir}")


setup_logging()
