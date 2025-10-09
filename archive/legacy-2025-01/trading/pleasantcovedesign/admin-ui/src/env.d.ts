/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RQ_DEVTOOLS?: string;
  readonly VITE_USE_MSW?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


