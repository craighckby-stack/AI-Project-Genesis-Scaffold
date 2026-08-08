"""
DIAGNOSTIC ENGINE
Role: Validates kernel integrity, engineering schemas, and system health.
Integration: Core component of the encyclopedia_of_engineering module.
Dependencies: diagnostic_utils.py
"""

from typing import Dict, Callable, Any, NamedTuple
import time
from .diagnostic_utils import format_timestamp, summarize_diagnostic_results, execute_check_with_telemetry

class DiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]

class DiagnosticEngine:
    """
    Advanced Diagnostic Engine for system-wide health monitoring.
    Implements telemetry-aware execution and registry-based health checks.
    """
    def __init__(self):
        self._registry: Dict[str, Callable[[], DiagnosticResult]] = {}

    def register(self, name: str, func: Callable[[], DiagnosticResult]):
        """Registers a diagnostic check function."""
        self._registry[name] = func

    def run_all(self) -> Dict[str, Any]:
        """
        Executes all registered diagnostics and returns a comprehensive report.
        """
        report_checks = {}
        
        for name, func in self._registry.items():
            # Execute with telemetry wrapping
            res, duration = execute_check_with_telemetry(func, name)
            
            if res:
                report_checks[name] = {
                    'passed': res.passed,
                    'message': res.message,
                    'metadata': {**res.metadata, 'duration_ms': duration}
                }
            else:
                report_checks[name] = {
                    'passed': False,
                    'message': 'Execution failed or returned invalid result',
                    'metadata': {'duration_ms': duration}
                }

        summary = summarize_diagnostic_results(report_checks)
        
        return {
            'status': 'HEALTHY' if summary['is_healthy'] else 'DEGRADED',
            'timestamp': format_timestamp(),
            'summary': summary,
            'checks': report_checks
        }

# Global engine instance for module-level access
engine = DiagnosticEngine()