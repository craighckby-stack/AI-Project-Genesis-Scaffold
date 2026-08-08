"""
KERNEL STATE MANAGER
====================

PURPOSE:
    Manages the internal state of the AGI Kernel with isolation and persistence.

ROLE:
    Implements a 'Zero-Leak' inspired state container to prevent memory corruption
    and ensure state integrity during kernel operations.
"""

from typing import Any, Dict, Optional
import threading

class KernelStateManager:
    """
    Thread-safe state manager for the AGI Kernel.
    """
    def __init__(self) -> None:
        self._state: Dict[str, Any] = {}
        self._lock = threading.Lock()

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            self._state[key] = value

    def get(self, key: str, default: Any = None) -> Any:
        with self._lock:
            return self._state.get(key, default)

    def delete(self, key: str) -> bool:
        with self._lock:
            if key in self._state:
                del self._state[key]
                return True
            return False

    def get_all_keys(self) -> list[str]:
        with self._lock:
            return list(self._state.keys())

    def clear(self) -> None:
        with self._lock:
            self._state.clear()
