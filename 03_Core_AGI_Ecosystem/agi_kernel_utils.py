"""
AGI KERNEL UTILITIES
====================

PURPOSE:
    Provides low-level utility functions for the AGI Kernel, including
    ID generation, system telemetry gathering, and hook validation.

ROLE:
    Supports the AgiKernel by offloading non-orchestration logic and 
    providing high-integrity diagnostic tools.

INTEGRATION:
    - Siphons telemetry patterns from AI_Agent_OS.
    - Siphons ISO 8601 formatting from Tessera Enterprise.
    - Delegates complex logic to kernel_telemetry_provider and kernel_validation_logic.
"""

import uuid
import time
import datetime
import logging
from typing import Any, Callable, Dict, Optional
from contextlib import contextmanager

# Internal module imports (generated via newFiles)
from .kernel_telemetry_provider import gather_deep_telemetry
from .kernel_validation_logic import verify_hook_signature, is_async_callable

# Configure logger for utility events
logger = logging.getLogger("AGI.Kernel.Utils")

def generate_kernel_id(prefix: str = "AGI-KERN") -> str:
    """
    Generates a unique, deterministic-style kernel identifier.
    Enhanced with entropy-rich hex suffix.
    """
    unique_suffix = uuid.uuid4().hex[:12].upper()
    return f"{prefix}-{unique_suffix}"

def get_system_telemetry() -> Dict[str, Any]:
    """
    Gathers real-time system telemetry including CPU, memory, and uptime.
    Delegates to the deep telemetry provider for exhaustive metrics.
    """
    try:
        return gather_deep_telemetry()
    except Exception as e:
        logger.error(f"Failed to gather telemetry: {e}")
        return {
            "status": "ERROR",
            "timestamp": time.time(),
            "error": str(e)
        }

def validate_kernel_hook(hook: Callable) -> bool:
    """
    Validates that a hook is callable and meets basic safety requirements.
    Uses advanced signature inspection.
    """
    passed, message = verify_hook_signature(hook)
    if not passed:
        logger.warning(f"Hook validation failed: {message}")
    return passed

def format_iso_timestamp() -> str:
    """
    Returns ISO 8601 formatted UTC timestamp with Z suffix.
    Siphoned from Tessera diagnostic engine.
    """
    return datetime.datetime.utcnow().isoformat() + 'Z'

@contextmanager
def kernel_timer(operation_name: str):
    """
    Context manager for high-precision timing of kernel operations.
    Usage:
        with kernel_timer("MemorySync"):
            perform_sync()
    """
    start_time = time.perf_counter()
    yield
    duration = (time.perf_counter() - start_time) * 1000.0
    logger.debug(f"Operation '{operation_name}' completed in {duration:.3f}ms")

def safe_execute_hook(hook: Callable, *args, **kwargs) -> Optional[Any]:
    """
    Executes a hook within a safety wrapper to prevent kernel crashes.
    Siphons 'Zero-Leak' error isolation patterns.
    """
    hook_name = getattr(hook, '__name__', 'anonymous_hook')
    try:
        with kernel_timer(f"Hook:{hook_name}"):
            if is_async_callable(hook):
                # Note: This utility assumes a running loop or synchronous wrapper if called here
                logger.warning(f"Async hook '{hook_name}' called in sync context.")
            return hook(*args, **kwargs)
    except Exception as e:
        logger.error(f"Critical failure in kernel hook '{hook_name}': {e}", exc_info=True)
        return None

def calculate_integrity_hash(data: str) -> str:
    """
    Generates a SHA-256 hash for data integrity verification.
    """
    import hashlib
    return hashlib.sha256(data.encode('utf-8')).hexdigest()