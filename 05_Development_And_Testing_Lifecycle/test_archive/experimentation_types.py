from __future__ import annotations
from typing import NamedTuple, Any, Dict

class ExperimentResult(NamedTuple):
    passed: bool
    duration_ms: float
    output: Any
    timestamp: str
    metadata: Dict[str, Any]

class ExperimentSummary(NamedTuple):
    total: int
    passed: int
    failed: int
    pass_rate: float
    is_healthy: bool
