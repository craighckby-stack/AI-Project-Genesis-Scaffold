"""
DIAGNOSTIC UTILITIES CORE
=========================
Role: Core logic for diagnostic validation, telemetry generation, and type definitions.
Integration: Delegated from diagnostic_utils.py to maintain modularity and prevent circular dependencies.
System Context: Connects diagnostic engines, health checks, and telemetry collectors with a thread-safe,
                zero-leak, and highly resilient execution layer.

Siphoned from craighckby-stack/AI_Agent_OS concepts of Zero-Leak Sandboxing and Consensus Telemetry.
"""

from __future__ import annotations
import time
import os
import sys
import threading
import datetime
import traceback
import platform
import inspect
import json
from typing import NamedTuple, Any, Dict, Callable, Tuple, Optional, List

class DiagnosticResult(NamedTuple):
    """
    Represents the immutable result of a single diagnostic check.
    """
    passed: bool
    message: str
    metadata: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        """
        Serializes the diagnostic result to a standard dictionary format.
        """
        return {
            "passed": self.passed,
            "message": self.message,
            "metadata": self.metadata
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> DiagnosticResult:
        """
        Deserializes a dictionary into a DiagnosticResult instance.
        """
        return cls(
            passed=bool(data.get("passed", False)),
            message=str(data.get("message", "")),
            metadata=dict(data.get("metadata", {}))
        )


def validate_check_function(func: Callable) -> bool:
    """
    Validates that a check function is callable and can be executed without arguments.
    """
    if not callable(func):
        return False
    try:
        sig = inspect.signature(func)
        # Check if there are any required parameters (parameters without default values)
        required_params = [
            p for p in sig.parameters.values() 
            if p.default is inspect.Parameter.empty and p.kind not in (inspect.Parameter.VAR_POSITIONAL, inspect.Parameter.VAR_KEYWORD)
        ]
        return len(required_params) == 0
    except Exception:
        # Fallback to basic callable check if inspect fails
        return True


def generate_telemetry_metadata() -> Dict[str, Any]:
    """
    Generates standard telemetry metadata for diagnostic results, capturing system and process state.
    """
    metadata = {
        "timestamp": time.time(),
        "timestamp_iso": datetime.datetime.utcnow().isoformat() + 'Z',
        "thread_id": threading.get_ident(),
        "thread_name": threading.current_thread().name,
        "process_id": os.getpid(),
        "python_version": sys.version,
        "platform": platform.platform(),
        "architecture": platform.machine(),
        "cpu_count": os.cpu_count() or "unknown",
        "version": "1.0.0-DIAGNOSTIC-AWARE"
    }
    
    # Try to get memory usage if on Unix/Linux/macOS
    try:
        import resource
        usage = resource.getrusage(resource.RUSAGE_SELF)
        metadata["max_rss_kb"] = usage.ru_maxrss
    except (ImportError, AttributeError):
        pass
        
    return metadata


def format_timestamp() -> str:
    """
    Returns ISO 8601 formatted UTC timestamp with Z suffix.
    """
    return datetime.datetime.utcnow().isoformat() + 'Z'


def summarize_diagnostic_results(checks: Dict[str, bool]) -> Dict[str, Any]:
    """
    Computes summary metrics for diagnostic check results.
    
    :param checks: Dictionary mapping check names to boolean results.
    :return: Summary dictionary with check counts, pass rate, and health flag.
    """
    total_checks = len(checks)
    passed_checks = sum(1 for status in checks.values() if status)
    failed_checks = total_checks - passed_checks
    is_healthy = total_checks > 0 and failed_checks == 0

    return {
        'total': total_checks,
        'passed': passed_checks,
        'failed': failed_checks,
        'is_healthy': is_healthy,
        'pass_rate': round((passed_checks / total_checks * 100), 2) if total_checks > 0 else 0.0
    }


def sanitize_traceback(tb_str: str) -> str:
    """
    Sanitizes traceback strings to remove potential sensitive paths or user home directory names.
    Replaces home directory paths with generic placeholders.
    """
    if not tb_str:
        return ""
    
    try:
        home_dir = os.path.expanduser("~")
        if home_dir and len(home_dir) > 1:
            tb_str = tb_str.replace(home_dir, "/masked_home_dir")
    except Exception:
        pass
        
    # Mask common sensitive environment variables if they appear in traceback
    sensitive_keys = ["API_KEY", "PASSWORD", "SECRET", "TOKEN", "CREDENTIAL", "AUTH"]
    for key in sensitive_keys:
        val = os.environ.get(key)
        if val and len(val) > 4:
            tb_str = tb_str.replace(val, f"[MASKED_{key}]")
            
    return tb_str


def execute_with_timeout(
    func: Callable[[], Any], 
    timeout_seconds: float, 
    fallback_message: str = "Execution timed out"
) -> Tuple[bool, Any, float]:
    """
    Executes a callable within a specified timeout using a background thread.
    Returns a tuple of (completed_successfully, result_or_exception, duration_ms).
    """
    result_container: List[Optional[Any]] = [None]
    exception_container: List[Optional[Exception]] = [None]
    completed = threading.Event()

    def worker():
        try:
            result_container[0] = func()
        except Exception as e:
            exception_container[0] = e
        finally:
            completed.set()

    start_time = time.perf_counter()
    thread = threading.Thread(target=worker, daemon=True)
    thread.start()

    finished = completed.wait(timeout=timeout_seconds)
    duration_ms = (time.perf_counter() - start_time) * 1000.0

    if not finished:
        return False, TimeoutError(fallback_message), round(duration_ms, 3)
    
    if exception_container[0] is not None:
        return True, exception_container[0], round(duration_ms, 3)
        
    return True, result_container[0], round(duration_ms, 3)


class DiagnosticTelemetryAccumulator:
    """
    Thread-safe accumulator for diagnostic telemetry and execution metrics.
    """
    def __init__(self, max_history_size: int = 100):
        self._lock = threading.Lock()
        self._history: List[Dict[str, Any]] = []
        self._max_history_size = max_history_size
        self._stats: Dict[str, Any] = {
            "total_runs": 0,
            "successful_runs": 0,
            "failed_runs": 0,
            "total_duration_ms": 0.0
        }

    def record(self, check_name: str, passed: bool, duration_ms: float, message: str, metadata: Dict[str, Any]) -> None:
        """Records a diagnostic check execution."""
        with self._lock:
            record_entry = {
                "timestamp": format_timestamp(),
                "check_name": check_name,
                "passed": passed,
                "duration_ms": duration_ms,
                "message": message,
                "metadata": metadata
            }
            self._history.append(record_entry)
            if len(self._history) > self._max_history_size:
                self._history.pop(0)

            self._stats["total_runs"] += 1
            if passed:
                self._stats["successful_runs"] += 1
            else:
                self._stats["failed_runs"] += 1
            self._stats["total_duration_ms"] += duration_ms

    def get_history(self) -> List[Dict[str, Any]]:
        """Returns a copy of the recorded history."""
        with self._lock:
            return list(self._history)

    def get_stats(self) -> Dict[str, Any]:
        """Returns a copy of the accumulated statistics."""
        with self._lock:
            stats = dict(self._stats)
            avg_duration = (stats["total_duration_ms"] / stats["total_runs"]) if stats["total_runs"] > 0 else 0.0
            stats["average_duration_ms"] = round(avg_duration, 3)
            stats["total_duration_ms"] = round(stats["total_duration_ms"], 3)
            return stats

    def clear(self) -> None:
        """Clears all accumulated history and stats."""
        with self._lock:
            self._history.clear()
            self._stats = {
                "total_runs": 0,
                "successful_runs": 0,
                "failed_runs": 0,
                "total_duration_ms": 0.0
            }