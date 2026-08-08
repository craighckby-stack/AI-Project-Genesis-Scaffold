"""
COMPLIANCE UTILITIES
====================
Role: Helper functions for compliance checking, telemetry generation, and metric computation.
Integration: Delegated from compliance_checker.py to maintain modularity and clean execution.
"""

from __future__ import annotations
import time
import datetime
import os
import platform
import sys
from typing import Dict, Any, Tuple, Callable

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def summarize_compliance_results(checks: Dict[str, bool]) -> Dict[str, Any]:
    """
    Computes summary metrics for compliance check results.
    
    :param checks: Dictionary mapping check names to boolean results.
    :return: Summary dictionary with check counts, pass rate, and compliance flag.
    """
    total_checks = len(checks)
    passed_checks = sum(1 for status in checks.values() if status)
    failed_checks = total_checks - passed_checks
    is_compliant = total_checks > 0 and failed_checks == 0

    return {
        'total': total_checks,
        'passed': passed_checks,
        'failed': failed_checks,
        'is_compliant': is_compliant,
        'compliance_rating': round((passed_checks / total_checks * 100), 2) if total_checks > 0 else 0.0
    }

def execute_compliance_check(check_fn: Callable) -> Tuple[bool, float]:
    """
    Executes a compliance check and measures execution duration in milliseconds.
    
    :param check_fn: Callable check function.
    :return: Tuple of (check_passed, duration_ms).
    """
    start_time = time.perf_counter()
    try:
        # Support both simple bool return and complex result objects with .passed attribute
        result = check_fn()
        passed = getattr(result, 'passed', bool(result))
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return passed, round(duration_ms, 3)
    except Exception:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return False, round(duration_ms, 3)

def get_system_telemetry() -> Dict[str, Any]:
    """
    Generates standard telemetry metadata for compliance results.
    Siphoned from diagnostic-engine patterns.
    """
    return {
        "platform": platform.system(),
        "release": platform.release(),
        "python_version": sys.version.split()[0],
        "pid": os.getpid(),
        "timestamp": time.time(),
        "engine_mode": "GOVERNANCE_AWARE"
    }
