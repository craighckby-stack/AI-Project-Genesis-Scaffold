"""
GENERAL TOOLS CORE
Role: Core logic for system-level utility execution and validation.
Integration: Delegated from general_tools_scripts.py to maintain modularity.
"""

from typing import Callable, Any, Dict, NamedTuple
import time

class ToolResult(NamedTuple):
    success: bool
    output: Any
    duration_ms: float

def execute_tool(func: Callable, *args, **kwargs) -> ToolResult:
    """Executes a tool function with performance telemetry."""
    start = time.perf_counter()
    try:
        result = func(*args, **kwargs)
        duration = (time.perf_counter() - start) * 1000.0
        return ToolResult(True, result, round(duration, 3))
    except Exception as e:
        duration = (time.perf_counter() - start) * 1000.0
        return ToolResult(False, str(e), round(duration, 3))
