import type { Vehicle } from "@/features/vehicles/types";
import type { ConditionStepInput, ManualVehicleInput } from "@/features/leads/schema";
import type { NormalizedVehicleLookupResult } from "@/features/plate-lookup/types";

/**
 * Estimat af byttebilens værdi ("Hvad er min bil værd?").
 *
 * VIGTIGT: Dette er IKKE et opslag mod en ekstern prissætnings-API (fx Bilbasen eller
 * lignende) – vi har ingen aftale om markedsdata for brugtbilpriser
 * (se docs/PLAN-06-EKSTERNE-KONTI.md). Når/hvis en sådan aftale kommer på plads,
 * er det den, der bør levere `retailEstimate` herunder i stedet for deprecieringsmodellen.
 *
 * Indtil da bruger vi de faktiske biloplysninger fra nummerpladeopslaget (motorapi:
 * mærke, model, årgang, effekt, drivmiddel) som grundlag for en generel, mærke-uafhængig
 * deprecieringsmodel (typisk værdikurve for alder + kilometertal på det danske
 * brugtbilmarked), IKKE kun vores eget – ofte spinkle – lager. Det sikrer, at en bil,
 * vi ikke selv har noget tilsvarende af på pladsen (fx en 16 år gammel bil med
 * 500.000 km), stadig lander et realistisk sted og ikke et vilkårligt højt tal.
 * Har vi samme mærke/model i eget lager, bruges det kun som en lille, begrænset
 * "sandhedstjek"-justering – aldrig som eneste grundlag.
 *
 * Det endelige, bindende bud gives altid af en sælger efter manuel gennemgang –
 * jf. disclaimeren i StepValuation.
 */

export interface ValuationInput {
  make?: string;
  model?: string;
  modelYear?: number;
  mileageKm: number;
  bodyType?: string;
  fuelType?: string;
  powerHp?: number;
  condition?: Partial<ConditionStepInput>;
}

export interface ValuationEstimate {
  low: number;
  mid: number;
  high: number;
  /** Hvor mange biler af samme mærke/model vi har i eget lager (kun brugt som lille sandhedstjek). */
  sampleSize: number;
  basis: "depreciation_model";
}

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Groft, vejledende nyprisniveau (kr.) pr. mærke for en gennemsnitlig udgave i dag –
 * bruges KUN som anker for deprecieringskurven, ikke som en påstået nypris.
 */
const BRAND_TIER_NEW_PRICE: Record<string, number> = {
  dacia: 170_000,
  chevrolet: 170_000,
  suzuki: 180_000,
  fiat: 180_000,
  citroen: 195_000,
  "citroën": 195_000,
  renault: 210_000,
  peugeot: 215_000,
  seat: 215_000,
  opel: 215_000,
  kia: 225_000,
  hyundai: 225_000,
  skoda: 230_000,
  nissan: 230_000,
  mazda: 235_000,
  honda: 240_000,
  toyota: 250_000,
  ford: 235_000,
  volkswagen: 260_000,
  mini: 270_000,
  volvo: 380_000,
  bmw: 420_000,
  audi: 420_000,
  "mercedes-benz": 430_000,
  mercedes: 430_000,
  tesla: 380_000,
  lexus: 400_000,
  jaguar: 450_000,
  "land rover": 500_000,
  porsche: 700_000,
};
const DEFAULT_NEW_PRICE = 220_000;
const REFERENCE_POWER_HP = 130;

function round(value: number, nearest = 500): number {
  return Math.max(0, Math.round(value / nearest) * nearest);
}

/** Depreciering ift. anslået nypris, som funktion af bilens alder i år. */
function depreciationFactor(ageYears: number): number {
  const FLOOR = 0.05; // en meget gammel bil er sjældent helt værdiløs (eksport/reservedele)
  if (ageYears <= 0) return 1;
  if (ageYears <= 1) return 1 - 0.22 * ageYears;
  const factor = 0.78 * Math.pow(0.88, ageYears - 1);
  return Math.max(FLOOR, factor);
}

/** Justerer for kilometertal ift. hvad der er "normalt" for bilens alder (ca. 15.000 km/år). */
function mileageAdjustment(ageYears: number, mileageKm: number): number {
  const expectedKm = Math.max(5_000, ageYears * 15_000);
  const ratio = mileageKm / expectedKm;
  if (ratio <= 1) {
    // Lavere km end forventet giver et mindre tillæg – maks. +20 %.
    return Math.min(0.2, (1 - ratio) * 0.25);
  }
  const excess = ratio - 1;
  // Jo mere kilometertallet overstiger det forventede, jo hårdere straffes værdien –
  // dette er det, der sikrer, at en bil med fx dobbelt så mange km som normalt for
  // årgangen (uanset mærke) rammer et realistisk lavt niveau.
  const penalty = Math.min(0.85, excess * 0.35 + Math.max(0, ratio - 2) * 0.3);
  return -penalty;
}

/** Procentvise tillæg/fradrag ud fra svarene i "Bilens stand". Summen clampes. */
function conditionModifier(condition?: Partial<ConditionStepInput>): number {
  if (!condition) return 0;
  let pct = 0;
  if (condition.isDrivable === "nej") pct -= 0.2;
  if (condition.hasDamages === "ja") pct -= 0.05;
  if (condition.hasWarningLights === "ja") pct -= 0.07;
  if (condition.hasServiceBook === "ja") pct += 0.02;
  if (condition.hasServiceBook === "nej") pct -= 0.03;
  if (condition.hasServiceBook === "delvist") pct -= 0.01;
  if (condition.tireCondition === "nye") pct += 0.02;
  if (condition.tireCondition === "slidte") pct -= 0.02;
  if (condition.interiorCondition === "som_ny") pct += 0.02;
  if (condition.interiorCondition === "slidt") pct -= 0.03;
  if (condition.smokeFree === "nej") pct -= 0.03;
  if (condition.keyCount === "1") pct -= 0.02;
  if (condition.hasFinance === "ja") pct -= 0.01; // ekstra administration ved indfrielse
  return Math.min(0.06, Math.max(-0.35, pct));
}

/**
 * Gennemsnitlig udsalgspris for sammenlignelige biler (samme mærke/model) i eget lager.
 * Bruges som en reel, verificeret "sandhedstjek" mod deprecieringsmodellen – ikke kun en
 * lille kosmetisk justering, da modellen kan ramme helt skævt hvis et enkelt input
 * (fx forkert/manglende km-tal eller årgang fra opslaget) er forkert.
 */
function stockComparable(input: ValuationInput, stock: Vehicle[]): { avg: number; count: number } | null {
  if (!input.make || !input.model) return null;
  const matches = stock.filter(
    (v) =>
      v.priceDkk !== null &&
      v.make.toLowerCase() === input.make!.toLowerCase() &&
      v.model.toLowerCase() === input.model!.toLowerCase()
  );
  if (matches.length === 0) return null;
  const avg = matches.reduce((sum, v) => sum + (v.priceDkk ?? 0), 0) / matches.length;
  return { avg, count: matches.length };
}

export function estimateTradeInValue(input: ValuationInput, stock: Vehicle[]): ValuationEstimate {
  const ageYears = Math.max(0, CURRENT_YEAR - (input.modelYear ?? CURRENT_YEAR - 5));

  const brandKey = (input.make ?? "").toLowerCase().trim();
  let anchorNewPrice = BRAND_TIER_NEW_PRICE[brandKey] ?? DEFAULT_NEW_PRICE;

  if (input.powerHp) {
    const powerDeltaPct = ((input.powerHp - REFERENCE_POWER_HP) / REFERENCE_POWER_HP) * 0.4;
    anchorNewPrice *= 1 + Math.min(0.6, Math.max(-0.4, powerDeltaPct));
  }
  if (input.fuelType === "el") anchorNewPrice *= 1.08;

  let modelRetail = anchorNewPrice * depreciationFactor(ageYears);
  modelRetail *= 1 + mileageAdjustment(ageYears, input.mileageKm);
  modelRetail = Math.max(3_000, modelRetail);

  // Har vi sammenlignelige biler på egen plads, vægtes udsalgsprisen for DEM tungt ind i
  // det endelige skøn – jo flere sammenlignelige biler, jo mere vægt. Det sikrer at et
  // forkert/manglende enkeltinput til deprecieringskurven (fx en forkert km-værdi fra
  // nummerpladeopslaget) ikke kan resultere i et absurd lavt "skambud", som får kunden
  // til at føle sig taget useriøst og aldrig svare tilbage. Derudover et hårdt gulv:
  // det samlede skøn må aldrig havne under 40 % af hvad sammenlignelige biler rent
  // faktisk sælges for hos os.
  const comparable = stockComparable(input, stock);
  let retailEstimate = modelRetail;
  let sampleSize = 0;
  if (comparable) {
    sampleSize = comparable.count;
    const stockWeight = comparable.count >= 3 ? 0.75 : comparable.count === 2 ? 0.65 : 0.55;
    retailEstimate = modelRetail * (1 - stockWeight) + comparable.avg * stockWeight;
    retailEstimate = Math.max(retailEstimate, comparable.avg * 0.4);
  }
  retailEstimate = Math.max(3_000, retailEstimate);

  // Byttepris/indbytningspris ligger under udsalgsprisen (klargøring, avance, risiko).
  const TRADE_IN_FACTOR = 0.72;
  let tradeInMid = retailEstimate * TRADE_IN_FACTOR;
  tradeInMid *= 1 + conditionModifier(input.condition);
  tradeInMid = Math.max(1_500, tradeInMid);

  // Bredere spænd når vi IKKE har sammenlignelige biler at holde skønnet op imod (lavere
  // sikkerhed i tallet) – smallere spænd når vi har mindst én reel, verificeret sammenligning.
  const spread = sampleSize > 0 ? 0.15 : 0.22;

  return {
    low: round(tradeInMid * (1 - spread)),
    mid: round(tradeInMid),
    high: round(tradeInMid * (1 + spread)),
    sampleSize,
    basis: "depreciation_model",
  };
}

/** Slår vurderingsgrundlaget (mærke/model/årgang/effekt/drivmiddel) op fra enten API-opslag eller manuel indtastning. */
export function valuationInputFromLookup(
  lookup: NormalizedVehicleLookupResult | null | undefined,
  manual: ManualVehicleInput | undefined,
  mileageKm: number,
  condition?: Partial<ConditionStepInput>
): ValuationInput {
  if (lookup) {
    return {
      make: lookup.make,
      model: lookup.model,
      modelYear: lookup.modelYear,
      bodyType: lookup.bodyType,
      fuelType: lookup.fuelType,
      powerHp: lookup.powerHp,
      mileageKm,
      condition,
    };
  }
  return {
    make: manual?.make,
    model: manual?.model,
    modelYear: manual?.modelYear,
    fuelType: manual?.fuelType,
    mileageKm,
    condition,
  };
}
