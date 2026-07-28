/**
 * @file SubstrateCapabilityRegistry.ts
 * @role Foundational orchestration layer for the Dalek Caan Ω ecosystem.
 * @description Manages the high-fidelity capability manifest for the system's persistence architecture.
 */

export const SubstrateCapabilityRegistry = {
  version: "3.0.0-Ω",
  capabilities: {
    GEMINI_REASONING: "High Thinking Gemini AI reasoning",
    GEOMETRIC_VISUALIZER: "3D Core Gem visualizer",
    PERSISTENCE: "Room local persistence",
    BACKUP: "Local/GitHub binary backups"
  },
  validate: (manifest: any) => {
    return manifest.majorCapabilities.includes("MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API");
  }
};

export default SubstrateCapabilityRegistry;