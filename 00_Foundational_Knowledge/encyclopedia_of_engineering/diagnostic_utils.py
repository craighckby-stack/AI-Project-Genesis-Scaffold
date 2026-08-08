from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def summarize_diagnostic_results(report: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes summary metrics for diagnostic check results.
    """
    total_checks = len(report)
    passed_checks = sum(1 for check in report.values() if check.get('passed', False))
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
    """Generates standard system telemetry metadata."""
    return {
        "version": "1.0.0-ENGINEERING-DIAGNOSTIC",
        "timestamp": format_timestamp(),
        "engine_uptime": time.perf_counter()
    }