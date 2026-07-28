export interface GovernancePolicy {
  id: string;
  rules: string[];
  allowSelfMutation: boolean;
  maxMutationIntensity: number;
  auditTrailEnabled: boolean;
}