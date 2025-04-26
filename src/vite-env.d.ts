/// <reference types="vite/client" />

// Разширяваме ImportMetaEnv с нашите променливи
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_USER_EMAIL: string;
  readonly VITE_SUPABASE_USER_PASSWORD: string;
  readonly [key: string]: string | undefined;
}
