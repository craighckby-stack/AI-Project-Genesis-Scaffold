from typing import NamedTuple, Any, Dict

class RegistryDiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]
