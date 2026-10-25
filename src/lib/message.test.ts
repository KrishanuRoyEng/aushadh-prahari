/**
 * message.test.ts — MO message builder tests
 */

import { describe, it, expect } from "vitest";
import { buildMOMessage } from "./message";
import type { MessageInput } from "./message";
import type { Patient, ParsedSymptoms, CheckResult } from "./schemas";
import { SAFETY_DISCLAIMER } from "./rules";

function makePatient(): Patient {
  return {
    token: "ABCD1234",
    ageBand: "adult",
    pregnant: false,
    kidneyDisease: false,
    livesAlone: false,
    worksOutdoors: false,
    latestCreatinine: null,
    latestEGFR: null,
    medicines: ["Glucophage"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeSymptoms(): ParsedSymptoms {
  return {
    symptoms: { value: ["loose_motions", "vomiting"], confidence: 0.95 },
    durationDays: { value: 2, confidence: 0.9 },
    ableToDrinkFluids: { value: true, confidence: 0.9 },
    urinePastEightHours: { value: true, confidence: 0.9 },
    dizziness: { value: false, confidence: 0.9 },
    confusion: { value: false, confidence: 0.9 },
    bloodInStool: { value: false, confidence: 0.9 },
    chestPain: { value: false, confidence: 0.9 },
    cannotKeepFluids: { value: false, confidence: 0.9 },
  };
}

function makeResult(urgency: CheckResult["urgency"] = "ASK_DOCTOR_TODAY"): CheckResult {
  return {
    urgency,
    perMedicine: [
      {
        brand: "Glucophage",
        classes: ["metformin"],
        brandStatus: "unsigned",
        flag: urgency === "ASK_DOCTOR_TODAY" ? "ASK_DOCTOR_TODAY" : "GO_TO_HEALTH_FACILITY_NOW",
        ruleHits: [{ ruleId: "SD-001", ruleText: { bn: "", hi: "", en: "test" }, signedOff: false }],
      },
    ],
    warnings: [],
    safetyDisclaimer: SAFETY_DISCLAIMER,
  };
}

function makeInput(overrides: Partial<MessageInput> = {}): MessageInput {
  return {
    patient: makePatient(),
    symptoms: makeSymptoms(),
    result: makeResult(),
    isHeatDay: false,
    timestamp: "2026-10-25T10:00:00.000Z",
    ...overrides,
  };
}

describe("buildMOMessage", () => {
  it("returns a message with text", () => {
    const msg = buildMOMessage(makeInput());
    expect(typeof msg.text).toBe("string");
    expect(msg.text.length).toBeGreaterThan(0);
  });

  it("message is <= 300 characters", () => {
    const msg = buildMOMessage(makeInput());
    expect(msg.text.length).toBeLessThanOrEqual(300);
  });

  it("includes patient token", () => {
    const msg = buildMOMessage(makeInput());
    expect(msg.text).toContain("ABCD1234");
  });

  it("includes urgency label", () => {
    const msg = buildMOMessage(makeInput({ result: makeResult("ASK_DOCTOR_TODAY") }));
    expect(msg.text).toContain("REVIEW TODAY");
  });

  it("urgent message shows 🚨", () => {
    const msg = buildMOMessage(makeInput({ result: makeResult("GO_TO_HEALTH_FACILITY_NOW") }));
    expect(msg.text).toContain("🚨");
  });

  it("no-flag message shows ✓", () => {
    const result = makeResult("NO_FLAG");
    result.perMedicine[0].flag = "NO_FLAG";
    const msg = buildMOMessage(makeInput({ result }));
    expect(msg.text).toContain("✓");
  });

  it("smsLink starts with sms:", () => {
    const msg = buildMOMessage(makeInput());
    expect(msg.smsLink).toMatch(/^sms:/);
  });

  it("whatsappLink starts with https://wa.me", () => {
    const msg = buildMOMessage(makeInput());
    expect(msg.whatsappLink).toMatch(/^https:\/\/wa\.me/);
  });

  it("includes phone in links when provided", () => {
    const msg = buildMOMessage(makeInput({ moPhoneNumber: "+919876543210" }));
    expect(msg.smsLink).toContain("919876543210");
    expect(msg.whatsappLink).toContain("919876543210");
  });

  it("message with many medicines truncates gracefully", () => {
    const result = makeResult("ASK_DOCTOR_TODAY");
    result.perMedicine = Array.from({ length: 10 }, (_, i) => ({
      brand: `MedicineName${i}VeryLongBrandNameHere`,
      classes: ["metformin" as const],
      brandStatus: "unsigned" as const,
      flag: "ASK_DOCTOR_TODAY" as const,
      ruleHits: [],
    }));
    const msg = buildMOMessage(makeInput({ result }));
    expect(msg.text.length).toBeLessThanOrEqual(300);
    if (msg.truncated) {
      expect(msg.text).toContain("+");
    }
  });

  it("totalFlagged count is correct", () => {
    const msg = buildMOMessage(makeInput());
    expect(msg.totalFlagged).toBe(1);
  });
});
