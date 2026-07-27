"""
================================================================================
ZERO-LEAK SANDBOX EXECUTOR - ENGINEERING ENCYCLOPEDIA (DARLEK CANN v3.0)
================================================================================
Role: Provides a secure, isolated execution environment for dynamic engineering
      formulas. Prevents memory leaks and unauthorized access to system internals
      via thread-scoped execution, restricted built-in access, and telemetry-aware
      monitoring.

Connections:
- 00_Foundational_Knowledge/encyclopedia_of_engineering/__init__.py (Coordinator)
- 00_Foundational_Knowledge/encyclopedia_of_engineering/consensus.py (Consensus Engine)
- 00_Foundational_Knowledge/encyclopedia_of_engineering/sandbox_telemetry.py (Telemetry)
- 00_Foundational_Knowledge/encyclopedia_of_engineering/sandbox_utils.py (Utilities)
================================================================================
"""

import threading
import math
import logging
import time
from typing import Dict, Any, Optional, List

# Import siphoned architectural components from delegated files
from .sandbox_telemetry import SandboxTelemetryBridge
from .sandbox_utils import SandboxStateSnapshot

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
    Siphons 'Zero-Leak' and 'State-Snapshot' patterns from AetherForge-2.0.
    """
    def __init__(self):
        self._lock = threading.RLock()
        self._telemetry = SandboxTelemetryBridge()
        self._execution_history: List[Dict[str, Any]] = []
        
        # Expanded safe built-ins for comprehensive engineering support
        self._safe_builtins = {
            "abs": abs, "round": round, "min": min, "max": max, 
            "sum": sum, "pow": pow, "math": math, "float": float, "int": int,
            "sqrt": math.sqrt, "pi": math.pi, "e": math.e,
            "sin": math.sin, "cos": math.cos, "tan": math.tan,
            "log": math.log, "exp": math.exp, "ceil": math.ceil, "floor": math.floor
        }
        logger.info("ZeroLeakFormulaSandbox initialized: Math-extended mode active.")

    def execute_formula(
        self, 
        formula_str: str, 
        variables: Dict[str, Any], 
        timeout_sec: float = 2.0
    ) -> Any:
        """
        Safely executes a formula string in an isolated thread with telemetry and snapshotting.
        """
        with self._lock:
            pre_snapshot = SandboxStateSnapshot(variables)
            start_time = time.time()

            local_vars = {**variables}
            global_vars = {"__builtins__": self._safe_builtins}
            result_container = {}
            exception_container = []

            def target():
                try:
                    code = compile(formula_str, "<sandbox_formula>", "eval")
                    result_container["result"] = eval(code, global_vars, local_vars)
                except Exception as e:
                    exception_container.append(e)

            thread = threading.Thread(target=target, daemon=True)
            thread.start()
            thread.join(timeout=timeout_sec)

            execution_duration = time.time() - start_time

            if thread.is_alive():
                self._telemetry.log_sandbox_event("EXECUTION_TIMEOUT", {
                    "formula": formula_str, "timeout": timeout_sec, "duration": execution_duration
                })
                raise FormulaExecutionTimeout(f"Formula execution exceeded {timeout_sec}s")
                
            if exception_container:
                error = exception_container[0]
                self._telemetry.log_sandbox_event("EXECUTION_ERROR", {"formula": formula_str, "error": str(error)})
                raise error
                
            result = result_container.get("result")
            post_snapshot = SandboxStateSnapshot({"result": result})
            execution_metadata = {
                "formula": formula_str,
                "duration": round(execution_duration, 4),
                "pre_state": pre_snapshot.to_dict(),
                "post_state": post_snapshot.to_dict()
            }
            
            self._telemetry.log_sandbox_event("EXECUTION_SUCCESS", execution_metadata)
            self._execution_history.append(execution_metadata)
            
            if len(self._execution_history) > 100:
                self._execution_history.pop(0)

            return result

    def clear_registry(self) -> None:
        """Purges execution history to prevent memory leaks."""
        with self._lock:
            self._execution_history.clear()
            logger.info("ZeroLeakFormulaSandbox: Registry cleared.")

    def get_system_integrity_snapshot(self) -> Dict[str, Any]:
        """Returns a diagnostic snapshot of the sandbox state."""
        with self._lock:
            return {
                "timestamp": time.time(),
                "history_depth": len(self._execution_history),
                "telemetry": self._telemetry.get_system_integrity_snapshot(),
                "status": "OPERATIONAL"
            }

    def get_execution_history(self) -> List[Dict[str, Any]]:
        with self._lock:
            return self._execution_history.copy()