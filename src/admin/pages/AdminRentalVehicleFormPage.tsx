import { AdminVehicleWizardPage } from "./AdminVehicleWizardPage";

/** Oprettelse/redigering af lejebiler – bruger den fælles wizard. */
export default function AdminRentalVehicleFormPage() {
  return <AdminVehicleWizardPage listingType="rental" />;
}
