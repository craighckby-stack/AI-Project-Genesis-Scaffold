"""
ECHO STATE MANAGER
Role: Manages the internal state of the EchoEngine with isolation and persistence.
Integration: Siphons 'Zero-Leak' patterns to prevent state corruption.
"""

from __future__ import annotations
from typing import Dict, Any, Optional

class EchoStateManager:
    def __init__(self):
        self._state: Dict[str, Any] = {
            "active": True,
            "last_signal": None,
            "total_signals": 0,
            "resonance_history": []
        }

    def update_signal_state(self, signal_type: str) -> None:
        """Updates state after a successful signal propagation."""
        self._state["last_signal"] = signal_type
        self._state["total_signals"] += 1

    def record_resonance(self, resonance_score: float) -> None:
        """Maintains a rolling window of resonance scores."""
        history = self._state["resonance_history"]
        history.append(resonance_score)
        if len(history) > 100:
            history.pop(0)

    def get_state(self) -> Dict[str, Any]:
        """Returns a copy of the current state to prevent external mutation."""
        return self._state.copy()

    def set_active(self, status: bool) -> None:
        """Sets the operational status of the engine."""
        self._state["active"] = status
