"""
STAGING UTILITIES
Role: Helper utilities for staging environment validation, lifecycle telemetry, and status reporting.
Integration: Imported by staging.py to compute staging metrics and validate environment state.
"""

from __future__ import annotations
import time
import datetime
import os
from typing import Dict, Any, Tuple, Callable

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def validate_environment_readiness() -> Dict[str, Any]:
    """Checks for critical staging environment variables and directory structures."""
    env_vars = ['STAGING_ENV', 'TEST_DB_URL', 'LOG_LEVEL']
    missing = [var for var in env_vars if not os.getenv(var)]
    return {
        "passed": len(missing) == 0,
        "missing": missing,
        "timestamp": format_timestamp()
    }

def summarize_staging_results(checks: Dict[str, bool]) -> Dict[str, Any]:
    """Computes summary metrics for staging check results."""
    total = len(checks)
    passed = sum(1 for status in checks.values() if status)
    return {
        'total': total,
        'passed': passed,
        'failed': total - passed,
        'is_ready': total > 0 and passed == total,
        'pass_rate': round((passed / total * 100), 2) if total > 0 else 0.0
    }

def execute_staging_check(check_fn: Callable[[], bool]) -> Tuple[bool, float]:
    """Executes a staging check and measures duration in milliseconds."""
    start = time.perf_counter()
    try:
        passed = bool(check_fn())
        return passed, round((time.perf_counter() - start) * 1000.0, 3)
    except Exception:
        return False, round((time.perf_counter() - start) * 1000.0, 3)
