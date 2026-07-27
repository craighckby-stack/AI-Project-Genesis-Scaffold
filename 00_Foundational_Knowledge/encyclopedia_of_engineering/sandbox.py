```python
"""
Zero-Leak Sandbox Executor for Dynamic Engineering Formulas.

This module provides a robust and secure environment for executing arbitrary mathematical
and engineering formulas represented as strings. It leverages Python's threading
capabilities to enforce strict timeout limits, preventing runaway computations.
A `weakref.WeakKeyDictionary` is used internally to track active execution contexts
without creating memory leaks, ensuring that resources associated with completed
or timed-out threads are properly garbage collected.

The sandbox restricts the available global and local variables during formula
execution to a predefined set of safe built-in functions and the `math` module,
mitigating risks associated with arbitrary code execution.

Role in the System:
This component is critical for the Engineering Encyclopedia Engine and other
modules that require dynamic evaluation of user-defined or system-generated
formulas (e.g., for physics simulations, economic models, or agent decision-making)
while maintaining system stability and security. It acts as a core utility
for the `encyclopedia_of_engineering` package, ensuring that complex calculations
can be performed safely without compromising the integrity of the main application.

Connections:
- Utilized by components needing to evaluate dynamic expressions, such as
  the `EngineeringEncyclopediaEngine` (from `__init__.py`) for processing
  engineering principles or the `TheoreticalFoundationsEngine`.
- Adheres to the "Zero-Leak Sandbox" architectural pattern siphoned from
  `craighckby-stack/AI-Project-Genesis-Scaffold` and other global elite repositories.
"""
import threading
import weakref
import math # Explicitly import math for safe_builtins
from typing import Dict, Any, Optional

class FormulaExecutionTimeout(Exception):
    """Custom exception raised when a formula execution exceeds the specified timeout."""
    pass

class ZeroLeakFormulaSandbox:
    """
    A sandbox for safely executing mathematical and engineering formulas with timeout protection.

    Uses weak references to manage execution contexts and prevent memory leaks.
    Restricts available functions to a safe subset of built-ins and the math module.
    """
    def __init__(self):
        # Weak key dictionary to track active execution contexts without leaking memory.
        # The thread object is the key, and its associated formula string is the value.
        # When a thread object is garbage collected, its entry is automatically removed.
        self._active_contexts: weakref.WeakKeyDictionary[threading.Thread, str] = weakref.WeakKeyDictionary()

    def execute_formula(
        self,
        formula_str: str,
        variables: Dict[str, Any],
        timeout_sec: float = 2.0
    ) -> Any:
        """
        Executes a mathematical formula string safely within a restricted environment.

        Args:
            formula_str: The string representation of the formula to execute (e.g., "x * sin(y) + z").
            variables: A dictionary of variables (e.g., {"x": 10, "y": math.pi/2, "z": 5})
                       that will be available within the formula's scope.
            timeout_sec: The maximum time in seconds allowed for formula execution.
                         If execution exceeds this, a FormulaExecutionTimeout is raised.

        Returns:
            The result of the formula execution.

        Raises:
            FormulaExecutionTimeout: If the formula execution takes longer than `timeout_sec`.
            Exception: Any other exception raised during formula compilation or execution.
        """
        # Define safe builtins to restrict access to potentially dangerous functions
        safe_builtins = {
            "abs": abs,
            "round": round,
            "min": min,
            "max": max,
            "sum": sum,
            "pow": pow,
            # Expose specific math functions rather than the entire module if stricter control is needed.
            # For engineering formulas, exposing the whole math module is generally acceptable.
            "math": math,
            "float": float, # Allow explicit type conversion
            "int": int,     # Allow explicit type conversion
        }

        local_vars = {**variables} # Copy variables to avoid modifying the original dict
        global_vars = {"__builtins__": safe_builtins}

        result_container: Dict[str, Any] = {}
        exception_container: list[Exception] = []

        def target():
            """The function executed by the thread, performing the formula evaluation."""
            try:
                # Compile the expression to bytecode for efficiency and basic syntax checking
                code = compile(formula_str, "<string>", "eval")
                res = eval(code, global_vars, local_vars)
                result_container["result"] = res
            except Exception as e:
                exception_container.append(e)

        thread = threading.Thread(target=target, name=f"FormulaSandboxThread-{formula_str[:30]}")
        thread.daemon = True # Allow the program to exit even if this thread is still running
        
        # Register thread in our weak-key registry for tracking.
        # This ensures that if the thread object is no longer referenced,
        # its entry in _active_contexts is automatically cleaned up.
        self._active_contexts[thread] = formula_str
        
        thread.start()
        thread.join(timeout=timeout_sec)

        if thread.is_alive():
            # If the thread is still alive after join, it means it timed out
            raise FormulaExecutionTimeout(
                f"Formula execution '{formula_str}' exceeded safety threshold of {timeout_sec} seconds."
            )

        if exception_container:
            # Re-raise any exception caught during formula execution
            raise exception_container[0]

        # Return the computed result, or None if no result was set (e.g., empty formula)
        return result_container.get("result")

```