/// <reference types="vite/client" />

/**
 * Type definitions for environment variables
 * Vite exposes env variables on import.meta.env
 */
interface ImportMetaEnv {
    /** MapTiler API key for terrain tiles */
    readonly VITE_MAPTILER_API_KEY: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }