/**
 * Deterministic Rule Engine — rules.ts
 *
 * The ONLY source of clinical flags in the app.
 * No AI involved. Pure function. Fully unit-tested.
 *
 * Safety contract:
 *  - Unknown medicine, unclear symptoms, missing info → ASK_DOCTOR_TODAY
 *  - Red-flag symptoms → GO_TO_HEALTH_FACILITY_NOW
 *  - Wording: "Ask the doctor today about: <medicine>"
 *  - Safety disclaimer always present in output
 */

import type {
  CheckInput,
  CheckResult,
  FlagAction,
  IllnessSymptom,
  PerMedicineResult,
  DrugClass,
} from "./schemas";
import RULES from "./ruleTable";
import { BRANDS_DICT } from "./brands";

// ─── Constants ────────────────────────────────────────────────────────────────

export const SAFETY_DISCLAIMER =
  "Decision-support aid. Not a medical device. Do not change any medicine without a doctor." as const;

const RED_FLAG_SYMPTOMS = {
  noUrine: "urinePastEightHours",
  dizziness: "dizziness",
  confusion: "confusion",
  bloodInStool: "bloodInStool",
  chestPain: "chestPain",
  cannotKeepFluids: "cannotKeepFluids",
} as const;

// Priority order for urgency escalation
const URGENCY_PRIORITY: Record<FlagAction, number> = {
  GO_TO_HEALTH_FACILITY_NOW: 3,
  ASK_DOCTOR_TODAY: 2,
  INFO: 1,
  NO_FLAG: 0,
};

function maxUrgency(a: FlagAction, b: FlagAction): FlagAction {
  return URGENCY_PRIORITY[a] >= URGENCY_PRIORITY[b] ? a : b;
}

// ─── Red-flag detection ───────────────────────────────────────────────────────

function detectRedFlags(input: CheckInput): string[] {
  const s = input.symptoms;
  const flags: string[] = [];

  if (s.urinePastEightHours.value === false) {
    flags.push("no_urine_8h");
  }
  if (s.dizziness.value === true) {
    flags.push("dizziness_or_fainting");
  }
  if (s.confusion.value === true) {
    flags.push("confusion");
  }
  if (s.bloodInStool.value === true) {
    flags.push("blood_in_stool");
  }
  if (s.chestPain.value === true) {
    flags.push("chest_pain");
  }
  if (s.cannotKeepFluids.value === true) {
    flags.push("cannot_keep_fluids");
  }

  return flags;
}

// ─── Per-medicine evaluation ──────────────────────────────────────────────────

function evaluateMedicine(
  brand: string,
  input: CheckInput,
  activeSymptoms: IllnessSymptom[],
  isRedFlag: boolean,
): PerMedicineResult {
  const entry = BRANDS_DICT[brand.toLowerCase().trim()];
  const classes: DrugClass[] = entry ? entry.classes : ["unknown"];
  const brandStatus = entry
    ? entry.signedOff
      ? "verified"
      : "unsigned"
    : "unknown";

  // Unknown medicine during any illness → always ASK_DOCTOR_TODAY
  if (classes.includes("unknown") || !entry) {
    return {
      brand,
      classes: ["unknown"],
      brandStatus: "unknown",
      flag: "ASK_DOCTOR_TODAY",
      ruleHits: [
        {
          ruleId: "UK-001",
          ruleText: RULES.find((r) => r.id === "UK-001")?.text ?? {
            bn: "অজানা ওষুধ",
            hi: "अज्ञात दवा",
            en: "Unknown medicine",
          },
          signedOff: false,
        },
      ],
    };
  }

  // Red flag: GO_TO_HEALTH_FACILITY_NOW overrides everything
  if (isRedFlag) {
    return {
      brand,
      classes,
      brandStatus,
      flag: "GO_TO_HEALTH_FACILITY_NOW",
      ruleHits: [],
    };
  }

  // Evaluate applicable rules
  let flag: FlagAction = "NO_FLAG";
  const ruleHits: PerMedicineResult["ruleHits"] = [];

  for (const rule of RULES) {
    // Skip red-flag rules (handled above)
    if (
      rule.id.startsWith("RF-") &&
      (rule.action === "GO_TO_HEALTH_FACILITY_NOW")
    ) {
      continue;
    }

    // Check if rule applies to any of the medicine's classes
    const classMatch = classes.some((c) => rule.appliesToClasses.includes(c));
    if (!classMatch) continue;

    // Check illness symptom overlap
    const illnessMatch =
      rule.whenIllness.length === 0 ||
      rule.whenIllness.some((s) => activeSymptoms.includes(s));
    if (!illnessMatch) continue;

    // Check heatwave condition
    if (rule.whenHeat === true && !input.isHeatDay) continue;

    // Check extra conditions
    if (rule.whenExtra) {
      if (
        rule.whenExtra.kidneyDisease === true &&
        !input.patient.kidneyDisease
      )
        continue;
      if (rule.whenExtra.pregnant === true && !input.patient.pregnant) continue;
      if (rule.whenExtra.ageElderly === true && input.patient.ageBand !== "elderly")
        continue;
      if (rule.whenExtra.child === true && input.patient.ageBand !== "child")
        continue;
    }

    // Rule matches
    flag = maxUrgency(flag, rule.action);
    ruleHits.push({
      ruleId: rule.id,
      ruleText: rule.text,
      signedOff: rule.signedOff,
    });
  }

  return { brand, classes, brandStatus, flag, ruleHits };
}

// ─── Main evaluate function ───────────────────────────────────────────────────

export function evaluate(input: CheckInput): CheckResult {
  const warnings: string[] = [];

  // Collect active symptoms
  const activeSymptoms: IllnessSymptom[] = input.symptoms.symptoms.value;

  // Detect red flags
  const redFlagKeys = detectRedFlags(input);
  const isRedFlag = redFlagKeys.length > 0;

  if (isRedFlag) {
    warnings.push(...redFlagKeys.map((k) => `RED_FLAG:${k}`));
  }

  // Pregnancy or child → always urgent
  if (input.patient.pregnant && activeSymptoms.length > 0) {
    warnings.push("RED_FLAG:pregnant_with_illness");
  }
  if (input.patient.ageBand === "child") {
    warnings.push("RED_FLAG:child_patient");
  }

  const overallIsRedFlag =
    isRedFlag ||
    (input.patient.pregnant && activeSymptoms.length > 0) ||
    input.patient.ageBand === "child";

  // Low-confidence fields → warn
  const s = input.symptoms;
  const lowConfidenceFields: string[] = [];
  if (s.symptoms.confidence < 0.7) lowConfidenceFields.push("symptoms");
  if (s.urinePastEightHours.value !== null && s.urinePastEightHours.confidence < 0.7)
    lowConfidenceFields.push("urine_status");
  if (s.dizziness.value !== null && s.dizziness.confidence < 0.7)
    lowConfidenceFields.push("dizziness");
  if (lowConfidenceFields.length > 0) {
    warnings.push(`LOW_CONFIDENCE:${lowConfidenceFields.join(",")}`);
  }

  // Evaluate each medicine
  const perMedicine: PerMedicineResult[] = input.brands.map((brand) =>
    evaluateMedicine(brand, input, activeSymptoms, overallIsRedFlag)
  );

  // Empty medicine list → warn
  if (input.brands.length === 0) {
    warnings.push("NO_MEDICINES_LISTED");
  }

  // Compute overall urgency
  let urgency: FlagAction = "NO_FLAG";
  if (overallIsRedFlag) {
    urgency = "GO_TO_HEALTH_FACILITY_NOW";
  } else {
    for (const m of perMedicine) {
      urgency = maxUrgency(urgency, m.flag);
    }
  }

  return {
    urgency,
    perMedicine,
    warnings,
    safetyDisclaimer: SAFETY_DISCLAIMER,
  };
}

// ─── Utility exports ──────────────────────────────────────────────────────────

export { RULES };
export { URGENCY_PRIORITY };
export { maxUrgency };
