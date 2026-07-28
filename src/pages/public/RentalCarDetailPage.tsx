import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Fuel, MessageSquare, Settings2, Users } from "lucide-react";
import { Seo } from "@/components/seo/Seo";
import { useBrand } from "@/app/BrandProvider";
import { useRentalVehicle } from "@/features/vehicles/api";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/features/vehicles/types";
import { ContactForm } from "@/components/shared/ContactForm";

const ONE2MOVE_URL = "https://one2movebiludlejning.dk/";

export default function RentalCarDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const brand = useBrand();
  const { vehicle: car, isLoading } = useRentalVehicle(slug);

  if (isLoading) return <div className="container py-14 text-center text-sm text-brand-ink/50">Henter bil …</div>;
  if (!car) return <Navigate to="/biludlejning" replace />;

  const name = `${car.make} ${car.model}`;

  return (
    <div className="container py-10 lg:py-14">
      <Seo
        title={name}
        description={`${name} – ${car.bodyType ?? "lejebil"}. Lej hos ${brand.name} gennem One2move Biludlejning.`}
      />
      <Link to="/biludlejning" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Tilbage til biludlejning
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-brand-ink/5">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-accent">{car.bodyType}</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-brand-primary lg:text-3xl">{name}</h1>
          {car.description && <p className="mt-4 leading-relaxed text-brand-ink/70">{car.description}</p>}

          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {car.seats && (
              <li className="flex items-center gap-2 text-sm text-brand-ink/70">
                <Users className="h-4 w-4 text-brand-accent" aria-hidden /> {car.seats} personer
              </li>
            )}
            {car.transmission && (
              <li className="flex items-center gap-2 text-sm text-brand-ink/70">
                <Settings2 className="h-4 w-4 text-brand-accent" aria-hidden /> {TRANSMISSION_LABELS[car.transmission]}
              </li>
            )}
            {car.fuelType && (
              <li className="flex items-center gap-2 text-sm text-brand-ink/70">
                <Fuel className="h-4 w-4 text-brand-accent" aria-hidden /> {FUEL_LABELS[car.fuelType]}
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-6">
        <div className="rounded-xl bg-brand-surface-warm/60 p-6 text-center">
          <p className="font-display text-3xl font-bold text-brand-primary">
            {car.rentalDetails?.pricePerDayDkk != null
              ? `Fra ${car.rentalDetails.pricePerDayDkk.toLocaleString("da-DK")} kr./dag`
              : "Pris hos One2move"}
          </p>
          <p className="mt-1 text-sm text-brand-ink/60">Vejledende pris – se opdaterede priser og ledighed hos One2move</p>
          <a
            href={ONE2MOVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-5 py-3 font-semibold text-white hover:opacity-90"
          >
            Book hos One2move
          </a>
          <p className="mt-4 text-xs text-brand-ink/50">
            Booking, udlevering og aflevering foregår hos vores samarbejdspartner{" "}
            <a href={ONE2MOVE_URL} target="_blank" rel="noopener noreferrer" className="underline">
              One2move Biludlejning
            </a>
            .
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-brand-ink/5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-brand-primary">
            <MessageSquare className="h-5 w-5 text-brand-accent" aria-hidden /> Spørgsmål om udlejning?
          </h2>
          <p className="mt-1 text-sm text-brand-ink/60">
            Skriv til os, hvis du har spørgsmål inden booking – vi videreformidler gerne kontakten til One2move.
          </p>
          <div className="mt-4">
            <ContactForm inquiryType="rental" defaultMessage={`Jeg er interesseret i at leje: ${name}`} />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
