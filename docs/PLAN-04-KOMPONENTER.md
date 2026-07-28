# Komponentoversigt

## Mappestruktur (src/)

```
src/
├── app/                 # App-shell, router, providers (Query, Helmet, Consent, Brand)
├── config/brands/       # brand.types.ts, autohuset-vest.ts, autohuset-v.ts, index.ts
├── lib/                 # supabase-klient, utils (format, slug, plade-normalisering), zod-schemas
├── components/
│   ├── ui/              # shadcn/ui-basis (button, input, dialog, sheet, tabs, …)
│   ├── layout/          # SiteHeader, MobileMenu, SiteFooter, StickyMobileCta, SkipLink, Breadcrumbs
│   ├── vehicles/        # VehicleCard, VehicleGrid, VehicleBadge, FavoriteButton,
│   │                    #   VehicleFilters (sidebar + drawer), FilterChips, SortSelect,
│   │                    #   VehicleGallery (swipe/lightbox), VehicleSpecs, VehicleFeatureList,
│   │                    #   RelatedVehicles, FinanceDisclaimer, VehicleInquiryForm
│   ├── sell/            # SellCarWizard + StepPlate, StepConfirmVehicle, StepCondition,
│   │                    #   StepPhotos (dropzone, komprimering, progress), StepContact,
│   │                    #   StepConsent, WizardProgress, PlateInput, MockDataBanner
│   ├── home/            # HeroSection (Køb/Sælg-toggle), QuickSearch, PlateQuickStart,
│   │                    #   FeaturedVehicles, LatestVehicles, ProcessSteps, UspSection,
│   │                    #   TestimonialsPlaceholder, FinanceTeaser, FaqAccordion,
│   │                    #   LocationSection, AnimatedCounter
│   ├── consent/         # CookieBanner, CookiePreferencesDialog, ConsentGate (fx kort)
│   ├── seo/             # Seo (title/meta/OG), JsonLd (Organization, AutoDealer, Vehicle, FAQ, Breadcrumb)
│   └── shared/          # SkeletonLoader, EmptyState, ErrorBoundary, ConfirmDialog, SuccessCelebration
├── features/
│   ├── plate-lookup/    # provider-interface, normaliseret model, mock-provider, klient til Edge Function
│   ├── tracking/        # trackingadapter, dataLayer, event-typer, consent-integration
│   └── favorites/       # useFavorites (in-memory + Supabase-synk for indloggede)
├── pages/               # public/ + legal/ + admin/ (én fil pr. route)
├── admin/components/    # AdminLayout, Sidebar, DashboardCards, VehicleForm, ImageManager,
│                        #   LeadTable, LeadDetail, LeadStatusFlow, NoteList, CsvImportDialog,
│                        #   SettingsForms, RoleGuard
├── hooks/               # useBrand, useVehicles, useVehicle, useLeads, useDebounce,
│                        #   useUrlFilters, usePrefersReducedMotion, useConsent
└── styles/              # tailwind.css, brand-CSS-variabler
```

## Principper

- Brandtokens som CSS-variabler (`--color-primary` …) sat af `BrandProvider` → samme komponenter, to udtryk.
- Al server-state via TanStack Query; formularer via React Hook Form + Zod (samme schemas genbruges server-side i Edge Functions).
- Filtertilstand lever i URL-searchparams (`useUrlFilters`) → delbare/indekserbare søgninger.
- Animationer: CSS/`framer-motion`-let brug, alle gated bag `usePrefersReducedMotion`.
- Admin er code-splittet (lazy routes), så offentligt bundle holdes lille.

## Edge Functions (supabase/functions/)

- `plate-lookup/` — validering, rate limit pr. IP+plade, providervalg (mock/rigtig), normalisering, logging.
- `submit-lead/` — Zod-validering, honeypot-tjek, transaktionel leadoprettelse (lead + kontakt + snapshot + tilstand + samtykker + attribution), derefter e-mails (fejl blokerer ikke leadet).
- `submit-inquiry/` — bilforespørgsler/prøvetur/finansiering.
- `send-email/` — delt e-mailadapter (Resend/Postmark/mock) + `email_logs`.
- `_shared/` — supabase-admin-klient, cors, rate-limit, zod-schemas.
