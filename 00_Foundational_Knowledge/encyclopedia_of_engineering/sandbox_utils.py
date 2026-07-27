"""
================================================================================
SANDBOX UTILITIES - STATE MANAGEMENT
================================================================================
Role: Provides utility classes for state snapshotting and data transformation
      within the Zero-Leak Sandbox environment.
================================================================================
"""

import time
from typing import Dict, Any

class SandboxStateSnapshot:
    """
    Captures a point-in-time snapshot of variables used in sandbox execution.
    Siphoned from AetherForge-2.0 'StateSnapshot' patterns.
    """
    def __init__(self, data: Dict[str, Any]):
        self.timestamp = time.time()
        # Store a shallow copy to prevent external mutation of the snapshot
        self.data = {k: self._sanitize(v) for k, v in data.items()}

    def _sanitize(self, value: Any) -> Any:
        """Ensures values are serializable or representable for the snapshot."""
        if isinstance(value, (int, float, str, bool, type(None))):
            return value
        return str(value)

    def to_dict(self) -> Dict[str, Any]:
        """Returns the snapshot as a dictionary."""
        return {
            "timestamp": self.timestamp,
            "data": self.data
        }
