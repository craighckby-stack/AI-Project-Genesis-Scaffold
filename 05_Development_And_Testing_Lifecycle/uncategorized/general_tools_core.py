"""
GENERAL TOOLS CORE
Role: Core logic for system-level utility execution, validation, and performance telemetry.
Integration: Acts as the primary execution harness for development tools, 
             utilizing telemetry patterns from the AI_Agent_OS architecture.
"""

from typing import Callable, Any, Dict, NamedTuple, Optional
import time
from .tools_telemetry_utils import generate_telemetry_metadata, format_duration

class ToolResult(NamedTuple):
    """Standardized result container for tool executions."""
    success: bool
    output: Any
    duration_ms: float
    metadata: Dict[str, Any]

def execute_tool(func: Callable, tool_name: str, *args, **kwargs) -> ToolResult:
    """
    Executes a tool function with performance telemetry and error trapping.
    
    :param func: The callable tool function to execute.
    :param tool_name: Identifier for the tool, used for telemetry.
    :param args: Positional arguments for the tool.
    :param kwargs: Keyword arguments for the tool.
    :return: A ToolResult object containing success status, output, and telemetry.
    """
    start = time.perf_counter()
    metadata = generate_telemetry_metadata(tool_name)
    
    try:
        result = func(*args, **kwargs)
        duration = (time.perf_counter() - start) * 1000.0
        return ToolResult(
            success=True, 
            output=result, 
            duration_ms=format_duration(duration),
            metadata=metadata
        )
    except Exception as e:
        duration = (time.perf_counter() - start) * 1000.0
        metadata["error"] = str(e)
        return ToolResult(
            success=False, 
            output=None, 
            duration_ms=format_duration(duration),
            metadata=metadata
        )

def validate_tool_integrity(tool_func: Callable) -> bool:
    """
    Validates that a tool function is properly defined and callable.
    """
    return callable(tool_func)