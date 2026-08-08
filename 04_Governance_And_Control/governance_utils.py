"""
GOVERNANCE UTILITIES
Role: Core logic for system integrity validation, diagnostic telemetry, and governance state management.
Integration: Delegated from 04_Governance_And_Control/__init__.py.
Connects to: governance_core_utils.py for shared diagnostic primitives.
"""

from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple, Callable
from .governance_core_utils import DiagnosticResult, generate_telemetry_metadata

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
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
        'pass_rate': round((passed_checks / total_checks * 100), 2) if total_checks > 0 else 0.0,
        'telemetry': generate_telemetry_metadata()
    }

def execute_check_with_telemetry(check_fn: Callable[[], DiagnosticResult]) -> Tuple[bool, float, str, Dict[str, Any]]:
    """
    Executes a diagnostic check and measures execution duration in milliseconds.
    
    :param check_fn: Callable check function returning a DiagnosticResult.
    :return: Tuple of (passed, duration_ms, message, metadata).
    """
    start_time = time.perf_counter()
    try:
        result = check_fn()
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        
        # Merge standard telemetry into existing metadata
        metadata = {**result.metadata, **generate_telemetry_metadata()}
        
        return result.passed, round(duration_ms, 3), result.message, metadata
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return False, round(duration_ms, 3), str(e), {"error": True, **generate_telemetry_metadata()}