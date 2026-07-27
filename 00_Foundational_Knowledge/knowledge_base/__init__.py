"""
================================================================================
KNOWLEDGE BASE COORDINATOR - CORE ENGINE
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

    def __init__(self):
        if self._initialized: return
        self._registry_lock = threading.RLock()
        self._knowledge_registry: Dict[str, Any] = {}
        self._initialized = True
        logger.info("KnowledgeBaseCoordinator initialized.")

    def get_entry(self, key: str) -> Optional[Any]:
        """Retrieves a knowledge entry in a thread-safe manner."""
        with self._registry_lock:
            entry = self._knowledge_registry.get(key)
            logger.debug(f"Knowledge retrieval: {key} -> {'Found' if entry else 'Not Found'}")
            return entry

    def set_entry(self, key: str, value: Any) -> None:
        """Registers or updates a knowledge entry in a thread-safe manner."""
        with self._registry_lock:
            self._knowledge_registry[key] = value
            logger.info(f"Knowledge registry updated: {key}")

    def get_registry_keys(self) -> List[str]:
        """Returns a list of all available knowledge keys."""
        with self._registry_lock:
            return list(self._knowledge_registry.keys())

# Global instance for system-wide access
knowledge_base = KnowledgeBaseCoordinator()