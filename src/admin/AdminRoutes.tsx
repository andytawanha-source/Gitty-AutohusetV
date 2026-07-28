import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { PageFallback } from "@/components/shared/PageFallback";
import { AdminAuthProvider, RequireAuth } from "./auth";
import { AdminLayout } from "./components/AdminLayout";

const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AdminVehiclesPage = lazy(() => import("./pages/AdminVehiclesPage"));
const AdminVehicleFormPage = lazy(() => import("./pages/AdminVehicleFormPage"));
const AdminRentalVehiclesPage = lazy(() => import("./pages/AdminRentalVehiclesPage"));
const AdminRentalVehicleFormPage = lazy(() => import("./pages/AdminRentalVehicleFormPage"));
const AdminLeadsPage = lazy(() => import("./pages/AdminLeadsPage"));
const AdminLeadDetailPage = lazy(() => import("./pages/AdminLeadDetailPage"));
const AdminInquiryDetailPage = lazy(() => import("./pages/AdminInquiryDetailPage"));
const AdminSettingsPage = lazy(() => import("./pages/AdminSettingsPage"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const AdminStatsPage = lazy(() => import("./pages/AdminStatsPage"));
const AdminAuditLogPage = lazy(() => import("./pages/AdminAuditLogPage"));

/** Adminpanel – altid noindex. Rettigheder håndhæves autoritativt af RLS i databasen. */
export default function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <Seo title="Admin" index={false} />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="login" element={<AdminLoginPage />} />
          <Route
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="biler" element={<AdminVehiclesPage />} />
            <Route path="biler/:id" element={<AdminVehicleFormPage />} />
            <Route path="lejebiler" element={<AdminRentalVehiclesPage />} />
            <Route path="lejebiler/:id" element={<AdminRentalVehicleFormPage />} />
            <Route path="leads" element={<AdminLeadsPage />} />
            <Route path="leads/salg/:id" element={<AdminLeadDetailPage />} />
            <Route path="leads/henvendelse/:id" element={<AdminInquiryDetailPage />} />
            <Route path="statistik" element={<AdminStatsPage />} />
            <Route
              path="aktivitetslog"
              element={
                <RequireAuth roles={["dealer_admin"]}>
                  <AdminAuditLogPage />
                </RequireAuth>
              }
            />
            <Route
              path="indstillinger"
              element={
                <RequireAuth roles={["dealer_admin"]}>
                  <AdminSettingsPage />
                </RequireAuth>
              }
            />
            <Route
              path="brugere"
              element={
                <RequireAuth roles={["dealer_admin"]}>
                  <AdminUsersPage />
                </RequireAuth>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </AdminAuthProvider>
  );
}
