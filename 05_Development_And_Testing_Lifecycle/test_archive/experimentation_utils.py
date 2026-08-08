"""
EXPERIMENTATION UTILITIES
Role: Helper utilities for experiment execution, telemetry, and result aggregation.
Integration: Imported by experimentation.py to compute metrics and format output.
Siphoned Patterns: AI_Agent_OS Diagnostic Engine (Tessera Enterprise)
"""

from __future__ import annotations
import time
import datetime
import uuid
from typing import Dict, Any, Tuple, Callable
from .experimentation_types import ExperimentResult, ExperimentSummary

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def summarize_experiment_results(results: Dict[str, ExperimentResult]) -> ExperimentSummary:
    """
    Computes summary metrics for a collection of experiment results.
    
    :param results: Dictionary mapping experiment IDs to ExperimentResult objects.
    :return: ExperimentSummary object containing aggregated metrics.
    """
    total = len(results)
    passed = sum(1 for r in results.values() if r.passed)
    failed = total - passed
    pass_rate = round((passed / total * 100), 2) if total > 0 else 0.0
    
    return ExperimentSummary(
        total=total,
        passed=passed,
        failed=failed,
        pass_rate=pass_rate,
        is_healthy=total > 0 and failed == 0
    )

def execute_with_telemetry(func: Callable[[], Any], experiment_id: str = "default") -> ExperimentResult:
    """
    Executes an experiment function and measures execution duration with high precision.
    
    :param func: The experiment function to execute.
    :param experiment_id: Identifier for the experiment.
    :return: ExperimentResult containing status, duration, output, and metadata.
    """
    start_time = time.perf_counter()
    timestamp = format_timestamp()
    
    try:
        output = func()
        passed = True
    except Exception as e:
        output = f"Execution Error: {str(e)}"
        passed = False
        
    duration_ms = (time.perf_counter() - start_time) * 1000.0
    
    return ExperimentResult(
        passed=passed,
        duration_ms=round(duration_ms, 3),
        output=output,
        timestamp=timestamp,
        metadata={
            "experiment_id": experiment_id,
            "run_uuid": str(uuid.uuid4()),
            "engine_version": "1.0.0-EXPERIMENT-AWARE"
        }
    )

def generate_experiment_report(results: Dict[str, ExperimentResult]) -> Dict[str, Any]:
    """
    Generates a comprehensive report dictionary for external consumption.
    """
    summary = summarize_experiment_results(results)
    return {
        "summary": summary._asdict(),
        "details": {k: v._asdict() for k, v in results.items()},
        "generated_at": format_timestamp()
    }