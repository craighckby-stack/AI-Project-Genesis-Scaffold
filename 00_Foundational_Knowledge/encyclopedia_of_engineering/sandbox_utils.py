"""
================================================================================
SANDBOX UTILITIES - STATE MANAGEMENT (DARLEK CANN v3.0)
================================================================================
Role: Provides utility classes for state snapshotting and data transformation
      within the Zero-Leak Sandbox environment. Implements thread-safe snapshot
      mechanisms for audit-ready temporal debugging.

Connections:
- 00_Foundational_Knowledge/encyclopedia_of_engineering/sandbox.py (Sandbox Executor)
================================================================================
"""

import time
import threading
from typing import Dict, Any

class SandboxStateSnapshot:
    """
    Captures a point-in-time snapshot of variables used in sandbox execution.
    Siphoned from AetherForge-2.0 'StateSnapshot' patterns.
    """
    def __init__(self, data: Dict[str, Any]):
        self._lock = threading.RLock()
        self.timestamp = time.time()
        # Store a shallow copy to prevent external mutation of the snapshot
        self.data = {k: self._sanitize(v) for k, v in data.items()}

    def _sanitize(self, value: Any) -> Any:
        """Ensures values are serializable or representable for the snapshot."""
        if isinstance(value, (int, float, str, bool, type(None))):
            return value
        if isinstance(value, (list, tuple)):
            return [self._sanitize(i) for i in value]
        if isinstance(value, dict):
            return {str(k): self._sanitize(v) for k, v in value.items()}
        return str(value)

    def to_dict(self) -> Dict[str, Any]:
        """Returns the snapshot as a dictionary in a thread-safe manner."""
        with self._lock:
            return {
                "timestamp": self.timestamp,
                "data": self.data.copy()
            }

    def get_system_integrity_snapshot(self) -> Dict[str, Any]:
        """
        Facilitates temporal debugging by returning a snapshot of the utility state.
        """
        with self._lock:
            return {
                "timestamp": time.time(),
                "snapshot_age": time.time() - self.timestamp,
                "status": "OPERATIONAL"
            }