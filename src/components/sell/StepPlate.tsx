import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { plateStepSchema, type PlateStepInput } from "@/features/leads/schema";
import { FieldError, inputCls } from "./fields";

export function StepPlate({
  defaultValues,
  isLookingUp,
  lookupError,
  onSubmit,
}: {
  defaultValues?: Partial<PlateStepInput>;
  isLookingUp: boolean;
  lookupError: string | null;
  onSubmit: (data: PlateStepInput) => void;
}) {
  const { register, handleSubmit, formState } = useForm<PlateStepInput>({
    resolver: zodResolver(plateStepSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-brand-primary">Fortæl os om din bil</h2>
        <p className="mt-1 text-sm text-brand-ink/70">
          Indtast din nummerplade, så henter vi bilens oplysninger automatisk.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sp-plate" className="mb-1 block text-sm font-medium">Nummerplade *</label>
          <input
            id="sp-plate"
            autoComplete="off"
            maxLength={9}
            placeholder="AB 12 345"
            className="w-full rounded-md border-2 border-brand-accent/60 bg-white px-3 py-3 text-center font-display text-xl font-bold uppercase tracking-widest placeholder:text-brand-ink/30"
            aria-invalid={!!formState.errors.registrationNumber}
            aria-describedby={formState.errors.registrationNumber ? "sp-plate-err" : undefined}
            {...register("registrationNumber")}
          />
          <FieldError id="sp-plate-err" message={formState.errors.registrationNumber?.message} />
        </div>
        <div>
          <label htmlFor="sp-km" className="mb-1 block text-sm font-medium">Kilometerstand *</label>
          <input
            id="sp-km"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="fx 85.000"
            className={inputCls + " py-3"}
            aria-invalid={!!formState.errors.mileageKm}
            aria-describedby={formState.errors.mileageKm ? "sp-km-err" : undefined}
            {...register("mileageKm")}
          />
          <FieldError id="sp-km-err" message={formState.errors.mileageKm?.message} />
        </div>
      </div>

      {lookupError && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900" role="alert">
          {lookupError}
        </p>
      )}

      <button
        type="submit"
        disabled={isLookingUp}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-gradient px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
      >
        {isLookingUp ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Henter biloplysninger…
          </>
        ) : (
          <>
            Find min bil <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>
      <p className="text-xs text-brand-ink/50">
        Gratis og uforpligtende. Vi henter kun oplysninger om køretøjet – aldrig om ejeren.
      </p>
    </form>
  );
}
