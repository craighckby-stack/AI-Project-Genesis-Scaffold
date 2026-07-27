"""
Zero-Leak Sandbox Executor for Dynamic Engineering Formulas.
"""
import threading
import math
from typing import Dict, Any, Optional

class FormulaExecutionTimeout(Exception):
    pass

class ZeroLeakFormulaSandbox:
    def execute_formula(
        self, formula_str: str, variables: Dict[str, Any], timeout_sec: float = 2.0
    ) -> Any:
        safe_builtins = {"abs": abs, "round": round, "min": min, "max": max, "sum": sum, "pow": pow, "math": math, "float": float, "int": int}
        local_vars = {**variables}
        global_vars = {"__builtins__": safe_builtins}
        result_container = {}
        exception_container = []

        def target():
            try:
                code = compile(formula_str, "<string>", "eval")
                result_container["result"] = eval(code, global_vars, local_vars)
            except Exception as e:
                exception_container.append(e)

        thread = threading.Thread(target=target)
        thread.start()
        thread.join(timeout=timeout_sec)

        if thread.is_alive():
            raise FormulaExecutionTimeout(f"Formula execution exceeded {timeout_sec}s")
        if exception_container:
            raise exception_container[0]
        return result_container["result"]