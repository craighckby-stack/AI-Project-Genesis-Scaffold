# Security Policy

## Supported Versions

We actively maintain and support the following versions of **DARLEK CANN**:

| Version | Supported          |
| ------- | ------------------ |
| v0.2.x  | :white_check_mark: |
| v0.1.x  | :warning: Limited  |

---

## Reporting a Vulnerability

As an autonomous self-mutating multi-agent sandbox, security is of paramount importance. If you discover any vulnerability in the Coherence Gate, database storage, API proxies, or autonomous execution pipeline, please report it immediately:

1. **Do not open a public GitHub issue** for security-related bugs.
2. Email your findings confidentially to the maintainer at `Craighckby@gmail.com`.
3. Provide a detailed summary containing:
   - A description of the issue.
   - Step-by-step instructions to reproduce the vulnerability.
   - Any potential impact on files or sandboxed environments.
   - Recommended remediation actions.

We aim to acknowledge receipt of your report within **24 hours** and supply a patched release within **5 business days**.

---

## Autonomous Operation Safeguards

To prevent uncontrolled mutations or security breaches on local machines, DARLEK CANN implements several guardrails:
- **Risk Scoring**: High-risk operations (such as code evaluation or structure replacement) are automatically run through secondary evaluation and can be configured to block auto-approve thresholds.
- **Client Proxies**: Raw access tokens are only used as dynamic inputs or securely bound environment secrets on server routes.
