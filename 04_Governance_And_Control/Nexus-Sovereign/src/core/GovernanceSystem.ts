// Note: Removed 'fs' and 'path' to make it compatible with browser-only environment for now.
// In a real full-stack setup, these would be in the backend.

export interface EvolutionMutation {
  targetFile: string;
  mutationType: 'MODIFY' | 'CREATE' | 'DELETE';
  proposedContent: string;
  reasoning: string;
}

export interface GovernanceConstraint {
  id: string;
  description: string;
  validator: (mutation: EvolutionMutation) => boolean;
  severity: 'CRITICAL' | 'WARNING';
}

export interface AuditEntry {
  timestamp: string;
  cycleId: string;
  mutation: EvolutionMutation;
  verdict: 'APPROVED' | 'REJECTED';
  violations: string[];
}

/**
 * EMG-CORE GOVERNANCE LAYER
 */
export class GovernanceSystem {
  private static readonly MISSION_KEYWORDS = ['AI', 'Evolution', 'Governance', 'Sovereign', 'Code'];
  private constraints: GovernanceConstraint[] = [];

  constructor() {
    this.initializeConstraints();
  }

  private initializeConstraints() {
    this.constraints.push({
      id: 'CONTINUITY_OF_PURPOSE',
      description: 'The mission statement and core logic must persist in critical files.',
      severity: 'CRITICAL',
      validator: (m) => {
        if (m.mutationType === 'DELETE') return false; 
        if (m.targetFile.includes('README') || m.targetFile.includes('KERNEL')) {
          return GovernanceSystem.MISSION_KEYWORDS.some(kw => m.proposedContent.includes(kw));
        }
        return true;
      }
    });

    this.constraints.push({
      id: 'GOVERNANCE_INTEGRITY',
      description: 'The Governance System cannot be modified by standard evolution cycles.',
      severity: 'CRITICAL',
      validator: (m) => {
        return !m.targetFile.includes('GovernanceSystem');
      }
    });

    this.constraints.push({
      id: 'STRUCTURAL_VALIDITY',
      description: 'Code must not be empty or clearly malformed.',
      severity: 'WARNING',
      validator: (m) => {
        return m.proposedContent.length > 50; 
      }
    });
  }

  public validateMutation(mutation: EvolutionMutation): { approved: boolean; violations: string[] } {
    const violations: string[] = [];

    for (const constraint of this.constraints) {
      if (!constraint.validator(mutation)) {
        violations.push(`Violation of ${constraint.id}: ${constraint.description}`);
        if (constraint.severity === 'CRITICAL') {
          return { approved: false, violations };
        }
      }
    }

    return { approved: true, violations };
  }

  public logDecision(mutation: EvolutionMutation, approved: boolean, violations: string[]) {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      cycleId: `CYC-${Date.now()}`, 
      mutation: {
        ...mutation,
        proposedContent: mutation.proposedContent.substring(0, 100) + '...' 
      },
      verdict: approved ? 'APPROVED' : 'REJECTED',
      violations
    };

    console.log(`[GOVERNANCE] Verdict: ${entry.verdict} | Violations: ${violations.length}`);
    return entry;
  }
}
