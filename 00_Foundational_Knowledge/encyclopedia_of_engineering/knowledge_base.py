"""
KNOWLEDGE BASE - PHYSICAL CONSTANTS & ENGINEERING DOMAINS
Role: Stores structured engineering knowledge, constants, and equations.
Integration: Provides ground-truth constants and mathematical models to the diagnostic engine and simulation modules.
Dependencies: None (Standard Library Only)
"""

from __future__ import annotations
import math
from typing import Dict, Any, Optional, Tuple, List, Union

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
    },
    "VACUUM_PERMITTIVITY": {
        "value": 8.8541878128e-12,
        "unit": "F/m",
        "symbol": "epsilon_0",
        "description": "Vacuum electric permittivity"
    },
    "VACUUM_PERMEABILITY": {
        "value": 1.25663706212e-6,
        "unit": "N/A^2",
        "symbol": "mu_0",
        "description": "Vacuum magnetic permeability"
    },
    "ELECTRON_MASS": {
        "value": 9.1093837015e-31,
        "unit": "kg",
        "symbol": "m_e",
        "description": "Electron rest mass"
    },
    "STEFAN_BOLTZMANN_CONSTANT": {
        "value": 5.670374419e-8,
        "unit": "W/(m^2*K^4)",
        "symbol": "sigma",
        "description": "Stefan-Boltzmann constant"
    },
    "FARADAY_CONSTANT": {
        "value": 96485.33212,
        "unit": "C/mol",
        "symbol": "F",
        "description": "Faraday constant"
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
    },
    "FLUID_MECHANICS": {
        "description": "Study of fluids at rest and in motion.",
        "equations": {
            "REYNOLDS_NUMBER": {
                "formula": "Re = (rho * u * L) / mu",
                "variables": {
                    "Re": "Reynolds number (dimensionless)",
                    "rho": "Fluid density (kg/m^3)",
                    "u": "Flow velocity (m/s)",
                    "L": "Characteristic linear dimension (m)",
                    "mu": "Dynamic viscosity (Pa*s)"
                }
            }
        }
    }
}


def verify_schemas_detailed() -> Dict[str, Any]:
    """
    Performs a detailed, telemetry-aware schema validation of the physical constants
    and engineering domains.

    Returns:
        Dict[str, Any]: A diagnostic report containing validation status, error logs, and metadata.
    """
    errors: List[str] = []
    validated_constants: List[str] = []
    validated_domains: List[str] = []

    # Validate Physical Constants
    for name, data in PHYSICAL_CONSTANTS.items():
        if not isinstance(data, dict):
            errors.append(f"Constant '{name}' is not a dictionary.")
            continue
        for field in ["value", "unit", "symbol", "description"]:
            if field not in data:
                errors.append(f"Constant '{name}' is missing required field: '{field}'.")
        if "value" in data and not isinstance(data["value"], (int, float)):
            errors.append(f"Constant '{name}' value must be a numeric type.")
        validated_constants.append(name)

    # Validate Engineering Domains
    for domain_name, domain_data in ENGINEERING_DOMAINS.items():
        if not isinstance(domain_data, dict):
            errors.append(f"Domain '{domain_name}' is not a dictionary.")
            continue
        if "description" not in domain_data:
            errors.append(f"Domain '{domain_name}' is missing 'description'.")
        if "equations" not in domain_data:
            errors.append(f"Domain '{domain_name}' is missing 'equations'.")
            continue

        equations = domain_data["equations"]
        if not isinstance(equations, dict):
            errors.append(f"Domain '{domain_name}' equations block must be a dictionary.")
            continue

        for eq_name, eq_data in equations.items():
            if not isinstance(eq_data, dict):
                errors.append(f"Equation '{eq_name}' in domain '{domain_name}' is not a dictionary.")
                continue
            if "formula" not in eq_data:
                errors.append(f"Equation '{eq_name}' in domain '{domain_name}' is missing 'formula'.")
            if "variables" not in eq_data:
                errors.append(f"Equation '{eq_name}' in domain '{domain_name}' is missing 'variables'.")
            elif not isinstance(eq_data["variables"], dict):
                errors.append(f"Equation '{eq_name}' variables in domain '{domain_name}' must be a dictionary.")
        validated_domains.append(domain_name)

    passed = len(errors) == 0
    return {
        "passed": passed,
        "errors": errors,
        "metadata": {
            "total_constants_validated": len(validated_constants),
            "total_domains_validated": len(validated_domains),
            "constants": validated_constants,
            "domains": validated_domains
        }
    }


def verify_schemas() -> bool: 
    """
    Validates that physical constants and engineering domains conform to expected schemas.
    Maintains backward compatibility with the original signature.
    """
    try:
        report = verify_schemas_detailed()
        return report["passed"]
    except Exception:
        return False


def get_constant(query: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves a physical constant by its name or symbol (case-insensitive).

    Args:
        query (str): The name (e.g., 'SPEED_OF_LIGHT') or symbol (e.g., 'c') of the constant.

    Returns:
        Optional[Dict[str, Any]]: The constant details if found, otherwise None.
    """
    normalized_query = query.strip().upper()
    
    # Direct lookup by key
    if normalized_query in PHYSICAL_CONSTANTS:
        return PHYSICAL_CONSTANTS[normalized_query]
    
    # Lookup by symbol
    for const_data in PHYSICAL_CONSTANTS.values():
        if const_data["symbol"].strip() == query.strip() or const_data["symbol"].strip().upper() == normalized_query:
            return const_data
            
    return None


def resolve_equation(domain: str, equation_key: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves equation details from a specific engineering domain.

    Args:
        domain (str): The engineering domain (e.g., 'ELECTRICAL').
        equation_key (str): The equation identifier (e.g., 'OHM_LAW').

    Returns:
        Optional[Dict[str, Any]]: The equation details if found, otherwise None.
    """
    norm_domain = domain.strip().upper()
    norm_eq = equation_key.strip().upper()

    if norm_domain in ENGINEERING_DOMAINS:
        equations = ENGINEERING_DOMAINS[norm_domain].get("equations", {})
        if norm_eq in equations:
            return equations[norm_eq]
    return None


def solve_equation(domain: str, equation_key: str, inputs: Dict[str, float]) -> Dict[str, float]:
    """
    Algebraically solves for the single missing variable in a known engineering equation.

    Args:
        domain (str): The engineering domain (e.g., 'ELECTRICAL').
        equation_key (str): The equation identifier (e.g., 'OHM_LAW').
        inputs (Dict[str, float]): Dictionary of known variable values.

    Returns:
        Dict[str, float]: A dictionary containing all variables (inputs + solved variable).

    Raises:
        ValueError: If the domain/equation is unknown, if too many variables are missing,
                    or if a mathematical error (like division by zero) occurs.
    """
    norm_domain = domain.strip().upper()
    norm_eq = equation_key.strip().upper()

    eq_data = resolve_equation(norm_domain, norm_eq)
    if not eq_data:
        raise ValueError(f"Unknown equation '{equation_key}' in domain '{domain}'.")

    variables = eq_data["variables"]
    missing_vars = [v for v in variables if v not in inputs]

    # Special handling for IDEAL_GAS_LAW which has a constant 'R'
    if norm_eq == "IDEAL_GAS_LAW":
        # R is a known physical constant, inject it if not provided
        if "R" not in inputs:
            inputs = dict(inputs)
            inputs["R"] = PHYSICAL_CONSTANTS["GAS_CONSTANT"]["value"]
        # Re-evaluate missing variables after injecting R
        missing_vars = [v for v in variables if v not in inputs]

    if len(missing_vars) == 0:
        return inputs  # Already fully solved
    if len(missing_vars) > 1:
        raise ValueError(f"Too many missing variables for {norm_eq}. Missing: {missing_vars}")

    target_var = missing_vars[0]
    results = dict(inputs)

    try:
        if norm_eq == "NEWTON_SECOND_LAW":
            # F = m * a
            if target_var == "F":
                results["F"] = inputs["m"] * inputs["a"]
            elif target_var == "m":
                if inputs["a"] == 0:
                    raise ValueError("Division by zero: Acceleration 'a' cannot be zero when solving for mass 'm'.")
                results["m"] = inputs["F"] / inputs["a"]
            elif target_var == "a":
                if inputs["m"] == 0:
                    raise ValueError("Division by zero: Mass 'm' cannot be zero when solving for acceleration 'a'.")
                results["a"] = inputs["F"] / inputs["m"]

        elif norm_eq == "HOOKE_LAW":
            # F = -k * x
            if target_var == "F":
                results["F"] = -inputs["k"] * inputs["x"]
            elif target_var == "k":
                if inputs["x"] == 0:
                    raise ValueError("Division by zero: Displacement 'x' cannot be zero when solving for spring constant 'k'.")
                results["k"] = -inputs["F"] / inputs["x"]
            elif target_var == "x":
                if inputs["k"] == 0:
                    raise ValueError("Division by zero: Spring constant 'k' cannot be zero when solving for displacement 'x'.")
                results["x"] = -inputs["F"] / inputs["k"]

        elif norm_eq == "OHM_LAW":
            # V = I * R
            if target_var == "V":
                results["V"] = inputs["I"] * inputs["R"]
            elif target_var == "I":
                if inputs["R"] == 0:
                    raise ValueError("Division by zero: Resistance 'R' cannot be zero when solving for current 'I'.")
                results["I"] = inputs["V"] / inputs["R"]
            elif target_var == "R":
                if inputs["I"] == 0:
                    raise ValueError("Division by zero: Current 'I' cannot be zero when solving for resistance 'R'.")
                results["R"] = inputs["V"] / inputs["I"]

        elif norm_eq == "POWER_LAW":
            # P = V * I
            if target_var == "P":
                results["P"] = inputs["V"] * inputs["I"]
            elif target_var == "V":
                if inputs["I"] == 0:
                    raise ValueError("Division by zero: Current 'I' cannot be zero when solving for voltage 'V'.")
                results["V"] = inputs["P"] / inputs["I"]
            elif target_var == "I":
                if inputs["V"] == 0:
                    raise ValueError("Division by zero: Voltage 'V' cannot be zero when solving for current 'I'.")
                results["I"] = inputs["P"] / inputs["V"]

        elif norm_eq == "IDEAL_GAS_LAW":
            # P * V = n * R * T
            P, V, n, R, T = inputs.get("P"), inputs.get("V"), inputs.get("n"), inputs.get("R"), inputs.get("T")
            if target_var == "P":
                if V == 0:
                    raise ValueError("Division by zero: Volume 'V' cannot be zero.")
                results["P"] = (n * R * T) / V
            elif target_var == "V":
                if P == 0:
                    raise ValueError("Division by zero: Pressure 'P' cannot be zero.")
                results["V"] = (n * R * T) / P
            elif target_var == "n":
                denom = R * T
                if denom == 0:
                    raise ValueError("Division by zero: Temperature 'T' or Gas Constant 'R' cannot be zero.")
                results["n"] = (P * V) / denom
            elif target_var == "T":
                denom = n * R
                if denom == 0:
                    raise ValueError("Division by zero: Amount of substance 'n' or Gas Constant 'R' cannot be zero.")
                results["T"] = (P * V) / denom

        elif norm_eq == "REYNOLDS_NUMBER":
            # Re = (rho * u * L) / mu
            Re, rho, u, L, mu = inputs.get("Re"), inputs.get("rho"), inputs.get("u"), inputs.get("L"), inputs.get("mu")
            if target_var == "Re":
                if mu == 0:
                    raise ValueError("Division by zero: Dynamic viscosity 'mu' cannot be zero.")
                results["Re"] = (rho * u * L) / mu
            elif target_var == "rho":
                denom = u * L
                if denom == 0:
                    raise ValueError("Division by zero: Velocity 'u' or Length 'L' cannot be zero.")
                results["rho"] = (Re * mu) / denom
            elif target_var == "u":
                denom = rho * L
                if denom == 0:
                    raise ValueError("Division by zero: Density 'rho' or Length 'L' cannot be zero.")
                results["u"] = (Re * mu) / denom
            elif target_var == "L":
                denom = rho * u
                if denom == 0:
                    raise ValueError("Division by zero: Density 'rho' or Velocity 'u' cannot be zero.")
                results["L"] = (Re * mu) / denom
            elif target_var == "mu":
                if Re == 0:
                    raise ValueError("Division by zero: Reynolds number 'Re' cannot be zero when solving for viscosity 'mu'.")
                results["mu"] = (rho * u * L) / Re

        else:
            raise ValueError(f"Solver not implemented for equation '{equation_key}'.")

    except ZeroDivisionError as e:
        raise ValueError(f"Mathematical error solving {norm_eq}: {str(e)}")

    return results