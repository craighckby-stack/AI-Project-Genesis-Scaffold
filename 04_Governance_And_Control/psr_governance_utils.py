"""
PSR GOVERNANCE UTILITIES
Role: Helper utilities for governance policy enforcement, state validation, and telemetry.
Integration: Imported by psr_governance.py to compute governance metrics and state transitions.
"""

from __future__ import annotations
import time
from typing import Dict, Any, Callable, Tuple

def format_governance_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp."""
    import datetime
    return datetime.datetime.utcnow().isoformat() + 'Z'

def compute_governance_health(policies: Dict[str, bool]) -> Dict[str, Any]:
    """Computes summary metrics for policy compliance."""
    total = len(policies)
    passed = sum(1 for p in policies.values() if p)
    return {
        'total_policies': total,
        'compliant_count': passed,
        'non_compliant_count': total - passed,
        'compliance_rate': round((passed / total * 100), 2) if total > 0 else 0.0
    }

def execute_policy_check(policy_fn: Callable[[], bool]) -> Tuple[bool, float]:
    """Executes a policy check with telemetry."""
    start = time.perf_counter()
    try:
        result = bool(policy_fn())
        duration = (time.perf_counter() - start) * 1000.0
        return result, round(duration, 3)
    except Exception:
        return False, round((time.perf_counter() - start) * 1000.0, 3)
