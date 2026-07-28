/**
 * SubstrateExclusionRegistry
 * Role: Centralized logic for repository entropy management.
 * This registry defines the programmatic boundaries of the Dalek Caan Ω ecosystem.
 */

export const SubstrateExclusionRegistry = {
  sensitivePatterns: ['.env*', '*.pem', '*.key', '*.keystore'],
  buildArtifacts: ['dist/', '.next/', 'build/', '.turbo/', '.cache/'],
  aiArtifacts: ['models/', 'checkpoints/', '*.pt', '*.onnx'],
  
  isExcluded: (path: string): boolean => {
    return [...SubstrateExclusionRegistry.sensitivePatterns, ...SubstrateExclusionRegistry.buildArtifacts]
      .some(pattern => path.includes(pattern));
  }
};

export default SubstrateExclusionRegistry;