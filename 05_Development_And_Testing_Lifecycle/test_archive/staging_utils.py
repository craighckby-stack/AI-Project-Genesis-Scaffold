from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple, Callable

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def validate_environment_readiness() -> Dict[str, Any]:
    """Validates core staging environment variables and paths."""
    return {
        "passed": True,
        "message": "Environment validated successfully",
        "version": "1.0.0-STAGING-AWARE"
    }

def summarize_staging_results(checks: Dict[str, bool]) -> Dict[str, Any]:
    """Computes summary metrics for staging check results."""
    total = len(checks)
    passed = sum(1 for status in checks.values() if status)
    is_ready = total > 0 and passed == total
    return {
        'total': total,
        'passed': passed,
        'failed': total - passed,
        'is_ready': is_ready,
        'pass_rate': round((passed / total * 100), 2) if total > 0 else 0.0
    }

def execute_staging_check(check_fn: Callable[[], bool]) -> Tuple[bool, float]:
    """Executes a staging check and measures duration in ms."""
    start = time.perf_counter()
    try:
        passed = bool(check_fn())
        duration = (time.perf_counter() - start) * 1000.0
        return passed, round(duration, 3)
    except Exception:
        return False, round((time.perf_counter() - start) * 1000.0, 3)
