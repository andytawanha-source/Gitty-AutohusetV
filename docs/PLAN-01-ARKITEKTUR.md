# Arkitekturbeskrivelse

> Udkast — del af projektopstart (spec pkt. 27). Autohuset Vest bygges først; Autohuset V aktiveres via samme kodebase.

## Overordnet model

Én kodebase, to brands (multi-tenant). Brandet vælges ved build/deploy via `VITE_BRAND_KEY` (`autohuset-vest` | `autohuset-v`), med fallback til domænematch. Al branddata (navn, farver, logo, kontakt, SEO, tracking-ID'er, juridiske tekster) ligger i en central brandkonfiguration + `site_settings` i databasen, aldrig hardcodet i komponenter.

```
Browser (React SPA, Vite)
   │  anon key, RLS-beskyttet
   ▼
Supabase (selvstændigt projekt)
   ├── PostgreSQL  – alle tabeller har organization_id + RLS
   ├── Auth        – adminbrugere, roller via user_roles
   ├── Storage     – public: vehicle-images · private: lead-images (signerede URL'er)
   └── Edge Functions (Deno, hemmelige nøgler ligger KUN her)
        ├── plate-lookup   – provider-uafhængigt nummerpladeopslag + rate limit
        ├── submit-lead    – validering, leadoprettelse, samtykkelagring
        └── send-email     – Resend/Postmark-adapter + email_logs
```

## Nøglebeslutninger

1. **SPA (Vite + React Router), ikke SSR.** Spec kræver Vite; SEO håndteres med prerender-venlige meta-tags via `react-helmet-async`, sitemap-generator (script) og SEO-slugs. Dokumenteret trade-off: fuld SSR ville kræve Next/Remix og afviger fra spec.
2. **Tenant-isolation i databasen, ikke i klienten.** Alle rækker har `organization_id`; RLS-politikker håndhæver adskillelse. Offentlige læsninger filtreres pr. brand via RLS + `brand_key`.
3. **Provider-uafhængige adaptere** for nummerplade-API, e-mail og tracking (interfaces + mock-implementeringer). Rigtige leverandører tilsluttes udelukkende via env-variabler i Edge Functions.
4. **Leads må aldrig gå tabt:** leadet gemmes i DB først; e-mailafsendelse sker bagefter og logges — fejl her ruller ikke leadet tilbage.
5. **Ingen secrets i frontend.** Kun `VITE_`-prefiksede offentlige værdier i klienten. Service-role-nøgle og API-nøgler findes kun som Supabase-function-secrets.

## Teknisk stack (fastlagt)

React 18 + TypeScript + Vite · Tailwind CSS + shadcn/ui · React Router · TanStack Query · React Hook Form + Zod · Lucide · Supabase (Postgres, Auth, Storage, Edge Functions, migrations) · Vitest + Testing Library · Playwright · GitHub Actions · Vercel (primær) / Netlify (dokumenteret alternativ).

## Miljøer

- **Lokal udvikling:** mock-provider for nummerplade + e-mail (tydeligt markeret "DEMO/MOCK"), Supabase lokalt eller hosted dev-projekt.
- **Preview:** Vercel preview pr. PR.
- **Produktion:** to deployments (ét pr. brand) fra samme repo med hver sin `VITE_BRAND_KEY`.

## Antagelser (dokumenteres løbende i docs/ANTAGELSER.md)

- Supabase-projekt oprettes af kunden/udvikleren; jeg leverer migrations + seed, der kan køres med Supabase CLI.
- Nummerplade-leverandør er ikke valgt endnu → mock-provider + interface leveres; leverandørvalg kræver forretningsbeslutning (se PLAN-06).
- Finansieringseksempler er statiske placeholders med juridisk forbehold, indtil en finansieringspartner er valgt.
