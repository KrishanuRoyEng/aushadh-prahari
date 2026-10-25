/**
 * seed.ts — Synthetic Demo Data
 *
 * ⚠️  ALL DATA IS SYNTHETIC. Not real patients. Not real checks.
 * Rendered with a "SYNTHETIC DEMO DATA" banner everywhere it appears.
 *
 * Generated deterministically from a seed so charts are consistent.
 */

import type { CheckRecord } from "./db";
import type { Patient, CheckInput, CheckResult, ParsedSymptoms } from "./schemas";
import { evaluate } from "./rules";

// ─── Deterministic pseudo-random ─────────────────────────────────────────────

function seededRand(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const rand = seededRand(42);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

// ─── Fictional PHC areas ──────────────────────────────────────────────────────

export const DEMO_PHCS = ["Basirhat PHC", "Sandeshkhali PHC", "Minakhan PHC"];

// ─── Build synthetic patients ──────────────────────────────────────────────────

function makeSyntheticPatient(i: number): Patient {
  const ageBands: ("adult" | "elderly")[] = ["adult", "elderly", "adult", "adult", "elderly"];
  return {
    token: `DEMO${String(i).padStart(4, "0")}`,
    ageBand: pick(ageBands),
    pregnant: rand() < 0.05,
    kidneyDisease: rand() < 0.2,
    livesAlone: rand() < 0.3,
    worksOutdoors: rand() < 0.4,
    latestCreatinine: rand() < 0.4 ? Math.round(rand() * 3 + 0.8) : null,
    latestEGFR: rand() < 0.3 ? Math.round(rand() * 60 + 30) : null,
    medicines: pick([
      ["Glucophage", "Lasix"],
      ["Cosart", "Glucophage"],
      ["Cardace", "Glycomet"],
      ["Telma", "Lasix"],
      ["Jardiance", "Envas"],
      ["Amaryl", "Glucophage"],
      ["Brufen"],
      ["Forxiga", "Hydrochlorthiazide"],
      ["Paracetamol"],
      ["Glimy", "Telma"],
    ]),
    createdAt: new Date(Date.now() - Math.floor(rand() * 30) * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeSyntheticSymptoms(): ParsedSymptoms {
  const symptomSets = [
    ["loose_motions", "vomiting"],
    ["fever", "not_eating_drinking"],
    ["vomiting"],
    ["fever"],
    ["very_hot_weather"],
    ["loose_motions"],
    ["not_eating_drinking", "fever"],
  ] as const;

  const symptoms = pick(symptomSets as unknown as string[][]) as string[];

  return {
    symptoms: { value: symptoms as never, confidence: 0.9 + rand() * 0.1 },
    durationDays: { value: Math.ceil(rand() * 3), confidence: 0.85 },
    ableToDrinkFluids: { value: rand() > 0.2, confidence: 0.9 },
    urinePastEightHours: { value: rand() > 0.15, confidence: 0.88 },
    dizziness: { value: rand() < 0.1, confidence: 0.9 },
    confusion: { value: rand() < 0.05, confidence: 0.95 },
    bloodInStool: { value: rand() < 0.03, confidence: 0.97 },
    chestPain: { value: rand() < 0.04, confidence: 0.95 },
    cannotKeepFluids: { value: rand() < 0.08, confidence: 0.88 },
  };
}

// ─── Generate 30 synthetic checks ─────────────────────────────────────────────

export interface DemoCheck {
  checkRecord: CheckRecord;
  phc: string;
  isSynthetic: true;
}

export function generateDemoChecks(): DemoCheck[] {
  const results: DemoCheck[] = [];

  for (let i = 0; i < 30; i++) {
    const patient = makeSyntheticPatient(i);
    const symptoms = makeSyntheticSymptoms();
    const isHeatDay = rand() < 0.4;
    const timestamp = new Date(
      Date.now() - Math.floor(rand() * 14) * 86400000
    ).toISOString();

    const input: CheckInput = {
      patient,
      symptoms,
      brands: patient.medicines || [],
      isHeatDay,
      timestamp,
    };

    const result: CheckResult = evaluate(input);

    const checkRecord: CheckRecord = {
      id: `demo-check-${i}`,
      input,
      result,
      createdAt: timestamp,
    };

    results.push({
      checkRecord,
      phc: DEMO_PHCS[i % 3],
      isSynthetic: true,
    });
  }

  return results;
}

// ─── Aggregate for dashboard charts ──────────────────────────────────────────

export interface DashboardStats {
  totalChecks: number;
  totalFlagged: number;
  totalUrgent: number;
  byIllness: Record<string, number>;
  byMedicineClass: Record<string, number>;
  byPHC: Record<string, number>;
  heatDayChecks: number;
}

export function computeDashboardStats(demos: DemoCheck[]): DashboardStats {
  const stats: DashboardStats = {
    totalChecks: demos.length,
    totalFlagged: 0,
    totalUrgent: 0,
    byIllness: {},
    byMedicineClass: {},
    byPHC: {},
    heatDayChecks: 0,
  };

  for (const demo of demos) {
    const { checkRecord, phc } = demo;
    const { result, input } = checkRecord;

    if (result.urgency !== "NO_FLAG") stats.totalFlagged++;
    if (result.urgency === "GO_TO_HEALTH_FACILITY_NOW") stats.totalUrgent++;
    if (input.isHeatDay) stats.heatDayChecks++;

    // By illness
    for (const s of input.symptoms.symptoms.value) {
      stats.byIllness[s] = (stats.byIllness[s] ?? 0) + 1;
    }

    // By medicine class
    for (const m of result.perMedicine) {
      if (m.flag !== "NO_FLAG") {
        for (const cls of m.classes) {
          stats.byMedicineClass[cls] = (stats.byMedicineClass[cls] ?? 0) + 1;
        }
      }
    }

    // By PHC
    stats.byPHC[phc] = (stats.byPHC[phc] ?? 0) + 1;
  }

  return stats;
}

export const DEMO_PATIENTS: Patient[] = Array.from({ length: 10 }, (_, i) => makeSyntheticPatient(i));

export const DEMO_CHECKS: CheckRecord[] = generateDemoChecks().map((d) => d.checkRecord);

export function exportChecksCSV(checks: CheckRecord[]): string {
  let csv = "Check_ID,Patient_Token,Age_Band,Symptoms,Heat_Day,Urgency,Flagged_Medicines,Created_At\n";
  for (const c of checks) {
    const syms = c.input.symptoms.symptoms.value.join(";");
    const flaggedMeds = c.result.perMedicine
      .filter((m) => m.flag === "ASK_DOCTOR_TODAY")
      .map((m) => `${m.brand} (${m.classes.join("/")})`)
      .join(";");
    csv += `"${c.id}","${c.input.patient.token}","${c.input.patient.ageBand}","${syms}","${c.input.isHeatDay ? "yes" : "no"}","${c.result.urgency}","${flaggedMeds}","${c.createdAt}"\n`;
  }
  return csv;
}
