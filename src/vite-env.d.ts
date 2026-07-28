/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BRAND_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_GTM_ID?: string;
  readonly VITE_GA4_ID?: string;
  readonly VITE_GOOGLE_ADS_ID?: string;
  readonly VITE_META_PIXEL_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
