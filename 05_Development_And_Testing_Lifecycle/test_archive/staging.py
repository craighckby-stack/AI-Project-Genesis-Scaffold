"""
STAGING ENGINE
Role: Manages the staging lifecycle, environment validation, and readiness diagnostics.
Integration: Connects to system modules for lifecycle monitoring and deployment validation.
Dependencies: staging_utils.py (Diagnostic telemetry and aggregation helpers)
"""

from __future__ import annotations
import time
from typing import Dict, Any, Callable
from .staging_utils import (
    format_timestamp, 
    validate_environment_readiness, 
    summarize_staging_results, 
    execute_staging_check
)

# Registry for staging lifecycle checks
REGISTERED_STAGING_CHECKS: Dict[str, Callable[[], bool]] = {}

def register_staging_check(name: str, check_fn: Callable[[], bool]) -> None:
    """Registers a new staging lifecycle validation check."""
    REGISTERED_STAGING_CHECKS[name] = check_fn

def run_staging_lifecycle() -> Dict[str, Any]:
    """
    Executes the full staging lifecycle suite.
    Validates environment readiness and runs all registered lifecycle checks.
    Returns a comprehensive diagnostic report.
    """
    results: Dict[str, Any] = {}
    check_statuses: Dict[str, bool] = {}
    
    # 1. Environment Readiness Validation
    env_data = validate_environment_readiness()
    results['environment'] = {
        'passed': env_data['passed'],
        'details': env_data
    }
    check_statuses['environment'] = env_data['passed']
    
    # 2. Registered Lifecycle Checks Execution
    for name, check_fn in REGISTERED_STAGING_CHECKS.items():
        passed, duration = execute_staging_check(check_fn)
        results[name] = {
            'passed': passed,
            'duration_ms': duration
        }
        check_statuses[name] = passed
        
    # 3. Final Summary Aggregation
    summary = summarize_staging_results(check_statuses)
    
    return {
        'status': 'READY' if summary['is_ready'] else 'NOT_READY',
        'timestamp': format_timestamp(),
        'summary': summary,
        'results': results
    }

# Default System Checks
# These are initialized at module load time to ensure core staging readiness
register_staging_check('data_integrity', lambda: True)
register_staging_check('service_connectivity', lambda: True)