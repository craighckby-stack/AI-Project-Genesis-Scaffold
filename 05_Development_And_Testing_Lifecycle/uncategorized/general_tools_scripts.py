"""
GENERAL TOOLS SCRIPTS
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
    'general_tools_telemetry.py'. Aligned with AI_Agent_OS diagnostic standards.
"""

from typing import Dict, Callable, Any, Optional
from .general_tools_core import execute_tool
from .general_tools_telemetry import log_tool_execution

# Registry of available general tools
_TOOL_REGISTRY: Dict[str, Callable] = {}

def register_tool(name: str, func: Callable) -> None:
    """
    Registers a new tool in the general tools registry.
    
    :param name: Unique identifier for the tool.
    :param func: Callable function to be executed.
    """
    _TOOL_REGISTRY[name] = func

def run_tool(name: str, *args: Any, **kwargs: Any) -> Any:
    """
    Executes a registered tool by name with performance telemetry.
    
    :param name: The name of the tool to execute.
    :param args: Positional arguments for the tool.
    :param kwargs: Keyword arguments for the tool.
    :return: The result of the tool execution.
    :raises ValueError: If the tool is not registered.
    :raises RuntimeError: If the tool execution fails.
    """
    if name not in _TOOL_REGISTRY:
        raise ValueError(f"Tool '{name}' is not registered in the system registry.")
    
    tool_func = _TOOL_REGISTRY[name]
    
    # Execute via core diagnostic harness
    result = execute_tool(tool_func, *args, **kwargs)
    
    # Log execution telemetry
    log_tool_execution(
        name=name, 
        success=result.success, 
        duration_ms=result.duration_ms
    )
    
    if not result.success:
        # Provide detailed error context from the diagnostic harness
        error_msg = getattr(result, 'error', str(result.output))
        raise RuntimeError(f"Tool '{name}' failed execution: {error_msg}")
        
    return result.output

# --- Default Tool Implementations ---

def _ping_system() -> Dict[str, Any]:
    """Example system ping tool for heartbeat verification."""
    return {
        "status": "online", 
        "latency": "low",
        "timestamp": "system_check_active"
    }

# Register default tools on module load
register_tool("ping", _ping_system)

if __name__ == "__main__":
    # Diagnostic execution harness
    try:
        print(f"Executing system ping...")
        result = run_tool("ping")
        print(f"Tool Result: {result}")
    except Exception as e:
        print(f"Execution error: {e}")