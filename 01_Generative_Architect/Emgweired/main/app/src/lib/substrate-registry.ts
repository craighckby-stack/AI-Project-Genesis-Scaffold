/**
 * Substrate Registry Utility
 * Manages binary assets for the Dalek Caan Ω ecosystem.
 */
export interface SubstrateAsset {
  id: string;
  path: string;
  integrityVerified: boolean;
}

export const Registry: Record<string, SubstrateAsset> = {
  "ic_launcher_round_xxhdpi": {
    id: "ic_launcher_round_xxhdpi",
    path: "app/src/main/res/mipmap-xxhdpi/ic_launcher_round.webp",
    integrityVerified: true
  }
};

export function getAssetPath(id: string): string | undefined {
  return Registry[id]?.path;
}