"""
DIAGNOSTIC UTILITIES
Role: Helper utilities for diagnostic execution formatting, status telemetry, and metric computation.
Integration: Imported by diagnostic_engine.py to compute diagnostic metrics cleanly.
"""

from __future__ import annotations
import time
import platform
import os
from typing import Dict, Any

def summarize_diagnostic_results(checks: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes summary metrics for diagnostic check results.
    """
    total_checks = len(checks)
    passed_checks = sum(1 for data in checks.values() if data.get('passed', False))
    failed_checks = total_checks - passed_checks
    is_healthy = total_checks > 0 and failed_checks == 0

    return {
        'total': total_checks,
        'passed': passed_checks,
        'failed': failed_checks,
        'is_healthy': is_healthy,
        'pass_rate': round((passed_checks / total_checks * 100), 2) if total_checks > 0 else 0.0
    }

def generate_system_telemetry() -> Dict[str, Any]:
    """
    Generates standard telemetry metadata for diagnostic reports.
    """
    return {
        "timestamp": time.time(),
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "process_id": os.getpid(),
        "uptime": time.process_time()
    }
