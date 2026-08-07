from __future__ import annotations
import time
import logging
from typing import Dict, Any, Callable, NamedTuple

class DiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]

class EncyclopediaDiagnosticEngine:
    def __init__(self):
        self._registry: Dict[str, Callable[[], DiagnosticResult]] = {}
        self.logger = logging.getLogger('EncyclopediaEngine')

    def register(self, name: str, func: Callable[[], DiagnosticResult]):
        self._registry[name] = func

    def run_all(self) -> Dict[str, Any]:
        results = {}
        for name, func in self._registry.items():
            start = time.perf_counter()
            try:
                res = func()
                duration = (time.perf_counter() - start) * 1000
                results[name] = {**res._asdict(), 'duration_ms': round(duration, 3)}
            except Exception as e:
                results[name] = {'passed': False, 'message': str(e), 'duration_ms': 0}
        return results

engine = EncyclopediaDiagnosticEngine()