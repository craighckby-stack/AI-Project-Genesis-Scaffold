"""
AGI KERNEL DIAGNOSTICS
======================

PURPOSE:
    Handles health monitoring and diagnostic reporting for the AGI Kernel.

ROLE:
    Integrates with the wider ecosystem diagnostics to provide kernel-specific metrics.
"""

from typing import Dict, Any
from .agi_kernel_utils import get_system_telemetry

def get_kernel_health_metrics() -> Dict[str, Any]:
    """
    Computes a health score based on system telemetry and internal state.
    """
    telemetry = get_system_telemetry()
    
    # Simple health heuristic: memory < 1GB and CPU < 80%
    mem_healthy = telemetry["memory_usage_bytes"] < (1024 * 1024 * 1024)
    cpu_healthy = telemetry["cpu_usage_percent"] < 80.0
    
    status = "HEALTHY" if mem_healthy and cpu_healthy else "DEGRADED"
    if not mem_healthy and not cpu_healthy:
        status = "CRITICAL"

    return {
        "status": status,
        "score": 1.0 if status == "HEALTHY" else (0.5 if status == "DEGRADED" else 0.1),
        "checks": {
            "memory_limit": mem_healthy,
            "cpu_limit": cpu_healthy
        }
    }
