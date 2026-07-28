export type SovereignMode = 'AGGRESSIVE_EVOLUTION' | 'STABLE_MAINTENANCE' | 'DORMANT';

export interface SovereignState {
  cycle: number;
  mode: SovereignMode;
  focus: string; 
  entropy: number; 
  integrity: number; 
}

export interface ICore {
  boot(): Promise<void>;
  pulse(): Promise<SovereignState>; 
  shutdown(): Promise<void>;
}

export interface ICortex {
  recall(context: string): Promise<any>;
  memorize(key: string, data: any): Promise<boolean>;
  reflect(pastCycles: number): Promise<string>; 
}

export interface IArmory {
  registerTool(name: string, tool: any): void;
  invoke(toolName: string, args: any): Promise<any>;
  listCapabilities(): string[];
}

export interface ISentinel {
  validateMutation(diff: string): boolean;
  enforceProtocol(protocolId: string): void;
  scanForHazards(): Promise<string[]>;
}

export interface IForge {
  analyze(targetPath: string): Promise<string>;
  mutate(targetPath: string, directive: string): Promise<string>; 
  synthesize(newModuleName: string): Promise<void>; 
}

export interface INexus {
  connect(service: string): Promise<boolean>;
  broadcast(message: string): Promise<void>;
  listen(): Promise<any>;
}

export interface ISovereignKernel {
  readonly state: SovereignState;
  readonly cortex: ICortex;
  readonly armory: IArmory;
  readonly sentinel: ISentinel;
  readonly forge: IForge;
  readonly nexus: INexus;
  evolve(): Promise<void>;
}
