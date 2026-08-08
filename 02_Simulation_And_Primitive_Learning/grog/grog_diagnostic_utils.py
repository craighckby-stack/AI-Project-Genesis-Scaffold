from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple, Callable

def format_timestamp() -> str:
    return datetime.datetime.utcnow().isoformat() + 'Z'

def summarize_diagnostic_results(checks: Dict[str, Any]) -> Dict[str, Any]:
    total_checks = len(checks)
    passed_checks = sum(1 for res in checks.values() if res.get('passed', False))
    failed_checks = total_checks - passed_checks
    is_healthy = total_checks > 0 and failed_checks == 0

    return {
        'total': total_checks,
        'passed': passed_checks,
        'failed': failed_checks,
        'is_healthy': is_healthy,
        'pass_rate': round((passed_checks / total_checks * 100), 2) if total_checks > 0 else 0.0
    }

def generate_telemetry_metadata() -> Dict[str, Any]:
    return {
        "timestamp": time.time(),
        "version": "1.0.0-GROG-DIAGNOSTIC-AWARE"
    }