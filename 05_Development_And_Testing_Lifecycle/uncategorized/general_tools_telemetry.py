"""
GENERAL TOOLS TELEMETRY
Role: Telemetry and logging utilities for general tools.
Integration: Delegated from general_tools_scripts.py.
"""

import datetime

def get_utc_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def log_tool_execution(name: str, success: bool, duration: float):
    """Logs tool execution metrics to standard output."""
    status = "SUCCESS" if success else "FAILURE"
    print(f"[{get_utc_timestamp()}] TOOL_EXEC: {name} | STATUS: {status} | DURATION: {duration}ms")
