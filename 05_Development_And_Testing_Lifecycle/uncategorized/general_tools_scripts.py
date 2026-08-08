"""
General Tools Scripts
=====================

PURPOSE:
    Centralized hub for general-purpose development and testing utilities.
    Provides a registry-based architecture for executing system-level scripts
    with integrated performance telemetry and diagnostic reporting.

ROLE:
    Acts as the primary entry point for uncategorized development tools,
    ensuring consistent execution patterns across the lifecycle.

INTEGRATION:
    Imports core logic from 'general_tools_core.py' and telemetry from 
    'general_tools_telemetry.py'.
"""

from typing import Dict, Callable, Any
from .general_tools_core import execute_tool
from .general_tools_telemetry import log_tool_execution

# Registry of available general tools
_TOOL_REGISTRY: Dict[str, Callable] = {}

def register_tool(name: str, func: Callable):
    """Registers a new tool in the general tools registry."""
    _TOOL_REGISTRY[name] = func

def run_tool(name: str, *args, **kwargs) -> Any:
    """
    Executes a registered tool by name with performance telemetry.
    
    :param name: The name of the tool to execute.
    :param args: Positional arguments for the tool.
    :param kwargs: Keyword arguments for the tool.
    :return: The result of the tool execution.
    """
    if name not in _TOOL_REGISTRY:
        raise ValueError(f"Tool '{name}' is not registered.")
    
    tool_func = _TOOL_REGISTRY[name]
    result = execute_tool(tool_func, *args, **kwargs)
    
    log_tool_execution(name, result.success, result.duration_ms)
    
    if not result.success:
        raise RuntimeError(f"Tool '{name}' failed: {result.output}")
        
    return result.output

# --- Default Tool Implementations ---

def _ping_system():
    """Example system ping tool."""
    return {"status": "online", "latency": "low"}

register_tool("ping", _ping_system)

if __name__ == "__main__":
    # Example usage
    try:
        print(run_tool("ping"))
    except Exception as e:
        print(f"Execution error: {e}")