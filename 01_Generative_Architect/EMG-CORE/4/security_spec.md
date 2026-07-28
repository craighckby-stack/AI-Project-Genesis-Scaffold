# Security Spec: EMG Core Identity System

## Data Invariants
1. A user can only access their own EMG Core identity.
2. The `name` field must always be "EMG Core".
3. `learningLog`, `evolutionHistory`, and `insightConnections` must be arrays.
4. `principles` must be an array of strings.
5. `principles` can only be refined by the system logic (simulated via update gates).

## The Dirty Dozen Payloads (Target: Denied)

1. **Identity Spoofing**: Attempt to create a document for `userB` as `userA`.
2. **Shadow Field Injection**: Attempt to add `isAdmin: true` to the identity.
3. **Core Name Hijack**: Change `name` to "Malicious Core".
4. **Principle Deletion**: Attempt to set `principles` to an empty array or null.
5. **Log Erasure**: Attempt to clear the `learningLog` array.
6. **Marker Injection**: Inject a fake `EvolutionMarker` with a future timestamp.
7. **Connection Poisoning**: Create a connection pointing to a non-existent index.
8. **Unauthorized Get**: Read `userB`'s identity as `userA`.
9. **Blanket Read (List)**: Attempt to list all users' identities.
10. **Type Mismatch**: Submit a string for `learningLog` instead of an array.
11. **Illegal Character ID**: Use `../../malicious` as a userId.
12. **Timestamp Forgery**: Submit a client-side timestamp for a marker.

## Test Runner
Verified via `firestore.rules.test.ts`.
