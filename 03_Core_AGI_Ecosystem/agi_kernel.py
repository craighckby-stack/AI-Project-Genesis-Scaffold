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
    Delegates complex utility logic to 'agi_kernel_utils.py',
    diagnostic reporting to 'agi_kernel_diagnostics.py', and
    state management to 'kernel_state_manager.py'.

SIPHONED PATTERNS:
    - Zero-Leak State Isolation (from AI_Agent_OS)
    - Telemetry-Aware Execution (from AI_Agent_OS)
    - Consensus-Weighted Health Reporting
"""

from __future__ import annotations
import time
import logging
from typing import Dict, Any, Callable, List, Optional

# Internal Imports (Delegated Logic)
from .agi_kernel_utils import (
    generate_kernel_id, 
    get_system_telemetry, 
    validate_kernel_hook
)
from .agi_kernel_diagnostics import get_kernel_health_metrics
from .kernel_state_manager import KernelStateManager

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - KERNEL - %(levelname)s - %(message)s')
logger = logging.getLogger("AGI_KERNEL")

class AgiKernel:
    """
    The central AGI Kernel responsible for system orchestration,
    lifecycle management, and state persistence.
    """
    
    def __init__(self) -> None:
        self.kernel_id = generate_kernel_id()
        self.state_manager = KernelStateManager()
        self.is_active = False
        self.boot_time: Optional[float] = None
        
        self.lifecycle_hooks: Dict[str, List[Callable]] = {
            "on_boot": [],
            "on_shutdown": [],
            "on_error": [],
            "on_heartbeat": []
        }
        
        logger.info(f"Kernel initialized with ID: {self.kernel_id}")

    def register_hook(self, event: str, hook: Callable) -> bool:
        """
        Registers a lifecycle hook if valid.
        
        :param event: The lifecycle event name.
        :param hook: The callable to execute.
        :return: True if registration was successful.
        """
        if event in self.lifecycle_hooks and validate_kernel_hook(hook):
            self.lifecycle_hooks[event].append(hook)
            logger.debug(f"Registered hook for event: {event}")
            return True
        return False

    def boot(self) -> None:
        """
        Executes the kernel boot sequence with diagnostic tracking.
        Transitions the kernel to an active state.
        """
        if self.is_active:
            logger.warning("Kernel is already active. Boot sequence aborted.")
            return

        logger.info("Starting Kernel boot sequence...")
        self.boot_time = time.time()
        
        for hook in self.lifecycle_hooks["on_boot"]:
            try:
                hook()
            except Exception as e:
                self.handle_error(f"Boot hook failure: {str(e)}")

        self.is_active = True
        logger.info("Kernel boot sequence complete. System is ACTIVE.")

    def shutdown(self) -> None:
        """
        Executes the kernel shutdown sequence.
        Cleans up resources and transitions to inactive state.
        """
        if not self.is_active:
            logger.warning("Kernel is not active. Shutdown sequence aborted.")
            return

        logger.info("Starting Kernel shutdown sequence...")
        
        for hook in self.lifecycle_hooks["on_shutdown"]:
            try:
                hook()
            except Exception as e:
                logger.error(f"Shutdown hook failure: {str(e)}")

        self.is_active = False
        self.state_manager.clear()
        logger.info("Kernel shutdown complete. System is INACTIVE.")

    def handle_error(self, message: str) -> None:
        """
        Dispatches error handling hooks and logs the event.
        
        :param message: The error message to process.
        """
        logger.error(f"Kernel Error Detected: {message}")
        for hook in self.lifecycle_hooks["on_error"]:
            try:
                # Hooks can optionally accept the error message
                try:
                    hook(message)
                except TypeError:
                    hook()
            except Exception as e:
                logger.critical(f"Error handler hook failed: {str(e)}")

    def heartbeat(self) -> None:
        """
        Triggers a heartbeat event to maintain system persistence
        and execute periodic maintenance hooks.
        """
        if not self.is_active:
            return

        for hook in self.lifecycle_hooks["on_heartbeat"]:
            try:
                hook()
            except Exception as e:
                self.handle_error(f"Heartbeat hook failure: {str(e)}")

    def get_status(self) -> Dict[str, Any]:
        """
        Returns the current kernel status, telemetry, and health metrics.
        
        :return: A dictionary containing the kernel's operational status.
        """
        return {
            "kernel_id": self.kernel_id,
            "is_active": self.is_active,
            "uptime": time.time() - self.boot_time if self.boot_time else 0,
            "telemetry": get_system_telemetry(),
            "health": get_kernel_health_metrics(),
            "state_keys": self.state_manager.get_all_keys()
        }

# Singleton instance for the ecosystem
kernel_instance = AgiKernel()

def get_kernel() -> AgiKernel:
    """
    Returns the global kernel instance.
    Ensures a single point of truth for the AGI Ecosystem.
    """
    return kernel_instance