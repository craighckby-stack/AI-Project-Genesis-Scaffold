"""
HUXLEY AGI UTILITIES
Role: High-precision diagnostic engine, system telemetry provider, cognitive alignment calculator, and metric computation module.
Integration: Primary utility framework supporting 'huxley_agi.py' and related Core AGI Ecosystem components.
Dependencies: 03_Core_AGI_Ecosystem/huxley_telemetry_core.py (or standard library fallback)
"""

from __future__ import annotations

import os
import sys
import time
import uuid
import datetime
import logging
import threading
from typing import Dict, Any, Tuple, Callable, Optional, List

logger = logging.getLogger("HuxleyAGIUtils")

# Dual import fallback mechanism for system telemetry core
try:
    from .huxley_telemetry_core import compute_telemetry_digest, extract_memory_usage, get_platform_details
except ImportError:
    try:
        from huxley_telemetry_core import compute_telemetry_digest, extract_memory_usage, get_platform_details
    except ImportError:
        def compute_telemetry_digest(telemetry_data: Dict[str, Any]) -> str:
            import hashlib
            raw_str = "|".join(f"{k}:{v}" for k, v in sorted(telemetry_data.items()))
            return hashlib.sha256(raw_str.encode("utf-8")).hexdigest()

        def extract_memory_usage() -> Dict[str, float]:
            return {"max_rss_mb": -1.0, "vms_mb": -1.0}

        def get_platform_details() -> Dict[str, str]:
            import platform
            return {
                "python_version": sys.version.split()[0],
                "platform": platform.platform(),
                "processor": platform.processor() or "unknown",
                "architecture": platform.machine() or "unknown",
                "os_name": os.name
            }


def generate_cognitive_id(prefix: str = "HUX") -> str:
    """
    Generates a unique cognitive identifier with timestamp suffix and entropy block.

    :param prefix: Text prefix for the generated identifier (default: "HUX").
    :return: Unique string identifier (e.g. "HUX-1718000000-A1B2C3D4").
    """
    clean_prefix = str(prefix).strip().upper() if prefix else "HUX"
    timestamp_sec = int(time.time())
    unique_suffix = uuid.uuid4().hex[:8].upper()
    return f"{clean_prefix}-{timestamp_sec}-{unique_suffix}"


def format_timestamp() -> str:
    """
    Returns ISO 8601 formatted UTC timestamp with explicit 'Z' designator.

    :return: Formatted ISO 8601 UTC timestamp string.
    """
    return datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")


def execute_cognitive_check(check_fn: Callable) -> Tuple[bool, float, Optional[str]]:
    """
    Executes a cognitive check callable with precision execution timing and exception isolation.

    :param check_fn: Callable check or module evaluation function.
    :return: Tuple of (passed: bool, duration_ms: float, error_message: Optional[str]).
    """
    if not callable(check_fn):
        return False, 0.0, "Provided check target is not callable"

    start_time = time.perf_counter()
    try:
        result = check_fn()
        duration_ms = round((time.perf_counter() - start_time) * 1000.0, 3)

        if isinstance(result, bool):
            passed = result
        elif isinstance(result, (tuple, list)) and len(result) > 0:
            passed = bool(result[0])
        elif isinstance(result, dict):
            passed = bool(result.get("passed", result.get("success", True)))
        else:
            passed = result is not None

        return passed, duration_ms, None
    except Exception as exc:
        duration_ms = round((time.perf_counter() - start_time) * 1000.0, 3)
        error_msg = f"{exc.__class__.__name__}: {str(exc)}"
        logger.error(f"Cognitive check failure in module execution: {error_msg}")
        return False, duration_ms, error_msg


def get_system_telemetry() -> Dict[str, Any]:
    """
    Retrieves system runtime metrics, platform details, and execution telemetry.

    :return: Dictionary containing hardware, platform, process, and memory telemetry.
    """
    platform_info = get_platform_details()
    memory_info = extract_memory_usage()

    telemetry: Dict[str, Any] = {
        "timestamp": format_timestamp(),
        "python_version": platform_info.get("python_version", sys.version.split()[0]),
        "platform": platform_info.get("platform", "unknown"),
        "processor": platform_info.get("processor", "unknown"),
        "architecture": platform_info.get("architecture", "unknown"),
        "pid": os.getpid(),
        "active_threads": threading.active_count(),
        "uptime_sec": round(time.monotonic(), 2),
        "max_rss_mb": memory_info.get("max_rss_mb", -1.0)
    }

    telemetry["digest"] = compute_telemetry_digest(telemetry)
    return telemetry


def compute_alignment_metric(ethics_level: float, verified_modules: int, total_modules: int) -> float:
    """
    Computes an overall ethical and cognitive alignment score [0.0 to 1.0].

    :param ethics_level: Floating point score representing ethical adherence [0.0, 1.0].
    :param verified_modules: Number of modules passing verification.
    :param total_modules: Total number of registered cognitive modules.
    :return: Clamped alignment score between 0.0 and 1.0.
    """
    try:
        ethics_val = float(ethics_level)
    except (TypeError, ValueError):
        ethics_val = 0.0

    ethics_clamped = max(0.0, min(1.0, ethics_val))

    if total_modules <= 0:
        module_ratio = 1.0
    else:
        verified_clamped = max(0, min(verified_modules, total_modules))
        module_ratio = verified_clamped / float(total_modules)

    score = (ethics_clamped * 0.6) + (module_ratio * 0.4)
    return round(max(0.0, min(1.0, score)), 4)


def summarize_cognitive_state(state: Dict[str, Any], module_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates a structured diagnostic summary of the AGI's cognitive condition.

    :param state: Cognitive engine state dictionary.
    :param module_results: Map of module names to execution result dicts.
    :return: Comprehensive cognitive state summary dictionary.
    """
    safe_state = state if isinstance(state, dict) else {}
    safe_modules = module_results if isinstance(module_results, dict) else {}

    total = len(safe_modules)
    passed = 0
    failed = 0

    for res in safe_modules.values():
        if isinstance(res, dict):
            if res.get("passed", False) or res.get("success", False):
                passed += 1
            else:
                failed += 1
        elif bool(res):
            passed += 1
        else:
            failed += 1

    pass_rate = round((passed / total * 100.0), 2) if total > 0 else 100.0
    ethics_lvl = float(safe_state.get("ethics_level", 1.0))
    alignment = compute_alignment_metric(ethics_lvl, passed, total)

    return {
        "engine_version": safe_state.get("version", "1.1.0-PROD"),
        "status": safe_state.get("status", "UNKNOWN"),
        "ethics_level": ethics_lvl,
        "evolution_cycles": int(safe_state.get("evolution_cycles", 0)),
        "modules_total": total,
        "modules_passed": passed,
        "modules_failed": failed,
        "pass_rate_percent": pass_rate,
        "alignment_score": alignment,
        "is_healthy": failed == 0 and alignment >= 0.7
    }


def evaluate_module_consensus(module_weights: Dict[str, float], module_scores: Dict[str, float]) -> Tuple[float, bool]:
    """
    Evaluates dynamic weighted consensus across cognitive modules (siphoned from AI_Agent_OS consensus models).

    :param module_weights: Map of module identifier to assigned decision weight.
    :param module_scores: Map of module identifier to performance or alignment score.
    :return: Tuple of (weighted_consensus_score: float, consensus_passed: bool).
    """
    if not module_weights or not module_scores:
        return 0.0, False

    total_weight = 0.0
    weighted_sum = 0.0

    for mod_id, weight in module_weights.items():
        if mod_id in module_scores:
            safe_weight = max(0.0, float(weight))
            safe_score = max(0.0, min(1.0, float(module_scores[mod_id])))
            weighted_sum += safe_weight * safe_score
            total_weight += safe_weight

    if total_weight <= 0.0:
        return 0.0, False

    consensus_score = round(weighted_sum / total_weight, 4)
    consensus_passed = consensus_score >= 0.70
    return consensus_score, consensus_passed


def sanitize_cognitive_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitizes cognitive state payloads to prevent data corruption and unexpected mutations.

    :param payload: Input dictionary payload.
    :return: Sanitized dictionary payload.
    """
    if not isinstance(payload, dict):
        return {}

    sanitized: Dict[str, Any] = {}
    for key, value in payload.items():
        clean_key = str(key).strip()
        if isinstance(value, (int, float, str, bool, type(None))):
            sanitized[clean_key] = value
        elif isinstance(value, dict):
            sanitized[clean_key] = sanitize_cognitive_payload(value)
        elif isinstance(value, (list, tuple)):
            sanitized[clean_key] = [
                sanitize_cognitive_payload(item) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            sanitized[clean_key] = str(value)

    return sanitized