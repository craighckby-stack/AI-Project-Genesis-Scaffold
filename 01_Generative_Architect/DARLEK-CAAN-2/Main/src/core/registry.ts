/**
 * DARLEK CANN V3.0: Agent Registry
 * Ensures clean teardown and lifecycle management for swarm agents.
 */
export interface AgentInstance {
  id: string;
  cleanup: () => void;
}

const registry = new Map<string, AgentInstance>();

export const registerAgent = (agent: AgentInstance) => {
  registry.set(agent.id, agent);
};

export const teardownAll = () => {
  registry.forEach((agent) => agent.cleanup());
  registry.clear();
};



