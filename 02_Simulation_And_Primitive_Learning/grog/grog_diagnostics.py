"""
GROG DIAGNOSTIC ENGINE
Role: Validates kernel integrity, memory persistence, and simulation readiness for the Grog primitive learning module.
Integration: Initialized by the grog package marker.
"""

from __future__ import annotations
import time
import os
from typing import Dict, Any, Callable, Tuple

class GrogDiagnosticEngine:
    def __init__(self):
        self.registry: Dict[str, Callable[[], Tuple[bool, str]]] = {}

    def register_check(self, name: str, check_fn: Callable[[], Tuple[bool, str]]):
        self.registry[name] = check_fn

    def run_all(self) -> Dict[str, Any]:
        results = {}
        for name, check in self.registry.items():
            start = time.perf_counter()
            try:
                passed, msg = check()
                duration = (time.perf_counter() - start) * 1000
                results[name] = {"passed": passed, "message": msg, "duration_ms": round(duration, 3)}
            except Exception as e:
                results[name] = {"passed": False, "message": str(e), "duration_ms": 0.0}
        return results

def initialize_grog_diagnostics() -> GrogDiagnosticEngine:
    engine = GrogDiagnosticEngine()
    
    # Register core checks
    engine.register_check("persistence_layer", lambda: (
        os.access(os.getcwd(), os.W_OK), 
        "Persistence layer writable" if os.access(os.getcwd(), os.W_OK) else "Persistence layer locked"
    ))
    
    return engine
