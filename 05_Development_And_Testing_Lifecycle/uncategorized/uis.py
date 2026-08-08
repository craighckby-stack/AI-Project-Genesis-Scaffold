"""
Uis
===

PURPOSE:
    Miscellaneous UI utilities and diagnostic registry for the development lifecycle.
    Acts as a central hub for validating UI component integrity and performance.

ROLE:
    Provides a registry-based interface for UI diagnostics, delegating complex 
    telemetry and core logic to specialized modules.

INTEGRATION:
    - uis_core.py: Core logic and type definitions.
    - uis_telemetry.py: Telemetry computation and formatting.
"""

from __future__ import annotations
from typing import Dict, Any, Callable
from .uis_core import validate_ui_component, generate_ui_telemetry
from .uis_telemetry import (
    format_ui_timestamp, 
    summarize_ui_results, 
    execute_ui_check_with_telemetry
)

# Registry for UI diagnostic checks
_UI_REGISTRY: Dict[str, Callable[[], bool]] = {}

def register_ui_check(name: str, check_fn: Callable[[], bool]) -> None:
    """Registers a new UI diagnostic check."""
    if validate_ui_component(check_fn):
        _UI_REGISTRY[name] = check_fn

def run_ui_diagnostics() -> Dict[str, Any]:
    """
    Executes all registered UI diagnostic checks and returns a comprehensive report.
    """
    results: Dict[str, bool] = {}
    telemetry_data: Dict[str, Any] = {}

    for name, check_fn in _UI_REGISTRY.items():
        passed, duration = execute_ui_check_with_telemetry(check_fn, name)
        results[name] = passed
        telemetry_data[name] = {
            "passed": passed,
            "duration_ms": duration,
            "metadata": generate_ui_telemetry()
        }

    summary = summarize_ui_results(results)
    
    return {
        "status": "HEALTHY" if summary["is_healthy"] else "DEGRADED",
        "timestamp": format_ui_timestamp(),
        "summary": summary,
        "details": telemetry_data
    }

# Example of a default UI check
def check_ui_ready() -> bool:
    """Default check to verify UI readiness."""
    return True

register_ui_check("default_readiness", check_ui_ready)