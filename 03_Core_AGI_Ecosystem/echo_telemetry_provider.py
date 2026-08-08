"""
ECHO TELEMETRY PROVIDER
Role: Tracks performance metrics and execution health for signal propagation.
Integration: Siphons 'Tessera' diagnostic patterns for high-precision monitoring.
"""

from __future__ import annotations
import time
from typing import Dict, Any, List

class EchoTelemetryProvider:
    def __init__(self):
        self._metrics: List[Dict[str, Any]] = []

    def start_trace(self, signal_type: str) -> float:
        """Starts a performance trace for a signal."""
        return time.perf_counter()

    def end_trace(self, start_time: float, signal_type: str, status: str) -> None:
        """Finalizes a performance trace and records the duration."""
        duration = (time.perf_counter() - start_time) * 1000.0
        self._metrics.append({
            "signal": signal_type,
            "duration_ms": round(duration, 3),
            "status": status,
            "timestamp": time.time()
        })
        if len(self._metrics) > 500:
            self._metrics.pop(0)

    def get_average_latency(self) -> float:
        """Computes average propagation latency across the metric window."""
        if not self._metrics:
            return 0.0
        total = sum(m["duration_ms"] for m in self._metrics)
        return round(total / len(self._metrics), 3)
