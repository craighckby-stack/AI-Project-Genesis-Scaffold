"""
Compliance Checker
==================

PURPOSE:
    Compliance checking utility for the Governance and Control layer.
    Validates system operations against defined regulatory and security policies.

ROLE:
    Acts as a gatekeeper for governance operations, ensuring all actions 
    adhere to the established compliance registry.

INTEGRATION:
    - Imports compliance_utils for telemetry and metric computation.
    - Connects to governance_authority_registry for policy definitions.
"""

from __future__ import annotations
from typing import Dict, Any, Callable
import compliance_utils

class ComplianceChecker:
    """
    Engine for verifying system compliance against registered policies.
    """
    def __init__(self):
        self._registry: Dict[str, Callable[[], bool]] = {}
        self._results: Dict[str, Any] = {}

    def register_policy(self, name: str, check_fn: Callable[[], bool]) -> None:
        """Registers a new compliance policy check."""
        self._registry[name] = check_fn

    def run_compliance_suite(self) -> Dict[str, Any]:
        """
        Executes all registered compliance policies and generates a report.
        """
        check_results: Dict[str, bool] = {}
        detailed_results: Dict[str, Any] = {}

        for name, check_fn in self._registry.items():
            passed, duration = compliance_utils.execute_compliance_check(check_fn)
            check_results[name] = passed
            detailed_results[name] = {
                "passed": passed,
                "duration_ms": duration,
                "timestamp": compliance_utils.format_timestamp()
            }

        summary = compliance_utils.summarize_compliance_results(check_results)
        
        self._results = {
            "status": "COMPLIANT" if summary["is_compliant"] else "NON_COMPLIANT",
            "summary": summary,
            "details": detailed_results,
            "telemetry": {
                "generated_at": compliance_utils.format_timestamp(),
                "engine_version": "1.0.0-GOVERNANCE-AWARE"
            }
        }
        
        return self._results

# Global instance for system-wide compliance monitoring
compliance_engine = ComplianceChecker()

def verify_system_integrity() -> Dict[str, Any]:
    """
    Convenience function to trigger a full system compliance audit.
    """
    return compliance_engine.run_compliance_suite()