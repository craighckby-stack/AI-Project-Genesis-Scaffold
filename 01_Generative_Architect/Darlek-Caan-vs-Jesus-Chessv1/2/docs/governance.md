# PSR-Governance Framework

## 1. Purpose
To ensure the stability and integrity of self-modifying systems within the DARLEK CANN ecosystem.

## 2. Core Constraints
- **Immutability of Core**: The `unitary-core` must remain read-only during standard agentic cycles.
- **Validation**: All state changes must be validated against Zod schemas.
- **Teardown**: Every subscription (e.g., `onSnapshot`) must implement a cleanup function to prevent memory leaks.
- **Audit**: Every mutation must be logged with a unique hash linked to the agent ID.