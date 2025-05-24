/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANALYZE_USERNAMES: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 