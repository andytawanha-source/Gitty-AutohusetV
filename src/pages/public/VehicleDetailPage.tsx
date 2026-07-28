import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Phone } from "lucide-react";
import { Seo } from "@/components/seo/Seo";
import { useVehicle, registerVehicleView } from "@/features/vehicles/api";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/features/vehicles/types";
import { VehicleGallery } from "@/components/vehicles/VehicleGallery";
import { VehicleBadge } from "@/components/vehicles/VehicleBadge";
import { FavoriteButton } from "@/components/vehicles/FavoriteButton";
import { VehicleInquiryForm } from "@/components/vehicles/VehicleInquiryForm";
import { RelatedVehicles } from "@/components/vehicles/RelatedVehicles";
import { formatDate, formatMileage, formatMonthlyPrice, formatNumber, formatPrice } from "@/lib/format";
import { useBrand } from "@/app/BrandProvider";
import { track } from "@/features/tracking/track";
import NotFoundPage from "@/pages/NotFoundPage";

function SpecRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-brand-ink/5 py-2 text-sm">
      <dt className="text-brand-ink/60">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export default function VehicleDetailPage() {
  const { slug } = useParams();
  const { vehicle, isLoading } = useVehicle(slug);
  const brand = useBrand();
  const viewTracked = useRef<string | null>(null);

  useEffect(() => {
    if (vehicle && viewTracked.current !== vehicle.id) {
      viewTracked.current = vehicle.id;
      registerVehicleView(vehicle.id);
      track("view_vehicle", { vehicle_id: vehicle.id, make: vehicle.make, model: vehicle.model });
    }
  }, [vehicle]);

  if (isLoading) {
    return (
      <div className="container grid gap-8 py-8 lg:grid-cols-[1fr_400px]" aria-busy>
        <div className="skeleton aspect-[8/5]" />
        <div className="space-y-4">
          <div className="skeleton h-8 w-3/4" />
          <div className="skeleton h-10 w-1/2" />
          <div className="skeleton h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!vehicle) return <NotFoundPage />;

  const title = [vehicle.make, vehicle.model, vehicle.variant].filter(Boolean).join(" ");
  const isSold = vehicle.status === "sold";
  const primaryImage = vehicle.images[0]?.url;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: title,
    brand: { "@type": "Brand", name: vehicle.make },
    model: vehicle.model,
    vehicleModelDate: vehicle.modelYear ?? undefined,
    mileageFromOdometer: vehicle.mileageKm
      ? { "@type": "QuantitativeValue", value: vehicle.mileageKm, unitCode: "KMT" }
      : undefined,
    fuelType: vehicle.fuelType ? FUEL_LABELS[vehicle.fuelType] : undefined,
    color: vehicle.color ?? undefined,
    offers:
      vehicle.priceDkk && !isSold
        ? {
            "@type": "Offer",
            price: vehicle.priceDkk,
            priceCurrency: "DKK",
            availability:
              vehicle.status === "reserved"
                ? "https://schema.org/LimitedAvailability"
                : "https://schema.org/InStock",
            seller: { "@type": "AutoDealer", name: brand.name },
          }
        : undefined,
  };

  return (
    <>
      <Seo
        title={vehicle.seoTitle ?? title}
        description={
          vehicle.seoDescription ??
          `${title}${vehicle.modelYear ? `, ${vehicle.modelYear}` : ""}${vehicle.mileageKm ? `, ${formatMileage(vehicle.mileageKm)}` : ""}. Se billeder, udstyr og pris hos ${brand.name}.`
        }
        image={primaryImage}
        jsonLd={jsonLd}
      />

      <nav aria-label="Brødkrumme" className="container pt-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-brand-ink/60">
          <li><Link to="/" className="hover:text-brand-primary hover:underline">Forside</Link></li>
          <li aria-hidden>/</li>
          <li><Link to="/biler" className="hover:text-brand-primary hover:underline">Biler til salg</Link></li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="font-medium text-brand-ink">{title}</li>
        </ol>
      </nav>

      <div className="container grid gap-10 py-6 lg:grid-cols-[1fr_400px] lg:py-8">
        <div>
          <VehicleGallery images={vehicle.images} title={title} />

          <section className="mt-8" aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="font-display text-xl font-bold text-brand-primary">Specifikationer</h2>
            <dl className="mt-3 grid gap-x-10 sm:grid-cols-2">
              <SpecRow label="Modelår" value={vehicle.modelYear ? String(vehicle.modelYear) : null} />
              <SpecRow label="1. registrering" value={vehicle.firstRegistration ? formatDate(vehicle.firstRegistration) : null} />
              <SpecRow label="Kilometer" value={vehicle.mileageKm !== null ? formatMileage(vehicle.mileageKm) : null} />
              <SpecRow label="Drivmiddel" value={vehicle.fuelType ? FUEL_LABELS[vehicle.fuelType] : null} />
              <SpecRow label="Gearkasse" value={vehicle.transmission ? TRANSMISSION_LABELS[vehicle.transmission] : null} />
              <SpecRow label="Biltype" value={vehicle.bodyType} />
              <SpecRow label="Farve" value={vehicle.color} />
              <SpecRow label="Døre" value={vehicle.doors ? String(vehicle.doors) : null} />
              <SpecRow label="Effekt" value={vehicle.powerHp ? `${vehicle.powerHp} hk` : null} />
              <SpecRow label="Motor" value={vehicle.engine} />
              <SpecRow label="Batteri" value={vehicle.batteryKwh ? `${vehicle.batteryKwh} kWh` : null} />
              <SpecRow label="Rækkevidde (WLTP)" value={vehicle.rangeKm ? `${formatNumber(vehicle.rangeKm)} km` : null} />
              <SpecRow label="Forbrug" value={vehicle.consumption} />
              <SpecRow label="Halvårlig afgift" value={vehicle.taxPeriodDkk ? formatPrice(vehicle.taxPeriodDkk) : null} />
              <SpecRow label="Reg.nr." value={vehicle.showRegistrationNumber ? vehicle.registrationNumber : null} />
            </dl>
          </section>

          {vehicle.equipment.length > 0 && (
            <section className="mt-8" aria-labelledby="equipment-heading">
              <h2 id="equipment-heading" className="font-display text-xl font-bold text-brand-primary">Udstyr</h2>
              <ul className="mt-3 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2" role="list">
                {vehicle.equipment.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {vehicle.description && (
            <section className="mt-8" aria-labelledby="desc-heading">
              <h2 id="desc-heading" className="font-display text-xl font-bold text-brand-primary">Beskrivelse</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-brand-ink/80">{vehicle.description}</p>
            </section>
          )}
        </div>

        <aside>
          <div className="sticky top-24 space-y-5">
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-brand-ink/5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {isSold && <VehicleBadge label="Solgt" />}
                  {vehicle.status === "reserved" && <VehicleBadge label="Reserveret" />}
                  {!isSold && vehicle.status !== "reserved" && vehicle.badges.map((b) => <VehicleBadge key={b} label={b} />)}
                </div>
                <FavoriteButton vehicleId={vehicle.id} />
              </div>

              <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-brand-ink">{title}</h1>

              {vehicle.priceDkk !== null && (
                <p className="mt-4 font-display text-3xl font-bold text-brand-primary">
                  {isSold ? "Solgt" : formatPrice(vehicle.priceDkk)}
                </p>
              )}
              {!isSold && vehicle.monthlyPriceDkk !== null && (
                <p className="mt-1 text-sm text-brand-ink/60">
                  Finansiering fra {formatMonthlyPrice(vehicle.monthlyPriceDkk)}*
                </p>
              )}
              {!isSold && vehicle.monthlyPriceDkk !== null && (
                <p className="mt-2 text-xs text-brand-ink/50">
                  *Vejledende eksempel. Endeligt finansieringstilbud afhænger af kreditgodkendelse.{" "}
                  <Link to="/finansieringsforbehold" className="underline">Se forbehold</Link>.
                </p>
              )}

              <a
                href={`tel:${brand.contact.phone}`}
                data-track="click_phone"
                onClick={() => track("click_phone", { vehicle_id: vehicle.id })}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-md border border-brand-primary px-5 py-3 font-semibold text-brand-primary transition-colors hover:bg-brand-gradient hover:text-white"
              >
                <Phone className="h-4 w-4" aria-hidden /> Ring {brand.contact.phone}
              </a>
            </div>

            {!isSold && (
              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-brand-ink/5">
                <h2 className="mb-4 font-display text-lg font-bold text-brand-primary">Send en forespørgsel</h2>
                <VehicleInquiryForm vehicle={vehicle} />
              </div>
            )}
          </div>
        </aside>
      </div>

      <RelatedVehicles current={vehicle} />

      {/* Sticky CTA på mobil */}
      {!isSold && (
        <div className="sticky bottom-0 z-40 border-t border-brand-ink/10 bg-white/95 p-3 backdrop-blur lg:hidden">
          <div className="container flex items-center justify-between gap-3 px-0">
            <p className="font-display text-lg font-bold text-brand-primary">
              {vehicle.priceDkk !== null && formatPrice(vehicle.priceDkk)}
            </p>
            <a href="#forespoergsel" className="rounded-md bg-white ring-1 ring-brand-primary/20 shadow-sm px-5 py-2.5 font-semibold text-brand-primary">
              Send forespørgsel
            </a>
          </div>
        </div>
      )}
    </>
  );
}
