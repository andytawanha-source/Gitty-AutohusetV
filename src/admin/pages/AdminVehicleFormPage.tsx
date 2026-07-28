import { AdminVehicleWizardPage } from "./AdminVehicleWizardPage";

/** Oprettelse/redigering af biler til salg – bruger den fælles wizard. */
export default function AdminVehicleFormPage() {
  return <AdminVehicleWizardPage listingType="sale" />;
}
