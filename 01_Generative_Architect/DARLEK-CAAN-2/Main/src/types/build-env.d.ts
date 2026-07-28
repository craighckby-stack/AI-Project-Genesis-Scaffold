export interface BuildEnvironment {
  readonly __BUILD_HASH__: string;
  readonly __AGENT_VERSION__: string;
  readonly __NODE_ENV__: 'development' | 'production' | 'test';
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends BuildEnvironment {}
  }
}

export {};



