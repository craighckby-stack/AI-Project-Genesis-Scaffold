"""
ENGINEERING KNOWLEDGE BASE
Role: Stores structured engineering schemas, physical constants, and validation rules.
Integration: Used by the diagnostic engine to verify knowledge integrity.
Architectural Note: Now utilizes KnowledgeRegistry for modular state management.
"""

from __future__ import annotations
from typing import Any, Optional
from .knowledge_registry import KnowledgeRegistry

# Initialize the central knowledge registry
registry = KnowledgeRegistry()

# Populate constants
registry.register_constant("SPEED_OF_LIGHT", 299792458, "m/s", "Speed of light in vacuum")
registry.register_constant("GRAVITATIONAL_CONSTANT", 6.67430e-11, "m^3/(kg*s^2)", "Newtonian constant of gravitation")
registry.register_constant("PLANCK_CONSTANT", 6.62607015e-34, "J*s", "Planck constant")
registry.register_constant("BOLTZMANN_CONSTANT", 1.380649e-23, "J/K", "Boltzmann constant")
registry.register_constant("STANDARD_GRAVITY", 9.80665, "m/s^2", "Standard acceleration of gravity")

# Populate domains
registry.register_domain("aerospace", ["aerodynamics", "propulsion", "orbital_mechanics"], {
    "lift_equation": "L = 0.5 * rho * v^2 * S * Cl",
    "rocket_equation": "delta_v = Isp * g0 * ln(m0 / mf)"
})

registry.register_domain("electrical", ["power_systems", "signal_processing", "microelectronics"], {
    "ohms_law": "V = I * R",
    "maxwells_equations": ["div(D) = rho", "div(B) = 0", "curl(E) = -dB/dt", "curl(H) = J + dD/dt"]
})

registry.register_domain("mechanical", ["thermodynamics", "fluid_dynamics", "solid_mechanics"], {
    "bernoulli_equation": "p + 0.5 * rho * v^2 + rho * g * h = constant",
    "stress_strain": "sigma = E * epsilon"
})

def verify_schemas() -> bool:
    """
    Verifies that all schemas are well-formed and contain required fields.
    Delegates validation to the registry's integrity check.
    """
    return registry.validate_integrity()

def get_physical_constant(name: str) -> Optional[Any]:
    """Helper to retrieve constants from the registry."""
    return registry.get_constant(name)

def get_engineering_domain(name: str) -> Optional[Any]:
    """Helper to retrieve domain schemas from the registry."""
    return registry.get_domain(name)