"""
================================================================================
SANDBOX TELEMETRY BRIDGE - DIAGNOSTIC LAYER (DARLEK CANN v3.0)
================================================================================
Role: Provides high-fidelity diagnostic logging and event tracking for the 
      Zero-Leak Formula Sandbox. Siphoned from the Audit repository.
      Now includes a bounded, thread-safe history of recent events and sequence
      numbering for enhanced observability and temporal debugging.

Connections:
- 00_Foundational_Knowledge/encyclopedia_of_engineering/sandbox.py (Sandbox Executor)
================================================================================
"""

import logging
import json
import time
import threading
from collections import deque
from typing import Dict, Any, List

logger = logging.getLogger("SandboxTelemetry")

class SandboxTelemetryBridge:
    """
    Diagnostic bridge for logging sandbox execution events.
    Ensures all dynamic formula evaluations are observable and auditable.
    Implements thread-safe logging, snapshotting, and maintains a bounded history of recent events.
    """
    def __init__(self, history_max_size: int = 100):
        self._start_time = time.time()
        self._lock = threading.RLock()
        self._event_history: deque[Dict[str, Any]] = deque(maxlen=history_max_size)
        self._event_sequence_num = 0

    def log_sandbox_event(self, event_type: str, metadata: Dict[str, Any]) -> None:
        """
        Logs a structured sandbox event to the diagnostic stream and stores it in a bounded history.
        """
        with self._lock:
            self._event_sequence_num += 1
            log_payload = {
                "timestamp": time.time(),
                "uptime": round(time.time() - self._start_time, 2),
                "sequence_num": self._event_sequence_num,
                "event_type": event_type,
                "data": metadata
            }
            logger.info(f"[SANDBOX_TELEMETRY] {event_type} | {json.dumps(log_payload)}")
            self._event_history.append(log_payload)

    def get_health_report(self) -> Dict[str, Any]:
        """
        Returns a health report for the telemetry bridge.
        """
        with self._lock:
            return {
                "status": "ACTIVE",
                "uptime": round(time.time() - self._start_time, 2),
                "total_events_logged": self._event_sequence_num,
                "current_history_size": len(self._event_history)
            }

    def clear_history(self) -> None:
        """
        Clears the internal event history. Useful for resetting telemetry in simulations.
        """
        with self._lock:
            self._event_history.clear()
            logger.info("SandboxTelemetryBridge: Event history cleared.")

    def get_system_integrity_snapshot(self) -> Dict[str, Any]:
        """
        Facilitates temporal debugging by returning a snapshot of the telemetry bridge.
        Includes recent events for immediate context.
        """
        with self._lock:
            return {
                "timestamp": time.time(),
                "health": self.get_health_report(),
                "status": "OPERATIONAL",
                "recent_events_sample": list(self._event_history)[-5:]
            }