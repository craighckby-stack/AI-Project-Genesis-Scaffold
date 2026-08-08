"""
GOVERNANCE AUTHORITY REGISTRY
=============================
Role: Centralized store for compliance policies and governance rules.
Integration: Provides policy definitions to the ComplianceChecker.
"""

from __future__ import annotations
from typing import Dict, List, Any, Optional

class PolicyDefinition:
    """Defines a governance policy with metadata for auditing."""
    def __init__(self, name: str, description: str, severity: str = "MEDIUM", category: str = "GENERAL"):
        self.name = name
        self.description = description
        self.severity = severity
        self.category = category

class GovernanceAuthorityRegistry:
    """Registry for managing system-wide governance policies."""
    def __init__(self):
        self._policies: Dict[str, PolicyDefinition] = {}
        self._initialize_default_policies()

    def _initialize_default_policies(self):
        """Registers core system policies by default."""
        defaults = [
            PolicyDefinition("SYSTEM_INTEGRITY", "Ensures core kernel files and memory are untampered.", "CRITICAL", "SECURITY"),
            PolicyDefinition("DATA_PRIVACY", "Validates PII scrubbing and data isolation protocols.", "HIGH", "PRIVACY"),
            PolicyDefinition("RESOURCE_QUOTA", "Checks if agent resource usage is within governance bounds.", "LOW", "OPERATIONAL"),
            PolicyDefinition("ZERO_LEAK_ISOLATION", "Verifies sandbox isolation and memory clearing.", "CRITICAL", "SECURITY")
        ]
        for p in defaults:
            self.add_policy(p)

    def add_policy(self, policy: PolicyDefinition):
        """Adds a new policy to the registry."""
        self._policies[policy.name] = policy

    def get_policy(self, name: str) -> Optional[PolicyDefinition]:
        """Retrieves a policy by name."""
        return self._policies.get(name)

    def get_all_policies(self) -> List[PolicyDefinition]:
        """Returns all registered policies."""
        return list(self._policies.values())

# Global registry instance for system-wide access
registry = GovernanceAuthorityRegistry()
