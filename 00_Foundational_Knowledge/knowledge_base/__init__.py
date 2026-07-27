"""
================================================================================
KNOWLEDGE BASE COORDINATOR - CORE ENGINE (DARLEK CANN v3.0)
================================================================================
Role: Central coordinator for the system's general knowledge base. Provides 
      thread-safe access to structured knowledge, manages registry updates, 
      and tracks knowledge integrity via diagnostic telemetry.

Connections:
- 00_Foundational_Knowledge/encyclopedia_of_engineering/__init__.py (Engineering Registry)
- 03_Core_AGI_Ecosystem/agi_kernel.py (AGI Kernel Integration)
================================================================================
"""

import threading
import logging
import time
from collections import deque
from typing import Dict, Any, Optional, List

# Configure diagnostic logging for knowledge access tracking
logger = logging.getLogger("KnowledgeBaseCoordinator")

class KnowledgeBaseCoordinator:
    """
    The supreme coordinator for the Knowledge Base.
    Manages domain registries, ensures thread-safe access, and provides 
    telemetry for knowledge retrieval operations.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(KnowledgeBaseCoordinator, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self, history_max_size: int = 100):
        if self._initialized: return
        self._registry_lock = threading.RLock()
        self._knowledge_registry: Dict[str, Any] = {}
        self._event_history: deque[Dict[str, Any]] = deque(maxlen=history_max_size)
        self._event_sequence_num = 0
        self._initialized = True
        logger.info("KnowledgeBaseCoordinator initialized with Zero-Leak telemetry.")

    def _log_event(self, event_type: str, metadata: Dict[str, Any]) -> None:
        """Internal helper to log events to the bounded history."""
        self._event_sequence_num += 1
        log_payload = {
            "timestamp": time.time(),
            "sequence_num": self._event_sequence_num,
            "event_type": event_type,
            "data": metadata
        }
        self._event_history.append(log_payload)

    def get_entry(self, key: str) -> Optional[Any]:
        """Retrieves a knowledge entry in a thread-safe manner."""
        with self._registry_lock:
            entry = self._knowledge_registry.get(key)
            self._log_event("KNOWLEDGE_RETRIEVAL", {"key": key, "found": entry is not None})
            return entry

    def set_entry(self, key: str, value: Any) -> None:
        """Registers or updates a knowledge entry in a thread-safe manner."""
        with self._registry_lock:
            self._knowledge_registry[key] = value
            self._log_event("KNOWLEDGE_UPDATE", {"key": key})
            logger.info(f"Knowledge registry updated: {key}")

    def get_registry_keys(self) -> List[str]:
        """Returns a list of all available knowledge keys."""
        with self._registry_lock:
            return list(self._knowledge_registry.keys())

    def clear_registry(self) -> None:
        """Purges the registry and history to prevent memory leaks during simulation resets."""
        with self._registry_lock:
            self._knowledge_registry.clear()
            self._event_history.clear()
            logger.info("Knowledge registry and telemetry history purged.")

    def get_system_integrity_snapshot(self) -> Dict[str, Any]:
        """Returns a diagnostic snapshot of the knowledge base state."""
        with self._registry_lock:
            return {
                "registry_size": len(self._knowledge_registry),
                "keys": list(self._knowledge_registry.keys()),
                "total_events": self._event_sequence_num,
                "recent_events_sample": list(self._event_history)[-5:],
                "status": "OPERATIONAL"
            }

# Global instance for system-wide access
knowledge_base = KnowledgeBaseCoordinator()