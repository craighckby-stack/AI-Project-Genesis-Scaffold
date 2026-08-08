"""
REGISTRY TYPES
Role: Core type definitions, structures, and diagnostic schemas for the Knowledge Registry.
Integration: Imported by knowledge_registry.py to provide structured diagnostic results, 
             registry entry definitions, and operational status reporting.
             
Architectural Note: Adheres to Zero-Leak Sandbox patterns and provides high-precision 
                    telemetry metadata for registry operations.
"""

from __future__ import annotations
from typing import NamedTuple, Dict, Any, Optional, List
from enum import Enum
import time

class RegistryStatus(Enum):
    """Enumeration of possible registry operational states."""
    INITIALIZED = "INITIALIZED"
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    ERROR = "ERROR"
    LOCKED = "LOCKED"

class RegistryDiagnosticResult(NamedTuple):
    """Structured result for registry-wide diagnostic checks."""
    passed: bool
    message: str
    metadata: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        """Serializes the diagnostic result to a dictionary for telemetry reporting."""
        return {
            "passed": self.passed,
            "message": self.message,
            "metadata": self.metadata,
            "timestamp": time.time()
        }

class RegistryEntry(NamedTuple):
    """Represents a single entry within the Knowledge Registry."""
    key: str
    value: Any
    domain: str
    version: str
    timestamp: float
    tags: List[str]

    def to_dict(self) -> Dict[str, Any]:
        """Serializes the entry for persistence or transmission."""
        return {
            "key": self.key,
            "value": self.value,
            "domain": self.domain,
            "version": self.version,
            "timestamp": self.timestamp,
            "tags": self.tags
        }

class RegistryOperationResult(NamedTuple):
    """Result structure for read/write operations on the registry."""
    success: bool
    operation: str
    data: Optional[Any] = None
    error: Optional[str] = None
    telemetry: Dict[str, Any] = {}

    def to_dict(self) -> Dict[str, Any]:
        """Serializes the operation result with embedded telemetry."""
        return {
            "success": self.success,
            "operation": self.operation,
            "data": self.data,
            "error": self.error,
            "telemetry": {
                **self.telemetry,
                "execution_time": time.time()
            }
        }

class RegistryConfig(NamedTuple):
    """Configuration schema for initializing the Knowledge Registry."""
    max_entries: int
    enable_telemetry: bool
    persistence_path: Optional[str]
    strict_mode: bool