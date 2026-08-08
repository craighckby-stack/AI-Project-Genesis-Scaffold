"""
PSR GOVERNANCE UTILITIES
Role: Helper utilities for policy execution, health computation, and governance telemetry.
Integration: Imported by psr_governance.py to compute governance metrics cleanly.
Architectural Note: Implements diagnostic telemetry patterns siphoned from AI_Agent_OS 
to ensure high-fidelity governance auditing and performance tracking.
"""

from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple, Callable, NamedTuple

class PolicyResult(NamedTuple):
    """Structured result for policy execution."""
    passed: bool
    message: str
    metadata: Dict[str, Any]

def format_governance_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def generate_governance_telemetry() -> Dict[str, Any]:
    """Generates standard telemetry metadata for governance audit logs."""
    return {
        "timestamp": format_governance_timestamp(),
        "engine_version": "1.0.0-PSR-GOVERNANCE-AWARE",
        "runtime_ms": time.perf_counter() * 1000
    }

def compute_governance_health(results: Dict[str, bool]) -> Dict[str, Any]:
    """
    Computes summary metrics for policy compliance results.
    
    :param results: Dictionary mapping policy IDs to boolean compliance status.
    :return: Summary dictionary with compliance metrics.
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
        'is_compliant': failed == 0,
        'telemetry': generate_governance_telemetry()
    }

def execute_policy_check(policy_fn: Callable[[], bool], policy_id: str) -> Tuple[bool, float, PolicyResult]:
    """
    Executes a policy check with telemetry measurement and structured result generation.
    
    :param policy_fn: Callable policy check function.
    :param policy_id: Unique identifier for the policy being executed.
    :return: Tuple of (passed, duration_ms, PolicyResult).
    """
    start_time = time.perf_counter()
    try:
        passed = bool(policy_fn())
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        
        result = PolicyResult(
            passed=passed,
            message=f"Policy {policy_id} executed successfully." if passed else f"Policy {policy_id} violation detected.",
            metadata={"policy_id": policy_id, "duration_ms": round(duration_ms, 3)}
        )
        return passed, round(duration_ms, 3), result
        
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        error_result = PolicyResult(
            passed=False,
            message=f"Policy {policy_id} execution error: {str(e)}",
            metadata={"policy_id": policy_id, "error": str(e)}
        )
        return False, round(duration_ms, 3), error_result