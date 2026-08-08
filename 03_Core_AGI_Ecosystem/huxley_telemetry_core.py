"""
HUXLEY TELEMETRY CORE
Role: Low-level diagnostic measurements, memory consumption tracking, platform profiling, and telemetry integrity hashing.
Integration: Supporting module for huxley_agi_utils.py.
Dependencies: Standard Library only
"""

from __future__ import annotations
import os
import sys
import platform
import hashlib
from typing import Dict, Any

def compute_telemetry_digest(telemetry_data: Dict[str, Any]) -> str:
    """Computes a SHA-256 digest of the telemetry dictionary for integrity verification."""
    raw_str = "|".join(f"{k}:{v}" for k, v in sorted(telemetry_data.items()))
    return hashlib.sha256(raw_str.encode("utf-8")).hexdigest()

def extract_memory_usage() -> Dict[str, float]:
    """Extracts process memory consumption details in megabytes safely."""
    rss_mb = -1.0
    try:
        import resource
        usage = resource.getrusage(resource.RUSAGE_SELF)
        if sys.platform == "darwin":
            rss_mb = round(usage.ru_maxrss / (1024.0 * 1024.0), 2)
        else:
            rss_mb = round(usage.ru_maxrss / 1024.0, 2)
    except Exception:
        pass
        
    return {
        "max_rss_mb": rss_mb,
        "vms_mb": -1.0
    }

def get_platform_details() -> Dict[str, str]:
    """Extracts detailed platform and runtime information."""
    return {
        "python_version": sys.version.split()[0],
        "platform": platform.platform(),
        "processor": platform.processor() or "unknown",
        "architecture": platform.machine() or "unknown",
        "os_name": os.name
    }
