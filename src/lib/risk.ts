/**
 * Risk Scoring — risk.ts
 *
 * ⚠️  Weights are PLACEHOLDER values. No epidemiological data.
 *     signedOff: false. Clinical review required before deployment.
 *
 * Transparent points-based scoring for heatwave caseload prioritisation.
 * Returns a score breakdown per patient.
 */

import type { Patient, RiskScore } from "./schemas";
import { BRANDS_DICT } from "./brands";
import type { DrugClass } from "./schemas";

// ─── Weight Table ─────────────────────────────────────────────────────────────
// All weights are unsigned placeholders.

export const RISK_WEIGHTS = {
  signedOff: false,
  source: "PLACEHOLDER - TO BE VERIFIED by clinician/epidemiologist",
  weights: {
    ageBand: {
      elderly: 3,
      adult: 1,
      child: 2,
    },
    kidneyDisease: 3,
    livesAlone: 2,
    worksOutdoors: 2,
    perFlaggedMedicineClass: 2,
    recentIllness: 3,
    pregnant: 2,
  },
  heatDayThresholdCelsius: 41, // Heat index threshold (unsigned placeholder)
} as const;

// Drug classes that incur points during heatwave
const FLAGGED_ON_HEATWAVE: DrugClass[] = [
  "ace_inhibitor",
  "arb",
  "diuretic_loop",
  "diuretic_thiazide",
  "sglt2_inhibitor",
  "metformin",
  "unknown",
];

// ─── Score calculator ─────────────────────────────────────────────────────────

export interface RiskInput {
  patient: Patient;
  hasRecentIllness?: boolean;
}

export function computeRiskScore(input: RiskInput): RiskScore {
  const { patient, hasRecentIllness = false } = input;
  const breakdown: RiskScore["breakdown"] = [];

  // Age band
  const agePts = RISK_WEIGHTS.weights.ageBand[patient.ageBand];
  breakdown.push({
    factor: "age_band",
    points: agePts,
    description: `Age band: ${patient.ageBand} (${agePts} pts — placeholder weight)`,
  });

  // Kidney disease
  if (patient.kidneyDisease || patient.knownKidneyDisease) {
    breakdown.push({
      factor: "kidney_disease",
      points: RISK_WEIGHTS.weights.kidneyDisease,
      description: `Known kidney disease (+${RISK_WEIGHTS.weights.kidneyDisease} pts — placeholder weight)`,
    });
  }

  // Lives alone
  if (patient.livesAlone) {
    breakdown.push({
      factor: "lives_alone",
      points: RISK_WEIGHTS.weights.livesAlone,
      description: `Lives alone (+${RISK_WEIGHTS.weights.livesAlone} pts — placeholder weight)`,
    });
  }

  // Works outdoors
  if (patient.worksOutdoors) {
    breakdown.push({
      factor: "works_outdoors",
      points: RISK_WEIGHTS.weights.worksOutdoors,
      description: `Works outdoors (+${RISK_WEIGHTS.weights.worksOutdoors} pts — placeholder weight)`,
    });
  }

  // Pregnant
  if (patient.pregnant) {
    breakdown.push({
      factor: "pregnant",
      points: RISK_WEIGHTS.weights.pregnant,
      description: `Pregnant (+${RISK_WEIGHTS.weights.pregnant} pts — placeholder weight)`,
    });
  }

  // Recent illness
  if (hasRecentIllness) {
    breakdown.push({
      factor: "recent_illness",
      points: RISK_WEIGHTS.weights.recentIllness,
      description: `Recent illness recorded (+${RISK_WEIGHTS.weights.recentIllness} pts — placeholder weight)`,
    });
  }

  // Flagged medicine classes
  const flaggedClassesFound = new Set<DrugClass>();
  const meds = patient.chronicMedicines
    ? patient.chronicMedicines.map((m) => m.brand)
    : patient.medicines || [];
  for (const brand of meds) {
    const entry = BRANDS_DICT[brand.toLowerCase().trim()];
    if (!entry) {
      flaggedClassesFound.add("unknown");
      continue;
    }
    for (const cls of entry.classes) {
      if (FLAGGED_ON_HEATWAVE.includes(cls)) {
        flaggedClassesFound.add(cls);
      }
    }
  }
  if (flaggedClassesFound.size > 0) {
    const pts = flaggedClassesFound.size * RISK_WEIGHTS.weights.perFlaggedMedicineClass;
    breakdown.push({
      factor: "flagged_medicine_classes",
      points: pts,
      description: `${flaggedClassesFound.size} flagged medicine class(es) during heat: ${[...flaggedClassesFound].join(", ")} (+${pts} pts — placeholder weight)`,
    });
  }

  const totalScore = breakdown.reduce((sum, b) => sum + b.points, 0);
  const level: "low" | "medium" | "high" =
    totalScore >= 6 ? "high" : totalScore >= 3 ? "medium" : "low";

  return {
    token: patient.token,
    totalScore,
    level,
    breakdown,
  };
}

// ─── Rank a list of patients ──────────────────────────────────────────────────

export function rankPatients(
  patients: { patient: Patient; hasRecentIllness?: boolean }[]
): Array<RiskScore & { patient: Patient }> {
  return patients
    .map(({ patient, hasRecentIllness }) => ({
      ...computeRiskScore({ patient, hasRecentIllness }),
      patient,
    }))
    .sort((a, b) => b.totalScore - a.totalScore);
}

// ─── Compute heat index (NOAA Rothfusz equation, unsigned placeholder) ────────

export function computeHeatIndex(
  tempCelsius: number,
  relativeHumidityPercent: number
): number {
  const T = tempCelsius * 9/5 + 32; // Convert to Fahrenheit
  const RH = relativeHumidityPercent;

  // Simplified Steadman formula for low temps
  if (T < 80) {
    const hiF = 0.5 * (T + 61 + (T - 68) * 1.2 + RH * 0.094);
    return (hiF - 32) * 5/9;
  }

  // Full Rothfusz regression equation
  let hiF =
    -42.379 +
    2.04901523 * T +
    10.14333127 * RH -
    0.22475541 * T * RH -
    0.00683783 * T * T -
    0.05481717 * RH * RH +
    0.00122874 * T * T * RH +
    0.00085282 * T * RH * RH -
    0.00000199 * T * T * RH * RH;

  // Adjustment for low humidity
  if (RH < 13 && T >= 80 && T <= 112) {
    hiF -= ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
  }
  // Adjustment for high humidity
  if (RH > 85 && T >= 80 && T <= 87) {
    hiF += ((RH - 85) / 10) * ((87 - T) / 5);
  }

  return (hiF - 32) * 5/9;
}

export function isHeatDay(
  tempCelsius: number,
  relativeHumidityPercent: number
): boolean {
  const hi = computeHeatIndex(tempCelsius, relativeHumidityPercent);
  return hi >= RISK_WEIGHTS.heatDayThresholdCelsius;
}
