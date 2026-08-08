from __future__ import annotations
import time
import platform
import os
from typing import Dict, Any

def summarize_diagnostic_results(checks: Dict[str, Any]) -> Dict[str, Any]:
    """Computes summary metrics for diagnostic check results."""
    total = len(checks)
    passed = sum(1 for c in checks.values() if c.get('passed', False))
    return {
        'total': total,
        'passed': passed,
        'failed': total - passed,
        'is_healthy': total > 0 and passed == total,
        'pass_rate': round((passed / total * 100), 2) if total > 0 else 0.0
    }

def generate_system_telemetry() -> Dict[str, Any]:
    """Generates standard system telemetry metadata."""
    return {
        "timestamp": time.time(),
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "pid": os.getpid()
    }