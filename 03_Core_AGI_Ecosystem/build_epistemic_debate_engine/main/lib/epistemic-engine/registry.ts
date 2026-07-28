export class PropositionRegistry {
  private static instance: PropositionRegistry;
  private propositions: Map<string, LogicalProposition> = new Map();

  static getInstance() {
    if (!this.instance) this.instance = new PropositionRegistry();
    return this.instance;
  }

  add(prop: LogicalProposition) {
    this.propositions.set(prop.id, prop);
  }

  getHistory(agentId: string) {
    return Array.from(this.propositions.values()).filter(p => p.agentId === agentId);
  }
}