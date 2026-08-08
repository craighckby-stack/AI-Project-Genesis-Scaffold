"""
ECHO PAYLOAD VALIDATOR
Role: Deep structural validation for incoming signal payloads.
Integration: Ensures signal integrity before propagation.
"""

from __future__ import annotations
from typing import Any, Dict

class EchoPayloadValidator:
    @staticmethod
    def is_structurally_sound(payload: Any) -> bool:
        """Performs a multi-stage integrity check on the payload structure."""
        if not isinstance(payload, dict):
            return False
        
        # Ensure no reserved system keys are being overwritten maliciously
        reserved_keys = {'__proto__', '__constructor__', 'system_core'}
        if any(key in payload for key in reserved_keys):
            return False
            
        return len(payload) > 0
