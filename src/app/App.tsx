import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { captureAttribution } from "@/lib/attribution";
import { track } from "@/features/tracking/track";
import { ConsentProvider } from "@/features/consent/ConsentProvider";
import { CookieBanner, CookiePreferencesDialog } from "@/features/consent/CookieBanner";
import { BrandProvider } from "./BrandProvider";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageFallback } from "@/components/shared/PageFallback";

const HomePage = lazy(() => import("@/pages/public/HomePage"));
const VehicleListPage = lazy(() => import("@/pages/public/VehicleListPage"));
const VehicleDetailPage = lazy(() => import("@/pages/public/VehicleDetailPage"));
const SoldVehiclesPage = lazy(() => import("@/pages/public/SoldVehiclesPage"));
const SellCarPage = lazy(() => import("@/pages/public/SellCarPage"));
const SellCarThanksPage = lazy(() => import("@/pages/public/SellCarThanksPage"));
const GarantiPage = lazy(() => import("@/pages/public/GarantiPage"));
const WorkshopPage = lazy(() => import("@/pages/public/WorkshopPage"));
const RentalPage = lazy(() => import("@/pages/public/RentalPage"));
const RentalCarDetailPage = lazy(() => import("@/pages/public/RentalCarDetailPage"));
const AboutPage = lazy(() => import("@/pages/public/AboutPage"));
const ContactPage = lazy(() => import("@/pages/public/ContactPage"));
const FavoritesPage = lazy(() => import("@/pages/public/FavoritesPage"));
const LegalPage = lazy(() => import("@/pages/legal/LegalPage"));
const CookieSettingsPage = lazy(() => import("@/pages/legal/CookieSettingsPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const AdminRoutes = lazy(() => import("@/admin/AdminRoutes"));

/** Attribution (first touch), page_view-tracking og scroll-til-top ved rutenavigation. */
function RouteEffects() {
  const location = useLocation();
  useEffect(() => {
    captureAttribution();
  }, []);
  useEffect(() => {
    track("page_view", { path: location.pathname });
    window.scrollTo({ top: 0 });
  }, [location.pathname]);
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

export function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrandProvider>
          <ConsentProvider>
            <BrowserRouter>
              <RouteEffects />
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/biler" element={<VehicleListPage />} />
                    <Route path="/biler/:slug" element={<VehicleDetailPage />} />
                    <Route path="/solgte-biler" element={<SoldVehiclesPage />} />
                    <Route path="/saelg-din-bil" element={<SellCarPage />} />
                    <Route path="/saelg-din-bil/tak/:reference" element={<SellCarThanksPage />} />
                    <Route path="/garanti" element={<GarantiPage />} />
                    <Route path="/biludlejning" element={<RentalPage />} />
                    <Route path="/biludlejning/:slug" element={<RentalCarDetailPage />} />
                    <Route path="/om-os" element={<AboutPage />} />
                    <Route path="/kontakt" element={<ContactPage />} />
                    <Route path="/favoritter" element={<FavoritesPage />} />
                    <Route path="/vaerksted" element={<WorkshopPage />} />
                    <Route path="/cookieindstillinger" element={<CookieSettingsPage />} />
                    <Route path="/:legalSlug" element={<LegalPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                  <Route path="/admin/*" element={<AdminRoutes />} />
                </Routes>
              </Suspense>
              <CookieBanner />
              <CookiePreferencesDialog />
            </BrowserRouter>
          </ConsentProvider>
        </BrandProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
