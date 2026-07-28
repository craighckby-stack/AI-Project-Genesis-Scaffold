# Requiem Overlay System

## Architectural Blueprint
- **Purpose**: High-fidelity notification and system-state visualization for AGI orchestration.
- **Integration**: Designed for use with `darlek-cann-v3` agent swarms.
- **Lifecycle**: Managed via `createPortal` with automatic body-scroll locking and event-listener cleanup.

## Interface Declaration
typescript
interface RequiemOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  telemetryData?: Record<string, any>;
  priority?: 'critical' | 'nominal' | 'debug';
}


## System Integration
- **Telemetry**: Automatically parses and renders JSON state blobs for real-time diagnostic feedback.
- **Security**: Implements `Escape` key termination and click-outside-to-close logic to prevent UI deadlocks.




