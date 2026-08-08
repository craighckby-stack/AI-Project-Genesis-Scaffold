from __future__ import annotations
import time
from typing import Dict, Any, Callable, Tuple

class EvolutionTelemetry:
    @staticmethod
    def get_timestamp() -> str:
        return time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

    @staticmethod
    def compute_metrics(results: Dict[str, bool]) -> Dict[str, Any]:
        total = len(results)
        passed = sum(1 for r in results.values() if r)
        return {
            'total': total,
            'passed': passed,
            'failed': total - passed,
            'pass_rate': round((passed / total * 100), 2) if total > 0 else 0.0
        }