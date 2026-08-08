"""
UI CORE DIAGNOSTIC HARNESS
Role: Core logic for UI component validation, telemetry generation, and type definitions.
Integration: Delegated from uis.py to maintain modularity in the development lifecycle.
"""

from __future__ import annotations
import time
import uuid
from typing import NamedTuple, Any, Dict, Callable, Tuple

class UIComponentResult(NamedTuple):
    """Standardized result structure for UI component diagnostics."""
    passed: bool
    message: str
    metadata: Dict[str, Any]
    duration_ms: float

class UIComponentTelemetry(NamedTuple):
    """Standardized telemetry structure for UI component diagnostics."""
    component_id: str
    timestamp: float
    version: str
    system_load: str

def validate_ui_component(func: Callable) -> bool:
    """Validates that a UI component check function is callable."""
    return callable(func)

def generate_ui_telemetry(component_name: str) -> Dict[str, Any]:
    """Generates standard telemetry metadata for UI diagnostic results."""
    return {
        "component_id": f"{component_name}-{uuid.uuid4().hex[:8]}",
        "timestamp": time.time(),
        "version": "1.0.0-UI-DIAGNOSTIC-AWARE",
        "system_load": "nominal"
    }

def execute_ui_check(check_fn: Callable[[], UIComponentResult], component_name: str) -> Tuple[UIComponentResult, Dict[str, Any]]:
    """
    Executes a UI component diagnostic check with precise performance measurement.
    
    :param check_fn: Callable check function returning a UIComponentResult.
    :param component_name: Identifier for the UI component.
    :return: Tuple of (UIComponentResult, telemetry_metadata).
    """
    start_time = time.perf_counter()
    try:
        result = check_fn()
        duration = (time.perf_counter() - start_time) * 1000.0
        
        # Enrich result with duration
        final_result = UIComponentResult(
            passed=result.passed,
            message=result.message,
            metadata=result.metadata,
            duration_ms=round(duration, 3)
        )
        
        telemetry = generate_ui_telemetry(component_name)
        return final_result, telemetry
    except Exception as e:
        duration = (time.perf_counter() - start_time) * 1000.0
        error_result = UIComponentResult(
            passed=False,
            message=f"Execution failed: {str(e)}",
            metadata={"error": str(e)},
            duration_ms=round(duration, 3)
        )
        return error_result, generate_ui_telemetry(component_name)