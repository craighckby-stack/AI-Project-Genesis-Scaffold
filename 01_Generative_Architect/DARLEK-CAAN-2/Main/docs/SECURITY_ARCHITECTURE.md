# Security Architecture: Firestore Rules

## Overview
This system implements a multi-tier security model inspired by the `sovereign-kernel` and `SN` (Omni-Model) repositories. 

## Access Control Matrix
- **Agents**: Restricted to owners. Quantum-locked states are immutable.
- **System Config**: Restricted to administrative roles defined in the `admins` collection.
- **Audit Logs**: Write-only for authenticated users; Read-only for administrators.

## Implementation Details
- **RBAC**: Role-Based Access Control is enforced via the `isAdmin()` helper.
- **Integrity**: Schema validation ensures `ownerId` persistence during updates.
- **Teardown**: Rules are designed to be evaluated in O(1) time to minimize latency in high-frequency agent simulations.




