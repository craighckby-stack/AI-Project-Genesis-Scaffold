# Animation System Architecture

## Overview
This animation system is designed for the DARLEK-CANN v3.0 ecosystem. It utilizes hardware-accelerated CSS properties to maintain 60fps performance during complex state transitions.

## Design Tokens
- **Easing**: Uses `cubic-bezier` for organic, non-linear motion.
- **Performance**: All animations utilize `transform` and `opacity` to avoid layout thrashing.
- **Integration**: Designed to be consumed by Tailwind via `@layer utilities`.

## Implementation Schema
1. **Entrance**: `.animate-fade-in-up` (Used for component mounting).
2. **State**: `.animate-pulse-subtle` (Used for active agent status indicators).
3. **Staggering**: Use `.delay-[100-300]` classes to create sequential entrance patterns.

## Integration
Import this file in your `globals.css` or `layout.tsx` to ensure global availability across the Agent Orchestra.



