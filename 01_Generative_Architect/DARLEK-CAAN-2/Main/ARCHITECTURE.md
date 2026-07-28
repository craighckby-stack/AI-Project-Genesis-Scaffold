# System Architecture: DARLEK CANN v3.0

## 1. Design Philosophy
DARLEK CANN operates on the principle of 'Minimalist Maximalism': every line of code must be functional, testable, and self-documenting. 

## 2. Component Hierarchy
- `EvolutionEngine`: The primary mutation driver.
- `SiphonController`: Adapts external repository patterns into local TypeScript modules.
- `IntegrityGuard`: Prevents regression via automated diagnostic logging.

## 3. Memory Management
- All subscriptions must implement `AbortController` cleanup.
- State is persisted via `SWR` for reactive UI updates and `LevelDB` for long-term agent memory.




