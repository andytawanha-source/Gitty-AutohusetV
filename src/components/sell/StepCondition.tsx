import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { conditionStepSchema, type ConditionStepInput } from "@/features/leads/schema";
import { FieldError, inputCls, RadioPills } from "./fields";

const JA_NEJ = [
  { value: "ja", label: "Ja" },
  { value: "nej", label: "Nej" },
];

export function StepCondition({
  defaultValues,
  onSubmit,
  onBack,
}: {
  defaultValues?: Partial<ConditionStepInput>;
  onSubmit: (data: ConditionStepInput) => void;
  onBack: () => void;
}) {
  const { control, register, handleSubmit, watch, formState } = useForm<ConditionStepInput>({
    resolver: zodResolver(conditionStepSchema),
    defaultValues,
  });

  const hasDamages = watch("hasDamages");
  const hasWarningLights = watch("hasWarningLights");
  const hasFinance = watch("hasFinance");
  const err = formState.errors;

  const pill = (name: keyof ConditionStepInput, legend: string, options = JA_NEJ) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <RadioPills
          legend={legend}
          name={name}
          options={options}
          value={field.value as string | undefined}
          onChange={field.onChange}
          error={err[name]?.message as string | undefined}
        />
      )}
    />
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-brand-primary">Bilens stand</h2>
        <p className="mt-1 text-sm text-brand-ink/70">
          Jo mere præcist du svarer, desto bedre et tilbud kan vi give dig.
        </p>
      </div>

      {pill("isDrivable", "Er bilen kørende? *")}
      {pill("hasServiceBook", "Har bilen servicebog? *", [
        { value: "ja", label: "Ja, fuld" },
        { value: "delvist", label: "Delvist" },
        { value: "nej", label: "Nej" },
      ])}

      <div>
        <label htmlFor="cd-service" className="mb-1 block text-sm font-medium">Hvornår var bilen sidst til service?</label>
        <input id="cd-service" className={inputCls} placeholder="fx marts 2026 eller ved 80.000 km" {...register("lastService")} />
      </div>

      {pill("keyCount", "Hvor mange nøgler har du? *", [
        { value: "1", label: "1" },
        { value: "2", label: "2" },
        { value: "3+", label: "3 eller flere" },
      ])}

      {pill("hasDamages", "Har bilen skader, ridser eller buler? *")}
      {hasDamages === "ja" && (
        <div className="animate-fade-up">
          <label htmlFor="cd-damages" className="mb-1 block text-sm font-medium">Beskriv skaderne</label>
          <textarea id="cd-damages" rows={3} className={inputCls}
            placeholder="fx ridse på bagkofanger, lille bule i venstre fordør…" {...register("knownDamages")} />
        </div>
      )}

      {pill("hasWarningLights", "Lyser der fejl- eller advarselslamper? *")}
      {hasWarningLights === "ja" && (
        <div className="animate-fade-up">
          <label htmlFor="cd-lights" className="mb-1 block text-sm font-medium">Hvilke lamper lyser?</label>
          <input id="cd-lights" className={inputCls} placeholder="fx motorlampe" {...register("warningLights")} />
        </div>
      )}

      <div>
        <label htmlFor="cd-mech" className="mb-1 block text-sm font-medium">Kendte mekaniske problemer</label>
        <textarea id="cd-mech" rows={2} className={inputCls} placeholder="Lad feltet stå tomt, hvis der ikke er nogen" {...register("mechanicalIssues")} />
      </div>

      {pill("tireCondition", "Dækkenes stand", [
        { value: "nye", label: "Næsten nye" },
        { value: "gode", label: "Gode" },
        { value: "slidte", label: "Slidte" },
        { value: "ved_ikke", label: "Ved ikke" },
      ])}

      {pill("interiorCondition", "Kabinens stand", [
        { value: "som_ny", label: "Som ny" },
        { value: "god", label: "God" },
        { value: "slidt", label: "Slidt" },
      ])}

      {pill("smokeFree", "Er bilen røgfri? *")}
      {pill("isImported", "Er bilen importeret?", [
        { value: "ja", label: "Ja" },
        { value: "nej", label: "Nej" },
        { value: "ved_ikke", label: "Ved ikke" },
      ])}

      {pill("hasFinance", "Er der restgæld eller finansiering i bilen? *")}
      {hasFinance === "ja" && (
        <div className="animate-fade-up">
          <label htmlFor="cd-finance" className="mb-1 block text-sm font-medium">Beskriv kort (fx restgæld ca. / leasing)</label>
          <input id="cd-finance" className={inputCls} {...register("financeDetails")} />
        </div>
      )}

      {pill("saleTimeline", "Hvornår ønsker du at sælge? *", [
        { value: "hurtigst_muligt", label: "Hurtigst muligt" },
        { value: "inden_for_en_maaned", label: "Inden for en måned" },
        { value: "undersoeger_pris", label: "Undersøger bare prisen" },
      ])}

      <div>
        <label htmlFor="cd-comment" className="mb-1 block text-sm font-medium">Andet, vi bør vide?</label>
        <textarea id="cd-comment" rows={3} className={inputCls} {...register("comment")} />
        <FieldError id="cd-comment-err" message={err.comment?.message} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-brand-ink/60 hover:text-brand-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Tilbage
        </button>
        <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-brand-gradient px-5 py-3 font-semibold text-white hover:opacity-90">
          Fortsæt <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </form>
  );
}
