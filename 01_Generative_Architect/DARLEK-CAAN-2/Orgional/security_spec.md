# Security Specification - AetherForge Ω-Prime

## 1. Data Invariants (Schema Constraints)
- World: { clock: number, integrity: [0, 100], epoch: number }
- Agent: { worldId: string, archetype: 'MORTAL' | 'ASCENDANT' | 'VOID' }
- Global: { faith: number >= 0, sin: number >= 0 }

## 2. Threat Vector Mitigation Matrix
| ID | Threat | Mitigation Strategy | Enforcement Layer |
|---|---|---|---|
| 1 | Empty World | Strict Zod/Joi schema validation | API Gateway |
| 2 | Infinite Complexity | Max-depth/Max-node constraints | Application Logic |
| 3 | Ghost Fields | Allow-list property filtering | Firestore Rules |
| 4 | Negative Population | Range validation (min: 0) | Firestore Rules |
| 5 | Epoch Injection | Epoch range check (current_epoch ± 1) | Application Logic |
| 6 | Integrity Poisoning | Clamped update logic (max: 100) | Firestore Rules |
| 7 | Identity Theft | JWT verification & UID binding | Firebase Auth |
| 8 | Rapid Fire Events | Rate limiting (10 req/s per UID) | Cloud Functions |
| 9 | Invalid Archetype | Enum-based validation | Firestore Rules |
| 10 | Sin Erasure | Server-side transaction only | Cloud Functions |
| 11 | Faith Inflation | Atomic increment/decrement locks | Firestore Rules |
| 12 | Log Spoofing | Regex-based prefix blocking | Cloud Functions |

## 3. Security Enforcement Rules (Firestore Pseudo-Code)
javascript
match /worlds/{worldId} {
  allow update: if request.resource.data.integrity <= 100 
                && request.resource.data.population >= 0;
}
match /agents/{agentId} {
  allow create: if request.resource.data.archetype in ['MORTAL', 'ASCENDANT', 'VOID'];
}


## 4. Testing Protocol
- Automated integration tests must execute all 12 payloads against the staging environment.
- Failure to return `PERMISSION_DENIED` or `400 BAD REQUEST` triggers a build failure.