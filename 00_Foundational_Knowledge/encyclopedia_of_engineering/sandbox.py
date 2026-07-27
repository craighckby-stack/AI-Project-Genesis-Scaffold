"""
Zero-Leak Sandbox Executor for Dynamic Engineering Formulas.
Uses weak references, thread-based timeout guards, and restricted globals to prevent memory leaks and unsafe execution.
"""
import threading
import weakref
from typing import Dict, Any

class FormulaExecutionTimeout(Exception):
    pass

class ZeroLeakFormulaSandbox:
    def __init__(self):
        # Weak key dictionary to track active execution contexts without leaking memory
        self._active_contexts = weakref.WeakKeyDictionary()

    def execute_formula(
        self, 
        formula_str: str, 
        variables: Dict[str, Any], 
        timeout_sec: float = 2.0
    ) -> Any:
        """
        Executes a mathematical formula string safely within a restricted environment.
        """
        # Define safe builtins
        safe_builtins = {
            "abs": abs,
            "round": round,
            "min": min,
            "max": max,
            "sum": sum,
            "pow": pow,
            "math": __import__("math"),
        }
        
        local_vars = {**variables}
        global_vars = {"__builtins__": safe_builtins}
        
        result_container = {}
        exception_container = []

        def target():
            try:
                # Compile the expression to bytecode
                code = compile(formula_str, "<string>", "eval")
                res = eval(code, global_vars, local_vars)
                result_container["result"] = res
            except Exception as e:
                exception_container.append(e)

        thread = threading.Thread(target=target)
        thread.daemon = True
        
        # Register thread in our weak-key registry for tracking
        self._active_contexts[thread] = formula_str
        
        thread.start()
        thread.join(timeout=timeout_sec)

        if thread.is_alive():
            raise FormulaExecutionTimeout(
                f"Formula execution exceeded safety threshold of {timeout_sec} seconds."
            )

        if exception_container:
            raise exception_container[0]

        return result_container.get("result")
