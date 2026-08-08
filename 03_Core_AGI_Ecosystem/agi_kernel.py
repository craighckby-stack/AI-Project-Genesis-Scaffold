"""
AGI KERNEL
==========

PURPOSE:
    Self-bootstrapping core for the AGI Ecosystem. Manages lifecycle hooks,
    system state, and diagnostic registration.

ROLE:
    Acts as the primary orchestrator for the 03_Core_AGI_Ecosystem.
    Connects to diagnostic registries and ensures system integrity.

INTEGRATION:
    Delegates complex utility logic to 'agi_kernel_utils.py'.
"""

from __future__ import annotations
from typing import Dict, Any, Callable, List
from .agi_kernel_utils import generate_kernel_id, get_system_telemetry, validate_kernel_hook

class AgiKernel:
    """
    The central AGI Kernel responsible for system orchestration,
    lifecycle management, and state persistence.
    """
    
    def __init__(self) -> None:
        self.kernel_id = generate_kernel_id()
        self.state: Dict[str, Any] = {}
        self.lifecycle_hooks: Dict[str, List[Callable]] = {
            "on_boot": [],
            "on_shutdown": [],
            "on_error": []
        }
        self.telemetry = get_system_telemetry()

    def register_hook(self, event: str, hook: Callable) -> bool:
        """Registers a lifecycle hook if valid."""
        if event in self.lifecycle_hooks and validate_kernel_hook(hook):
            self.lifecycle_hooks[event].append(hook)
            return True
        return False

    def boot(self) -> None:
        """Executes the kernel boot sequence."""
        for hook in self.lifecycle_hooks["on_boot"]:
            try:
                hook()
            except Exception as e:
                self.handle_error(f"Boot hook failure: {str(e)}")

    def handle_error(self, message: str) -> None:
        """Dispatches error handling hooks."""
        for hook in self.lifecycle_hooks["on_error"]:
            hook(message)

    def get_status(self) -> Dict[str, Any]:
        """Returns the current kernel status and telemetry."""
        return {
            "kernel_id": self.kernel_id,
            "telemetry": self.telemetry,
            "state_keys": list(self.state.keys())
        }

# Singleton instance for the ecosystem
kernel_instance = AgiKernel()

def get_kernel() -> AgiKernel:
    """Returns the global kernel instance."""
    return kernel_instance