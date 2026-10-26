/**
 * demo.ts — Demo Mode & Walkthrough Data Engine
 *
 * Guarantees:
 *  1. When Demo Mode is ON, reads and writes NEVER touch the real IndexedDB.
 *  2. "DEMO MODE - SYNTHETIC DATA" banner is shown.
 *  3. Loads 8 synthetic patients, 3 prepared illness scenarios, 1 heatwave caseload,
 *     and 20 synthetic evaluation vignettes labelled by 3 reviewers.
 *  4. Single-tap "Reset demo".
 *  5. Guided 6-step walkthrough for presentations.
 */

import type { Patient, PendingReviewItem, CheckInput, CheckResult } from "./schemas";
import type { CheckRecord, ContactStatus } from "./db";
import { evaluate } from "./rules";

const DEMO_MODE_KEY = "ap_demo_mode_active";
const DEMO_STORE_KEY = "ap_demo_store_v1";

export interface DemoStore {
  patients: Patient[];
  checks: CheckRecord[];
  pendingReviews: PendingReviewItem[];
  contactStatus: ContactStatus[];
  vignettesCSV: string;
}

// ─── Demo Mode Toggle & Listeners ────────────────────────────────────────────

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEMO_MODE_KEY) === "true";
}

export function setDemoMode(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_MODE_KEY, enabled ? "true" : "false");
  if (enabled && !getDemoStore()) {
    loadDemoWalkthroughData();
  }
  window.dispatchEvent(new CustomEvent("ap-demo-toggle", { detail: { enabled } }));
}

// ─── Demo Store Storage ──────────────────────────────────────────────────────

export function getDemoStore(): DemoStore | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(DEMO_STORE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoStore;
  } catch {
    return null;
  }
}

export function saveDemoStore(store: DemoStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent("ap-demo-update"));
}

export function resetDemo(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEMO_STORE_KEY);
  // Re-seed clean demo data
  loadDemoWalkthroughData();
  window.dispatchEvent(new CustomEvent("ap-demo-reset"));
}

// ─── Walkthrough Seed Data Generator ─────────────────────────────────────────

export function generateInitialDemoStore(): DemoStore {
  const now = new Date().toISOString();

  // 1. 8 Seeded Patients
  const patients: Patient[] = [
    {
      token: "DEMO-P01",
      ageBand: "elderly",
      pregnant: false,
      kidneyDisease: false,
      knownKidneyDisease: false,
      livesAlone: false,
      worksOutdoors: false,
      latestCreatinine: 1.1,
      latestEGFR: 65,
      medicines: ["Cardace", "Glycomet"],
      createdAt: now,
      updatedAt: now,
    },
    {
      token: "DEMO-P02",
      ageBand: "elderly",
      pregnant: false,
      kidneyDisease: true,
      knownKidneyDisease: true,
      livesAlone: true,
      worksOutdoors: false,
      latestCreatinine: 2.2,
      latestEGFR: 32,
      medicines: ["Lasix", "Cosart"],
      createdAt: now,
      updatedAt: now,
    },
    {
      token: "DEMO-P03",
      ageBand: "adult",
      pregnant: false,
      kidneyDisease: false,
      knownKidneyDisease: false,
      livesAlone: false,
      worksOutdoors: true,
      latestCreatinine: 0.9,
      latestEGFR: 95,
      medicines: ["Jardiance", "Amaryl"],
      createdAt: now,
      updatedAt: now,
    },
    {
      token: "DEMO-P04",
      ageBand: "elderly",
      pregnant: false,
      kidneyDisease: false,
      knownKidneyDisease: false,
      livesAlone: true,
      worksOutdoors: true,
      latestCreatinine: 1.3,
      latestEGFR: 58,
      medicines: ["Envas", "Hydrochlorthiazide"],
      createdAt: now,
      updatedAt: now,
    },
    {
      token: "DEMO-P05",
      ageBand: "adult",
      pregnant: true,
      kidneyDisease: false,
      knownKidneyDisease: false,
      livesAlone: false,
      worksOutdoors: false,
      latestCreatinine: 0.7,
      latestEGFR: 110,
      medicines: ["Paracetamol"],
      createdAt: now,
      updatedAt: now,
    },
    {
      token: "DEMO-P06",
      ageBand: "elderly",
      pregnant: false,
      kidneyDisease: true,
      knownKidneyDisease: true,
      livesAlone: false,
      worksOutdoors: false,
      latestCreatinine: 1.8,
      latestEGFR: 42,
      medicines: ["Brufen", "Telma"],
      createdAt: now,
      updatedAt: now,
    },
    {
      token: "DEMO-P07",
      ageBand: "child",
      pregnant: false,
      kidneyDisease: false,
      knownKidneyDisease: false,
      livesAlone: false,
      worksOutdoors: false,
      latestCreatinine: null,
      latestEGFR: null,
      medicines: ["Paracetamol"],
      createdAt: now,
      updatedAt: now,
    },
    {
      token: "DEMO-P08",
      ageBand: "adult",
      pregnant: false,
      kidneyDisease: false,
      knownKidneyDisease: false,
      livesAlone: false,
      worksOutdoors: false,
      latestCreatinine: 1.0,
      latestEGFR: 88,
      medicines: ["Forxiga", "Glucophage"],
      createdAt: now,
      updatedAt: now,
    },
  ];

  // 2. 3 Prepared Illness Scenarios & Checks
  // Scenario 1: Loose motions + ACE inhibitor + metformin (Needs doctor review today)
  const inputScenario1: CheckInput = {
    patient: patients[0],
    symptoms: {
      symptoms: { value: ["loose_motions"], confidence: 1 },
      durationDays: { value: 2, confidence: 1 },
      ableToDrinkFluids: { value: true, confidence: 1 },
      urinePastEightHours: { value: true, confidence: 1 },
      dizziness: { value: false, confidence: 1 },
      confusion: { value: false, confidence: 1 },
      bloodInStool: { value: false, confidence: 1 },
      chestPain: { value: false, confidence: 1 },
      cannotKeepFluids: { value: false, confidence: 1 },
    },
    brands: ["Cardace", "Glycomet"],
    isHeatDay: false,
    timestamp: now,
  };
  const resultScenario1: CheckResult = evaluate(inputScenario1);

  // Scenario 2: Red flag case (no urine past 8 hours -> GO_TO_HEALTH_FACILITY_NOW)
  const inputScenario2: CheckInput = {
    patient: patients[1],
    symptoms: {
      symptoms: { value: ["loose_motions", "vomiting"], confidence: 1 },
      durationDays: { value: 2, confidence: 1 },
      ableToDrinkFluids: { value: false, confidence: 1 },
      urinePastEightHours: { value: false, confidence: 1 },
      dizziness: { value: true, confidence: 1 },
      confusion: { value: false, confidence: 1 },
      bloodInStool: { value: false, confidence: 1 },
      chestPain: { value: false, confidence: 1 },
      cannotKeepFluids: { value: true, confidence: 1 },
    },
    brands: ["Lasix", "Cosart"],
    isHeatDay: false,
    timestamp: now,
  };
  const resultScenario2: CheckResult = evaluate(inputScenario2);

  // Scenario 3: Unknown brand ("AyurDiab-Plus")
  const inputScenario3: CheckInput = {
    patient: patients[2],
    symptoms: {
      symptoms: { value: ["fever", "not_eating_drinking"], confidence: 1 },
      durationDays: { value: 1, confidence: 1 },
      ableToDrinkFluids: { value: true, confidence: 1 },
      urinePastEightHours: { value: true, confidence: 1 },
      dizziness: { value: false, confidence: 1 },
      confusion: { value: false, confidence: 1 },
      bloodInStool: { value: false, confidence: 1 },
      chestPain: { value: false, confidence: 1 },
      cannotKeepFluids: { value: false, confidence: 1 },
    },
    brands: ["AyurDiab-Plus"],
    isHeatDay: false,
    timestamp: now,
  };
  const resultScenario3: CheckResult = evaluate(inputScenario3);

  const checks: CheckRecord[] = [
    {
      id: "demo-check-001",
      input: inputScenario1,
      result: resultScenario1,
      createdAt: now,
    },
    {
      id: "demo-check-002",
      input: inputScenario2,
      result: resultScenario2,
      createdAt: now,
    },
    {
      id: "demo-check-003",
      input: inputScenario3,
      result: resultScenario3,
      createdAt: now,
    },
  ];

  // 3. Pending Review Queue Item for Unknown Brand
  const pendingReviews: PendingReviewItem[] = [
    {
      id: "demo-rev-001",
      type: "brand_suggestion",
      createdAt: now,
      brand: "AyurDiab-Plus",
      suggestedClass: "metformin",
      confidence: 0.72,
      status: "pending",
      submittedBy: "CHO Basirhat Sub-Center",
      submittedAt: now,
      source: "AI suggestion from user input",
    },
    {
      id: "demo-rev-002",
      type: "brand_suggestion",
      createdAt: now,
      brand: "K-Citral",
      suggestedClass: "other",
      confidence: 0.85,
      status: "pending",
      submittedBy: "ASHA Sandeshkhali",
      submittedAt: now,
      source: "Manual entry by CHO",
    },
  ];

  // 4. Contact status for heatwave caseload
  const todayDate = new Date().toISOString().split("T")[0];
  const contactStatus: ContactStatus[] = [
    { token: "DEMO-P02", date: todayDate, status: "called" },
    { token: "DEMO-P04", date: todayDate, status: "not_reached" },
  ];

  // 5. 20 Vignettes CSV with 3 synthetic reviewers
  const vignettesCSV = [
    "vignette_id,patient_age_band,illness,brand_name,class,reviewer_1_flag,reviewer_2_flag,reviewer_3_flag,gold_flag,model_flag",
    "V01,elderly,loose_motions,Cardace,ace_inhibitor,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY",
    "V02,elderly,loose_motions,Glycomet,metformin,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY",
    "V03,elderly,no_urine_8h,Lasix,diuretic_loop,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW",
    "V04,adult,very_hot_weather,Lasix,diuretic_loop,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY",
    "V05,adult,very_hot_weather,Paracetamol,other,NO_FLAG,NO_FLAG,NO_FLAG,NO_FLAG,NO_FLAG",
    "V06,child,loose_motions,Paracetamol,other,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW",
    "V07,adult,pregnant_vomiting,Paracetamol,other,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW",
    "V08,adult,vomiting,Jardiance,sglt2_inhibitor,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY",
    "V09,elderly,vomiting,Amaryl,sulfonylurea,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY",
    "V10,adult,fever,Brufen,nsaid,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY",
    "V11,elderly,none,Cardace,ace_inhibitor,NO_FLAG,NO_FLAG,NO_FLAG,NO_FLAG,NO_FLAG",
    "V12,adult,fever,Paracetamol,other,NO_FLAG,NO_FLAG,NO_FLAG,NO_FLAG,NO_FLAG",
    "V13,elderly,not_eating_drinking,Glucophage,metformin,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY",
    "V14,adult,dizziness_fainting,Telma,arb,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW",
    "V15,elderly,chest_pain,Cosart,arb,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW",
    "V16,adult,loose_motions,Cosart,arb,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY",
    "V17,adult,fever,Envas,ace_inhibitor,NO_FLAG,NO_FLAG,ASK_DOCTOR_TODAY,NO_FLAG,NO_FLAG",
    "V18,elderly,not_eating_drinking,Forxiga,sglt2_inhibitor,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY,ASK_DOCTOR_TODAY",
    "V19,adult,confusion,Glycomet,metformin,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW,GO_TO_HEALTH_FACILITY_NOW",
    "V20,adult,none,Amaryl,sulfonylurea,NO_FLAG,NO_FLAG,NO_FLAG,NO_FLAG,NO_FLAG",
  ].join("\n");

  return {
    patients,
    checks,
    pendingReviews,
    contactStatus,
    vignettesCSV,
  };
}

export function loadDemoWalkthroughData(): DemoStore {
  const store = generateInitialDemoStore();
  saveDemoStore(store);
  return store;
}

export function getDemoScenario(scenarioId: string): CheckInput | null {
  const initial = generateInitialDemoStore();
  if (scenarioId === "scenario1") {
    return initial.checks[0].input;
  }
  if (scenarioId === "scenario2") {
    return initial.checks[1].input;
  }
  if (scenarioId === "scenario3") {
    return initial.checks[2].input;
  }
  return null;
}
