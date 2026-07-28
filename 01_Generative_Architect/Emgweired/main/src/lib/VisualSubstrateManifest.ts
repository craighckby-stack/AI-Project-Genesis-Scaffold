/**
 * @file src/lib/VisualSubstrateManifest.ts
 * @description Centralized registry for application visual assets.
 * Integrates binary resources into the Dalek Caan Ω state-synchronization pattern.
 */

export interface IVisualAsset {
  id: string;
  path: string;
  density: 'mdpi' | 'hdpi' | 'xhdpi' | 'xxhdpi' | 'xxxhdpi';
  registeredAt: number;
}

export const VisualSubstrateManifest: Record<string, IVisualAsset> = {
  xhdpi_launcher: {
    id: 'ic_launcher_xhdpi',
    path: 'app/src/main/res/mipmap-xhdpi/ic_launcher.webp',
    density: 'xhdpi',
    registeredAt: Date.now(),
  }
};

export function getAssetPath(id: string): string | undefined {
  return VisualSubstrateManifest[id]?.path;
}