"""
GENERAL TOOLS TELEMETRY
Role: Telemetry and logging utilities for general tools.
Integration: Provides structured diagnostic reporting and performance tracking for the development lifecycle.
Dependencies: Utilizes standard library modules for high-precision timing and ISO 8601 formatting.
"""

from __future__ import annotations
import datetime
import time
import json
from typing import Any, Dict, Optional, NamedTuple

class ToolExecutionMetrics(NamedTuple):
    """Structured metrics for tool execution."""
    name: str
    success: bool
    duration_ms: float
    metadata: Dict[str, Any]

class TelemetryEmitter:
    """
    Handles structured telemetry emission for tool execution.
    Ensures consistent log formatting and metadata enrichment.
    """
    
    @staticmethod
    def get_utc_timestamp() -> str:
        """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
        return datetime.datetime.utcnow().isoformat() + 'Z'

    @classmethod
    def emit(cls, metrics: ToolExecutionMetrics) -> None:
        """
        Emits a structured telemetry log entry.
        
        :param metrics: The ToolExecutionMetrics object to log.
        """
        log_entry = {
            "timestamp": cls.get_utc_timestamp(),
            "event": "TOOL_EXECUTION",
            "data": {
                "name": metrics.name,
                "status": "SUCCESS" if metrics.success else "FAILURE",
                "duration_ms": metrics.duration_ms,
                "metadata": metrics.metadata
            }
        }
        print(json.dumps(log_entry))

def get_utc_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def log_tool_execution(name: str, success: bool, duration: float, metadata: Optional[Dict[str, Any]] = None):
    """
    Legacy-compatible tool execution logger.
    Upgraded to use the TelemetryEmitter for structured output.
    """
    metrics = ToolExecutionMetrics(
        name=name,
        success=success,
        duration_ms=round(duration, 3),
        metadata=metadata or {}
    )
    TelemetryEmitter.emit(metrics)

def measure_execution_time(func):
    """
    Decorator to automatically measure and log tool execution time.
    """
    def wrapper(*args, **kwargs):
        start_time = time.perf_counter()
        try:
            result = func(*args, **kwargs)
            duration = (time.perf_counter() - start_time) * 1000.0
            log_tool_execution(func.__name__, True, duration)
            return result
        except Exception as e:
            duration = (time.perf_counter() - start_time) * 1000.0
            log_tool_execution(func.__name__, False, duration, {"error": str(e)})
            raise e
    return wrapper