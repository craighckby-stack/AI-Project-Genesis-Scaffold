"""
PSR GOVERNANCE UTILITIES
Role: Helper utilities for policy execution, health computation, and governance telemetry.
Integration: Imported by psr_governance.py to compute governance metrics cleanly.
"""

from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple, Callable

def format_governance_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def compute_governance_health(results: Dict[str, bool]) -> Dict[str, Any]:
    """
    Computes summary metrics for policy compliance results.
    """
    total = len(results)
    passed = sum(1 for status in results.values() if status)
    failed = total - passed
    compliance_rate = (passed / total * 100) if total > 0 else 100.0

    return {
        'total_policies': total,
        'passed_count': passed,
        'failed_count': failed,
        'compliance_rate': round(compliance_rate, 2),
        'is_compliant': failed == 0
    }

def execute_policy_check(policy_fn: Callable[[], bool]) -> Tuple[bool, float]:
    """
    Executes a policy check and measures execution duration in milliseconds.
    """
    start_time = time.perf_counter()
    try:
        passed = bool(policy_fn())
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return passed, round(duration_ms, 3)
    except Exception:
        return False, round((time.perf_counter() - start_time) * 1000.0, 3)
