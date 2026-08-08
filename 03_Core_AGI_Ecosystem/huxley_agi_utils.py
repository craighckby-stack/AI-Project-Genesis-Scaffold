"""
HUXLEY AGI UTILITIES
Role: Core diagnostic, telemetry, and cognitive identity management for the Huxley AGI ecosystem.
Integration: Provides foundational support for huxley_agi.py and related kernel modules.
"""

from __future__ import annotations
import time
import uuid
import platform
import psutil
from typing import Tuple, Callable, Dict, Any

# Internal imports from delegated support files
from .huxley_diagnostic_core import DiagnosticResult, generate_telemetry_metadata
from .huxley_diagnostic_formatter import format_timestamp, summarize_diagnostic_results

def generate_cognitive_id() -> str:
    """Generates a unique cognitive identifier for the AGI instance."""
    return f"HUXLEY-{uuid.uuid4().hex[:8].upper()}"

def execute_cognitive_check(check_fn: Callable[[], bool]) -> Tuple[bool, float]:
    """
    Executes a cognitive module check with high-precision telemetry.
    
    :param check_fn: The cognitive function to validate.
    :return: Tuple of (passed, duration_ms).
    """
    start = time.perf_counter()
    try:
        passed = bool(check_fn())
    except Exception:
        passed = False
    duration = (time.perf_counter() - start) * 1000.0
    return passed, round(duration, 3)

def get_system_telemetry() -> Dict[str, Any]:
    """
    Gathers comprehensive system-level telemetry for AGI health reporting.
    
    :return: Dictionary containing platform, hardware, and resource usage metrics.
    """
    return {
        "platform": platform.platform(),
        "processor": platform.processor(),
        "memory_usage": psutil.virtual_memory().percent,
        "cpu_usage": psutil.cpu_percent(),
        "timestamp": format_timestamp(),
        "metadata": generate_telemetry_metadata()
    }

def run_diagnostic_suite(checks: Dict[str, Callable[[], bool]]) -> Dict[str, Any]:
    """
    Executes a full suite of cognitive diagnostic checks.
    
    :param checks: A dictionary mapping check names to their respective functions.
    :return: A structured report containing individual results and aggregate health summary.
    """
    results = {}
    durations = {}
    
    for name, func in checks.items():
        passed, duration = execute_cognitive_check(func)
        results[name] = passed
        durations[name] = duration
        
    summary = summarize_diagnostic_results(results)
    
    return {
        "status": "HEALTHY" if summary["is_healthy"] else "DEGRADED",
        "timestamp": format_timestamp(),
        "summary": summary,
        "details": {
            "results": results,
            "durations_ms": durations
        },
        "telemetry": get_system_telemetry()
    }