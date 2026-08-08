from typing import Dict, Callable, Any, NamedTuple
import time

class DiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]

class DiagnosticEngine:
    def __init__(self):
        self._registry: Dict[str, Callable[[], DiagnosticResult]] = {}

    def register(self, name: str, func: Callable[[], DiagnosticResult]):
        self._registry[name] = func

    def run_all(self) -> Dict[str, Dict[str, Any]]:
        report = {}
        for name, func in self._registry.items():
            res = func()
            report[name] = {
                'passed': res.passed,
                'message': res.message,
                'metadata': res.metadata,
                'duration_ms': res.metadata.get('duration_ms', 0.0)
            }
        return report

engine = DiagnosticEngine()