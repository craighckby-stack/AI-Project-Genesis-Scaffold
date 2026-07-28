interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly GEMINI_API_KEY: string;
  readonly DARLEK_EVOLUTION_STAGE: string;
  readonly DISABLE_HMR: string;
  // Add other DARLEK specific variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace NodeJS {
  interface ProcessEnv {
    readonly GEMINI_API_KEY: string;
    readonly DISABLE_HMR: string;
    readonly [key: string]: string | undefined;
  }
}



