"""
TOOLS TELEMETRY UTILITIES
Role: Helper utilities for tool execution telemetry, metadata generation, and performance tracking.
Integration: Imported by general_tools_core.py to compute tool metrics cleanly.
"""

from __future__ import annotations
import time
import uuid
from typing import Dict, Any

def generate_telemetry_metadata(tool_name: str) -> Dict[str, Any]:
    """Generates standard telemetry metadata for tool execution."""
    return {
        "tool_name": tool_name,
        "timestamp": time.time(),
        "execution_id": str(uuid.uuid4()),
        "version": "1.0.0-TELEMETRY-AWARE"
    }

def format_duration(duration_ms: float) -> float:
    """Formats duration to 3 decimal places."""
    return round(duration_ms, 3)
