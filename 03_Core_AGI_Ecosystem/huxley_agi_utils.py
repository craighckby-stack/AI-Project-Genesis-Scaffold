"""
HUXLEY AGI UTILITIES
Role: Telemetry, cognitive metric analysis, and verification helper functions for Huxley AGI core.
Integration: Supporting module for huxley_agi.py. Provides health telemetry and module check runners.
Dependencies: None (Standard Library only)
"""

from __future__ import annotations
import time
import uuid
import datetime
import platform
import os
import sys
import logging
from typing import Dict, Any, Tuple, Callable, Optional

logger = logging.getLogger("HuxleyAGIUtils")

def generate_cognitive_id(prefix: str = "HUX") -> str:
    """Generates a unique cognitive identifier with timestamp suffix."""
    unique_suffix = uuid.uuid4().hex[:8].upper()
    return f"{prefix}-{int(time.time())}-{unique_suffix}"

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

def execute_cognitive_check(check_fn: Callable) -> Tuple[bool, float, Optional[str]]:
    """
    Executes a cognitive check callable with execution timing and exception capturing.
    
    Returns:
        Tuple of (passed: bool, duration_ms: float, error_message: Optional[str])
    """
    start_time = time.perf_counter()
    try:
        result = check_fn()
        duration_ms = round((time.perf_counter() - start_time) * 1000.0, 3)
        passed = bool(result) if result is not None else True
        return passed, duration_ms, None
    except Exception as exc:
        duration_ms = round((time.perf_counter() - start_time) * 1000.0, 3)
        logger.error(f"Cognitive check failure in module execution: {str(exc)}")
        return False, duration_ms, str(exc)

def get_system_telemetry() -> Dict[str, Any]:
    """Retrieves system runtime metrics and environmental telemetry."""
    telemetry = {
        "timestamp": format_timestamp(),
        "python_version": sys.version.split()[0],
        "platform": platform.platform(),
        "processor": platform.processor() or "unknown",
        "pid": os.getpid(),
        "uptime_sec": round(time.monotonic(), 2)
    }
    
    try:
        import resource
        usage = resource.getrusage(resource.RUSAGE_SELF)
        telemetry["max_rss_mb"] = round(usage.ru_maxrss / 1024.0, 2)
    except Exception:
        telemetry["max_rss_mb"] = -1.0

    return telemetry

def compute_alignment_metric(ethics_level: float, verified_modules: int, total_modules: int) -> float:
    """
    Computes an overall ethical and cognitive alignment score [0.0 to 1.0].
    """
    if total_modules <= 0:
        module_ratio = 1.0
    else:
        module_ratio = verified_modules / total_modules
        
    ethics_clamped = max(0.0, min(1.0, ethics_level))
    score = (ethics_clamped * 0.6) + (module_ratio * 0.4)
    return round(score, 4)

def summarize_cognitive_state(state: Dict[str, Any], module_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates a structured summary of the AGI's cognitive condition.
    """
    total = len(module_results)
    passed = sum(1 for res in module_results.values() if res.get("passed", False))
    failed = total - passed
    pass_rate = round((passed / total * 100.0), 2) if total > 0 else 100.0

    return {
        "engine_version": state.get("version", "1.1.0-PROD"),
        "status": state.get("status", "UNKNOWN"),
        "ethics_level": state.get("ethics_level", 1.0),
        "evolution_cycles": state.get("evolution_cycles", 0),
        "modules_total": total,
        "modules_passed": passed,
        "modules_failed": failed,
        "pass_rate_percent": pass_rate,
        "alignment_score": state.get("alignment_score", 1.0)
    }
