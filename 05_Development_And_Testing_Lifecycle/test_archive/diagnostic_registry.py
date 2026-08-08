"""
DIAGNOSTIC REGISTRY
Role: Maintains the registry of test archive diagnostic checks.
Integration: Used by the package to expose diagnostic capabilities.
"""

from typing import Dict, Callable, Any

# Registry for test archive diagnostic checks
TEST_ARCHIVE_CHECKS: Dict[str, Callable[[], bool]] = {}

def register_test_check(name: str, check_fn: Callable[[], bool]) -> None:
    """Registers a new diagnostic check for the test archive."""
    TEST_ARCHIVE_CHECKS[name] = check_fn

def get_all_checks() -> Dict[str, Callable[[], bool]]:
    """Returns all registered diagnostic checks."""
    return TEST_ARCHIVE_CHECKS
