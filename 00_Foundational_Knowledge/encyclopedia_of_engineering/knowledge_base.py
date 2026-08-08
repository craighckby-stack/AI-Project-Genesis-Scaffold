"""
ENGINEERING KNOWLEDGE BASE
Role: Stores structured engineering schemas, physical constants, and validation rules.
Integration: Used by the diagnostic engine to verify knowledge integrity.
"""

from __future__ import annotations
from typing import Dict, Any

# Core physical constants with high precision
PHYSICAL_CONSTANTS: Dict[str, Dict[str, Any]] = {
    "SPEED_OF_LIGHT": {
        "value": 299792458,
        "unit": "m/s",
        "description": "Speed of light in vacuum"
    },
    "GRAVITATIONAL_CONSTANT": {
        "value": 6.67430e-11,
        "unit": "m^3/(kg*s^2)",
        "description": "Newtonian constant of gravitation"
    },
    "PLANCK_CONSTANT": {
        "value": 6.62607015e-34,
        "unit": "J*s",
        "description": "Planck constant"
    },
    "BOLTZMANN_CONSTANT": {
        "value": 1.380649e-23,
        "unit": "J/K",
        "description": "Boltzmann constant"
    },
    "STANDARD_GRAVITY": {
        "value": 9.80665,
        "unit": "m/s^2",
        "description": "Standard acceleration of gravity"
    }
}

# Engineering domain schemas
ENGINEERING_DOMAINS: Dict[str, Dict[str, Any]] = {
    "aerospace": {
        "subfields": ["aerodynamics", "propulsion", "orbital_mechanics"],
        "key_equations": {
            "lift_equation": "L = 0.5 * rho * v^2 * S * Cl",
            "rocket_equation": "delta_v = Isp * g0 * ln(m0 / mf)"
        }
    },
    "electrical": {
        "subfields": ["power_systems", "signal_processing", "microelectronics"],
        "key_equations": {
            "ohms_law": "V = I * R",
            "maxwells_equations": ["div(D) = rho", "div(B) = 0", "curl(E) = -dB/dt", "curl(H) = J + dD/dt"]
        }
    },
    "mechanical": {
        "subfields": ["thermodynamics", "fluid_dynamics", "solid_mechanics"],
        "key_equations": {
            "bernoulli_equation": "p + 0.5 * rho * v^2 + rho * g * h = constant",
            "stress_strain": "sigma = E * epsilon"
        }
    }
}

def verify_schemas() -> bool:
    """Verifies that all schemas are well-formed and contain required fields."""
    for domain, data in ENGINEERING_DOMAINS.items():
        if "subfields" not in data or "key_equations" not in data:
            return False
    for constant, data in PHYSICAL_CONSTANTS.items():
        if "value" not in data or "unit" not in data:
            return False
    return True
