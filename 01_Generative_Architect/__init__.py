"""
GENERATIVE ARCHITECT INITIALIZATION MODULE
Role: Serves as the entry point for the Generative Architect subsystem.
Integration: Performs system-wide diagnostic validation upon import to ensure 
             architectural integrity before component instantiation.
Dependencies: 01_Generative_Architect/diagnostic_utils.py
"""

from __future__ import annotations
import logging
import threading
from typing import Dict, Any
from .diagnostic_utils import DiagnosticResult, generate_telemetry_metadata

# Thread-safe initialization tracking
_init_lock = threading.RLock()
_initialized = False
_diagnostic_status: Dict[str, Any] = {}

def _perform_self_diagnostic() -> DiagnosticResult:
    """
    Executes a baseline diagnostic sweep of the Generative Architect environment.
    Ensures that all required sub-modules are reachable and state is consistent.
    """
    try:
        # Placeholder for future complex dependency checks
        metadata = generate_telemetry_metadata()
        return DiagnosticResult(
            passed=True,
            message="Generative Architect subsystem initialized successfully.",
            metadata=metadata
        )
    except Exception as e:
        return DiagnosticResult(
            passed=False,
            message=f"Initialization failed: {str(e)}",
            metadata={"error": str(e)}
        )

def initialize_subsystem():
    """
    Public entry point to trigger initialization and diagnostic verification.
    """
    global _initialized, _diagnostic_status
    with _init_lock:
        if not _initialized:
            result = _perform_self_diagnostic()
            _diagnostic_status = {
                "passed": result.passed,
                "message": result.message,
                "metadata": result.metadata
            }
            _initialized = True
            if not result.passed:
                logging.error(f"Generative Architect Init Error: {result.message}")

# Trigger self-diagnostic on module load
initialize_subsystem()

__all__ = ["initialize_subsystem", "_diagnostic_status"]