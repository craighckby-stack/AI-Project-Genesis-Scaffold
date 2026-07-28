/**
 * SubstrateThemeRegistry
 * Orchestrates dynamic theme injection and semantic visual mapping.
 * Siphoned from AetherForge-2.0 and AI-Project design paradigms.
 */

export interface IThemeSubstrate {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  onSurface: string;
}

export class SubstrateThemeRegistry {
  private static instance: SubstrateThemeRegistry;
  private _currentTheme: IThemeSubstrate = {
    primary: '#6366f1',
    secondary: '#10b981',
    background: '#0f172a',
    surface: '#1e293b',
    onSurface: '#f8fafc'
  };

  public static getInstance(): SubstrateThemeRegistry {
    if (!this.instance) this.instance = new SubstrateThemeRegistry();
    return this.instance;
  }

  public getTheme(): IThemeSubstrate {
    return { ...this._currentTheme };
  }

  public evolveTheme(mutation: Partial<IThemeSubstrate>): void {
    this._currentTheme = { ...this._currentTheme, ...mutation };
    // Trigger system-wide visual re-render via event bus
  }
}