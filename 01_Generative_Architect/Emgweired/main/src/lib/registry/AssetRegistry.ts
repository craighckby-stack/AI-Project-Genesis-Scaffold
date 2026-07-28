/**
 * AssetRegistry.ts
 * Centralized management for Dalek Caan Ω binary assets.
 * Prevents corruption by decoupling binary references from logic.
 */

export interface IAssetRegistry {
  register(id: string, path: string): void;
  getAsset(id: string): string | null;
}

class AssetRegistry implements IAssetRegistry {
  private registry: Map<string, string> = new Map();

  register(id: string, path: string) {
    this.registry.set(id, path);
  }

  getAsset(id: string) {
    return this.registry.get(id) || null;
  }
}

export const assetRegistry = new AssetRegistry();
assetRegistry.register('ic_launcher_xxhdpi', 'app/src/main/res/mipmap-xxhdpi/ic_launcher.webp');