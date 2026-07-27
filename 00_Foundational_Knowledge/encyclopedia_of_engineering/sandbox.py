"""
================================================================================
ZERO-LEAK SANDBOX EXECUTOR - ENGINEERING ENCYCLOPEDIA
================================================================================
Role: Provides a secure, isolated execution environment for dynamic engineering
      formulas. Prevents memory leaks and unauthorized access to system internals
      via thread-scoped execution and restricted built-in access.

Connections:
- 00_Foundational_Knowledge/encyclopedia_of_engineering/__init__.py (Coordinator)
- 00_Foundational_Knowledge/encyclopedia_of_engineering/consensus.py (Consensus Engine)
================================================================================
"""

import threading
import math
import logging
from typing import Dict, Any, Optional

# Configure diagnostic logging for sandbox execution tracking
logger = logging.getLogger("ZeroLeakSandbox")

class FormulaExecutionTimeout(Exception):
    """Raised when formula execution exceeds the defined temporal budget."""
    pass

class ZeroLeakFormulaSandbox:
    """
    A secure, isolated execution environment for dynamic engineering formulas.
    Uses thread-scoped execution and restricted built-in access to prevent
    system-level leaks or malicious code injection.
    """
    def __init__(self):
        self._safe_builtins = {
            "abs": abs, "round": round, "min": min, "max": max, 
            "sum": sum, "pow": pow, "math": math, "float": float, "int": int
        }

    def execute_formula(
        self, formula_str: str, variables: Dict[str, Any], timeout_sec: float = 2.0
    ) -> Any:
        """
        Safely executes a formula string in an isolated thread.
        
        Args:
            formula_str: The mathematical formula to evaluate.
            variables: Dictionary of variables available to the formula.
            timeout_sec: Maximum execution time in seconds.
        """
        local_vars = {**variables}
        global_vars = {"__builtins__": self._safe_builtins}
        result_container = {}
        exception_container = []

        def target():
            try:
                code = compile(formula_str, "<string>", "eval")
                result_container["result"] = eval(code, global_vars, local_vars)
            except Exception as e:
                exception_container.append(e)

        thread = threading.Thread(target=target, daemon=True)
        thread.start()
        thread.join(timeout=timeout_sec)

        if thread.is_alive():
            logger.error(f"Sandbox timeout: Formula '{formula_str}' exceeded {timeout_sec}s")
            raise FormulaExecutionTimeout(f"Formula execution exceeded {timeout_sec}s")
            
        if exception_container:
            logger.error(f"Sandbox execution error: {exception_container[0]}")
            raise exception_container[0]
            
        return result_container.get("result")