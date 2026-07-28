import { createHmac, randomBytes } from 'crypto';

/**
 * OMEGA Security Orchestrator v3.0
 * Enforces runtime integrity for self-modifying agent swarms.
 * Integrates with sovereign-kernel and unitary-core security protocols.
 */
export class SecurityOrchestrator {
  private static instance: SecurityOrchestrator;
  private readonly secretKey: string = process.env.OMEGA_SECURITY_KEY || randomBytes(32).toString('hex');
  private activeSessions: Set<string> = new Set();
  private readonly SECURE_EXTENSIONS = ['.consciousness.dump', '.quantum.data', '.swarm.state'];

  private constructor() {}

  public static getInstance(): SecurityOrchestrator {
    if (!SecurityOrchestrator.instance) {
      SecurityOrchestrator.instance = new SecurityOrchestrator();
    }
    return SecurityOrchestrator.instance;
  }

  /**
   * Validates access and registers session to prevent memory leaks.
   */
  public validateStateAccess(filePath: string, sessionId: string): boolean {
    const isAuthorized = this.SECURE_EXTENSIONS.some(ext => filePath.endsWith(ext));
    if (isAuthorized) {
      this.activeSessions.add(sessionId);
    }
    return isAuthorized;
  }

  /**
   * Cryptographic signing for evolution history using HMAC-SHA256.
   */
  public generateAuditHash(diff: string): string {
    return createHmac('sha256', this.secretKey)
      .update(diff)
      .digest('hex');
  }

  /**
   * Circuit breaker: Terminates session if integrity is compromised.
   */
  public terminateSession(sessionId: string): void {
    if (this.activeSessions.has(sessionId)) {
      this.activeSessions.delete(sessionId);
    }
  }

  public getActiveSessionCount(): number {
    return this.activeSessions.size;
  }
}



