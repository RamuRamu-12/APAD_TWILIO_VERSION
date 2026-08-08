/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_POC_MODE: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_PUBLIC_SITE_URL: string;
  readonly VITE_SUPPORT_EMAIL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
