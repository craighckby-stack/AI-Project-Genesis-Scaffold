"""
KNOWLEDGE BASE - PHYSICAL CONSTANTS & ENGINEERING DOMAINS
Role: Stores structured engineering knowledge, constants, and equations.
"""
from __future__ import annotations
from typing import Dict, Any

# Core physical constants with high precision
PHYSICAL_CONSTANTS: Dict[str, Dict[str, Any]] = {
    "SPEED_OF_LIGHT": {
        "value": 299792458,
        "unit": "m/s",
        "symbol": "c",
        "description": "Speed of light in vacuum"
    },
    "PLANCK_CONSTANT": {
        "value": 6.62607015e-34,
        "unit": "J*s",
        "symbol": "h",
        "description": "Planck constant"
    },
    "GRAVITATIONAL_CONSTANT": {
        "value": 6.67430e-11,
        "unit": "m^3/(kg*s^2)",
        "symbol": "G",
        "description": "Newtonian constant of gravitation"
    },
    "BOLTZMANN_CONSTANT": {
        "value": 1.380649e-23,
        "unit": "J/K",
        "symbol": "k_B",
        "description": "Boltzmann constant"
    },
    "AVOGADRO_CONSTANT": {
        "value": 6.02214076e23,
        "unit": "mol^-1",
        "symbol": "N_A",
        "description": "Avogadro constant"
    },
    "STANDARD_GRAVITY": {
        "value": 9.80665,
        "unit": "m/s^2",
        "symbol": "g",
        "description": "Standard acceleration of gravity"
    },
    "GAS_CONSTANT": {
        "value": 8.314462618,
        "unit": "J/(mol*K)",
        "symbol": "R",
        "description": "Molar gas constant"
    }
}

# Engineering domains with equations and schemas
ENGINEERING_DOMAINS: Dict[str, Dict[str, Any]] = {
    "MECHANICAL": {
        "description": "Study of physical systems, forces, motion, and energy.",
        "equations": {
            "NEWTON_SECOND_LAW": {
                "formula": "F = m * a",
                "variables": {"F": "Force (N)", "m": "Mass (kg)", "a": "Acceleration (m/s^2)"}
            },
            "HOOKE_LAW": {
                "formula": "F = -k * x",
                "variables": {"F": "Force (N)", "k": "Spring constant (N/m)", "x": "Displacement (m)"}
            }
        }
    },
    "ELECTRICAL": {
        "description": "Study of electromagnetism, circuits, and electrical systems.",
        "equations": {
            "OHM_LAW": {
                "formula": "V = I * R",
                "variables": {"V": "Voltage (V)", "I": "Current (A)", "R": "Resistance (Ohm)"}
            },
            "POWER_LAW": {
                "formula": "P = V * I",
                "variables": {"P": "Power (W)", "V": "Voltage (V)", "I": "Current (A)"}
            }
        }
    },
    "THERMODYNAMICS": {
        "description": "Study of heat, work, temperature, and energy transfer.",
        "equations": {
            "IDEAL_GAS_LAW": {
                "formula": "P * V = n * R * T",
                "variables": {
                    "P": "Pressure (Pa)",
                    "V": "Volume (m^3)",
                    "n": "Amount of substance (mol)",
                    "R": "Gas constant (J/(mol*K))",
                    "T": "Temperature (K)"
                }
            }
        }
    }
}

def verify_schemas() -> bool: 
    """
    Validates that physical constants and engineering domains conform to expected schemas.
    """
    try:
        # Verify physical constants schema
        for name, data in PHYSICAL_CONSTANTS.items():
            if not isinstance(data, dict):
                return False
            for field in ["value", "unit", "symbol", "description"]:
                if field not in data:
                    return False

        # Verify engineering domains schema
        for name, data in ENGINEERING_DOMAINS.items():
            if not isinstance(data, dict):
                return False
            if "description" not in data or "equations" not in data:
                return False
            for eq_name, eq_data in data["equations"].items():
                if "formula" not in eq_data or "variables" not in eq_data:
                    return False
        return True
    except Exception:
        return False
