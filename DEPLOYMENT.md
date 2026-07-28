# Deployment

To separate deployments fra samme repository — ét pr. brand. Backend (Supabase) er fælles og uafhængig af frontendhostingen.

## 0) Supabase (én gang, fælles for begge brands)

1. Opret projekt på supabase.com.
2. `supabase link --project-ref <ref>` og `supabase db push` (kører `supabase/migrations/`).
3. Kør evt. `supabase/seed.sql` i SQL-editoren (KUN til test — indeholder TESTDATA).
4. **Slå selvregistrering fra**: Authentication → Providers → Email → disable signups (kun invitationer).
5. Opret første admin: Authentication → Invite user → kør derefter i SQL-editoren:
   `select public.grant_admin('email@firma.dk', 'autohuset-vest', 'dealer_admin');`
6. Deploy Edge Functions: `supabase functions deploy plate-lookup submit-lead admin-invite-user`.
   `admin-invite-user` bruges af adminpanelets "Brugere"-side (Fase 3) til at invitere nye kolleger uden manuel SQL –
   den kræver `SUPABASE_SERVICE_ROLE_KEY` og `SUPABASE_ANON_KEY`, som Supabase sætter automatisk for Edge Functions.
7. Sæt function secrets (ALDRIG i frontend):
   ```bash
   supabase secrets set VEHICLE_LOOKUP_PROVIDER=mock VEHICLE_LOOKUP_ENABLED=true \
     EMAIL_PROVIDER=mock EMAIL_FROM_ADDRESS=noreply@dit-domæne.dk \
     ADMIN_LEAD_EMAIL=leads@dit-domæne.dk ADMIN_URL=https://dit-domæne.dk
   ```
8. Før produktion: begræns CORS i `supabase/functions/_shared/cors.ts` til brandets domæner.

## 1) Vercel (primær anbefaling)

Pr. brand (opret to Vercel-projekter, der peger på samme GitHub-repo):

1. **Import Git Repository** → vælg repoet.
2. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
3. Environment variables (Production + Preview):
   ```
   VITE_BRAND_KEY=autohuset-vest        # hhv. autohuset-v i det andet projekt
   VITE_SUPABASE_URL=https://<ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key>
   VITE_SITE_URL=https://autohusetvest.dk
   VITE_GTM_ID= / VITE_GA4_ID= / VITE_GOOGLE_ADS_ID= / VITE_META_PIXEL_ID=   (valgfrit)
   ```
4. SPA-routing: `vercel.json` i repoet håndterer rewrites til `index.html` (se nedenfor).
5. Tilslut domænet under Settings → Domains, og sæt DNS (CNAME → cname.vercel-dns.com).
6. Generér sitemap i buildet: sæt Build Command til
   `SITE_URL=$VITE_SITE_URL node scripts/generate-sitemap.mjs && npm run build`
7. Test preview-deploys på PR'er og produktionsdeploy fra `main`.

`vercel.json`:
```json
{ "rewrites": [{ "source": "/((?!assets/).*)", "destination": "/index.html" }] }
```

## 2) Netlify (dokumenteret alternativ)

1. **Add new site → Import an existing project** → samme GitHub-repo (ét site pr. brand).
2. Build command: `npm run build` · Publish directory: `dist`.
3. Samme environmentvariabler som ovenfor (Site settings → Environment variables).
4. SPA-redirects: `netlify.toml` i repoet (se nedenfor) — Netlify kræver eksplicit redirect-regel, hvor Vercel bruger `rewrites`.
5. Tilslut domæne under Domain management.

`netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Forskelle fra Vercel:** redirects konfigureres i `netlify.toml` i stedet for `vercel.json`; preview-miljøer hedder "Deploy Previews"; env-variabler kan ikke opdeles pr. branch på gratisplanen.

## 3) Tjekliste pr. deployment

- ☐ `VITE_BRAND_KEY` er sat korrekt (autohuset-vest / autohuset-v)
- ☐ Rigtigt domæne i `VITE_SITE_URL` + robots.txt/sitemap peger korrekt
- ☐ SPA-routing virker (hard refresh på /biler/en-bil giver ikke 404)
- ☐ Ingen hemmelige nøgler i `VITE_`-variabler
- ☐ LEGAL-CHECKLIST.md er gennemgået før offentlig lancering
