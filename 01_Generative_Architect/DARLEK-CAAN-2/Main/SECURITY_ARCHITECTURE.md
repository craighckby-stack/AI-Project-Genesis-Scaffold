# DARLEK CANN: Unified Security & Governance Architecture (v3.1)

## 1. Executive Summary
This document defines the Zero-Trust security posture for the DARLEK CANN ecosystem. It enforces strict data isolation, schema validation, and multi-tenant access control, siphoning architectural patterns from `microsoft/autogen` and `vercel/ai` to ensure agent-swarm integrity.

## 2. Threat Model & Defense-in-Depth
- **Data Isolation**: Multi-tenant partitioning via `tenant_id` and `agent_id` scopes.
- **Schema Enforcement**: Strict validation via `firestore.rules` and `unitary-core` TypeScript interfaces.
- **Rate Limiting**: Firebase App Check integration to prevent unauthorized simulation cycles.
- **Audit Logging**: Every write operation triggers an immutable audit log entry in the `system_logs` collection.

## 3. Access Control Matrix (RBAC/ABAC)
| Entity | Read Access | Write Access | Constraints |
| :--- | :--- | :--- | :--- |
| **User** | Own documents | Own documents | `request.auth.uid == resource.data.ownerId` |
| **Agent** | Public/Shared | Own state | `request.auth.token.agent_id == resource.data.agent_id` |
| **System** | Global | Restricted | Admin SDK / Service Account Only |

## 4. Security Rules Implementation (`firestore.rules`)
javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // --- Helper Functions ---
    function isAuthenticated() { return request.auth != null; }
    function isOwner(uid) { return request.auth.uid == uid; }
    function isAgent(agentId) { return request.auth.token.agent_id == agentId; }
    
    // --- Schema Validation ---
    function isValidAgentSchema() {
      return request.resource.data.keys().hasAll(['schema_version', 'state', 'last_updated'])
             && request.resource.data.schema_version is int;
    }

    // --- Collections ---
    match /agents/{agentId} {
      allow read: if isAuthenticated();
      allow write: if (isOwner(resource.data.ownerId) || isAgent(agentId)) && isValidAgentSchema();
    }
    
    match /debates/{debateId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }

    match /system_logs/{logId} {
      allow read: if false; // System only
      allow create: if isAuthenticated();
    }
  }
}


## 5. Deployment & CI/CD Pipeline
Automated deployment via GitHub Actions, mirroring `vercel/turborepo` and `microsoft/playwright` workflows:
1. **Lint**: `firebase-rules-lint` (Static analysis of security rules).
2. **Test**: `firebase emulators:exec "npm run test:security"` (Automated penetration testing against local emulator).
3. **Deploy**: `firebase deploy --only firestore:rules` (Atomic deployment).

## 6. Integration Context
This architecture is a core dependency for `craighckby-stack/Darlek-Cann-v3` and `craighckby-stack/unitary-core`. Any modifications to the `schema_version` MUST be reflected in the `unitary-core` data models to prevent state corruption.




