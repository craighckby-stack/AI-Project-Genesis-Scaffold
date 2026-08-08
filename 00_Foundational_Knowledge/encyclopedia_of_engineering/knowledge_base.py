"""
KNOWLEDGE BASE: ENGINEERING FOUNDATIONS
Role: Central repository for physical constants, engineering domain definitions, 
      and schema validation logic. Connects to the diagnostic engine for 
      integrity verification.

Architecture:
- Implements diagnostic-aware schema validation.
- Provides immutable constants for system-wide engineering calculations.
- Integrates with diagnostic_engine.py for system health telemetry.
"""

from __future__ import annotations
from typing import Dict, Any, Final
from .diagnostic_types import DiagnosticResult

# Immutable physical constants for engineering calculations
PHYSICAL_CONSTANTS: Final[Dict[str, float]] = {
    'c': 299792458.0,      # Speed of light in vacuum (m/s)
    'G': 6.67430e-11,      # Gravitational constant (m^3 kg^-1 s^-2)
    'h': 6.62607015e-34,   # Planck constant (J s)
    'k_B': 1.380649e-23,   # Boltzmann constant (J/K)
    'e': 1.60217663e-19    # Elementary charge (C)
}

# Engineering domain definitions
ENGINEERING_DOMAINS: Final[Dict[str, str]] = {
    'structural': 'static',
    'thermal': 'dynamic',
    'fluid': 'flow',
    'electromagnetic': 'field',
    'quantum': 'probabilistic'
}

def verify_schemas() -> DiagnosticResult:
    """
    Performs a diagnostic integrity check on the knowledge base schemas.
    
    Returns:
        DiagnosticResult: A structured report containing pass status,
                          validation message, and metadata.
    """
    try:
        # Validate existence and integrity of constants
        constants_valid = all(isinstance(v, (int, float)) for v in PHYSICAL_CONSTANTS.values())
        domains_valid = all(isinstance(k, str) and isinstance(v, str) for k, v in ENGINEERING_DOMAINS.items())
        
        passed = constants_valid and domains_valid
        
        return DiagnosticResult(
            passed=passed,
            message="Knowledge base schema validation successful" if passed else "Schema integrity failure detected",
            metadata={
                "constants_count": len(PHYSICAL_CONSTANTS),
                "domains_count": len(ENGINEERING_DOMAINS),
                "constants_valid": constants_valid,
                "domains_valid": domains_valid
            }
        )
    except Exception as e:
        return DiagnosticResult(
            passed=False,
            message=f"Critical error during schema verification: {str(e)}",
            metadata={"error_type": type(e).__name__}
        )

def get_constant(key: str) -> float:
    """Retrieves a physical constant by key."""
    return PHYSICAL_CONSTANTS.get(key, 0.0)

def get_domain_type(domain: str) -> str:
    """Retrieves the operational type for a given engineering domain."""
    return ENGINEERING_DOMAINS.get(domain, 'unknown')