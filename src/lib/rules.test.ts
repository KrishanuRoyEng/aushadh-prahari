/**
 * rules.test.ts — Vitest unit tests for the deterministic rule engine
 *
 * Tests:
 * - Basic flag: dehydrating illness + flagged medicine class
 * - Red-flag symptoms → GO_TO_HEALTH_FACILITY_NOW
 * - Unknown medicine → ASK_DOCTOR_TODAY
 * - Child patient → GO_TO_HEALTH_FACILITY_NOW
 * - Pregnant + illness → GO_TO_HEALTH_FACILITY_NOW
 * - Heatwave rules
 * - No flag for "other" class
 * - Fail-safe: missing info, low confidence warnings
 * - Safety disclaimer always present
 */

import { describe, it, expect } from "vitest";
import { evaluate, SAFETY_DISCLAIMER } from "./rules";
import type { CheckInput, ParsedSymptoms, Patient } from "./schemas";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSymptoms(overrides: Partial<ParsedSymptoms> = {}): ParsedSymptoms {
  return {
    symptoms: { value: [], confidence: 0.95 },
    durationDays: { value: 1, confidence: 0.9 },
    ableToDrinkFluids: { value: true, confidence: 0.9 },
    urinePastEightHours: { value: true, confidence: 0.9 },
    dizziness: { value: false, confidence: 0.9 },
    confusion: { value: false, confidence: 0.9 },
    bloodInStool: { value: false, confidence: 0.9 },
    chestPain: { value: false, confidence: 0.9 },
    cannotKeepFluids: { value: false, confidence: 0.9 },
    ...overrides,
  };
}

function makePatient(overrides: Partial<Patient> = {}): Patient {
  return {
    token: "TEST0001",
    ageBand: "adult",
    pregnant: false,
    kidneyDisease: false,
    livesAlone: false,
    worksOutdoors: false,
    latestCreatinine: null,
    latestEGFR: null,
    medicines: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeInput(overrides: Partial<CheckInput> = {}): CheckInput {
  return {
    patient: makePatient(),
    symptoms: makeSymptoms(),
    brands: [],
    isHeatDay: false,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("evaluate — safety disclaimer", () => {
  it("always includes the safety disclaimer", () => {
    const result = evaluate(makeInput());
    expect(result.safetyDisclaimer).toBe(SAFETY_DISCLAIMER);
  });
});

describe("evaluate — no illness, no medicines", () => {
  it("returns NO_FLAG when no symptoms and no medicines", () => {
    const result = evaluate(makeInput());
    expect(result.urgency).toBe("NO_FLAG");
    expect(result.perMedicine).toHaveLength(0);
  });

  it("warns about NO_MEDICINES_LISTED", () => {
    const result = evaluate(makeInput({ brands: [] }));
    expect(result.warnings).toContain("NO_MEDICINES_LISTED");
  });
});

describe("evaluate — dehydrating illness + flagged medicine class", () => {
  it("flags metformin during diarrhoea as ASK_DOCTOR_TODAY", () => {
    const input = makeInput({
      brands: ["Glucophage"],
      symptoms: makeSymptoms({ symptoms: { value: ["loose_motions"], confidence: 0.9 } }),
    });
    const result = evaluate(input);
    expect(result.urgency).toBe("ASK_DOCTOR_TODAY");
    const med = result.perMedicine[0];
    expect(med.flag).toBe("ASK_DOCTOR_TODAY");
    expect(med.ruleHits.length).toBeGreaterThan(0);
    expect(med.ruleHits[0].ruleId).toBe("SD-001");
  });

  it("flags ACE inhibitor during vomiting", () => {
    const input = makeInput({
      brands: ["Envas"],
      symptoms: makeSymptoms({ symptoms: { value: ["vomiting"], confidence: 0.9 } }),
    });
    const result = evaluate(input);
    expect(result.urgency).toBe("ASK_DOCTOR_TODAY");
    expect(result.perMedicine[0].flag).toBe("ASK_DOCTOR_TODAY");
    expect(result.perMedicine[0].ruleHits.some(r => r.ruleId === "SD-002")).toBe(true);
  });

  it("flags ARB during fever", () => {
    const input = makeInput({
      brands: ["Cosart"],
      symptoms: makeSymptoms({ symptoms: { value: ["fever"], confidence: 0.9 } }),
    });
    const result = evaluate(input);
    expect(result.perMedicine[0].flag).toBe("ASK_DOCTOR_TODAY");
  });

  it("flags loop diuretic during not eating/drinking", () => {
    const input = makeInput({
      brands: ["Lasix"],
      symptoms: makeSymptoms({ symptoms: { value: ["not_eating_drinking"], confidence: 0.9 } }),
    });
    const result = evaluate(input);
    expect(result.perMedicine[0].flag).toBe("ASK_DOCTOR_TODAY");
  });

  it("flags sulfonylurea when not eating", () => {
    const input = makeInput({
      brands: ["Amaryl"],
      symptoms: makeSymptoms({ symptoms: { value: ["not_eating_drinking"], confidence: 0.9 } }),
    });
    const result = evaluate(input);
    expect(result.perMedicine[0].flag).toBe("ASK_DOCTOR_TODAY");
  });

  it("flags NSAID during diarrhoea", () => {
    const input = makeInput({
      brands: ["Brufen"],
      symptoms: makeSymptoms({ symptoms: { value: ["loose_motions"], confidence: 0.9 } }),
    });
    const result = evaluate(input);
    expect(result.perMedicine[0].flag).toBe("ASK_DOCTOR_TODAY");
  });

  it("does NOT flag paracetamol (other class) during diarrhoea", () => {
    const input = makeInput({
      brands: ["Paracetamol"],
      symptoms: makeSymptoms({ symptoms: { value: ["loose_motions"], confidence: 0.9 } }),
    });
    const result = evaluate(input);
    expect(result.perMedicine[0].flag).toBe("NO_FLAG");
  });
});

describe("evaluate — heatwave rules", () => {
  it("flags loop diuretic on heat day", () => {
    const input = makeInput({
      brands: ["Lasix"],
      isHeatDay: true,
      symptoms: makeSymptoms({ symptoms: { value: ["very_hot_weather"], confidence: 0.9 } }),
    });
    const result = evaluate(input);
    expect(result.perMedicine[0].flag).toBe("ASK_DOCTOR_TODAY");
    expect(result.perMedicine[0].ruleHits.some(r => r.ruleId === "HW-001")).toBe(true);
  });

  it("flags SGLT2 inhibitor on heat day", () => {
    const input = makeInput({
      brands: ["Jardiance"],
      isHeatDay: true,
      symptoms: makeSymptoms({ symptoms: { value: ["very_hot_weather"], confidence: 0.9 } }),
    });
    const result = evaluate(input);
    expect(result.perMedicine[0].flag).toBe("ASK_DOCTOR_TODAY");
  });

  it("does NOT flag loop diuretic when isHeatDay=false even with very_hot_weather symptom", () => {
    // Rule HW-001 requires isHeatDay=true
    const input = makeInput({
      brands: ["Lasix"],
      isHeatDay: false,
      symptoms: makeSymptoms({ symptoms: { value: ["very_hot_weather"], confidence: 0.9 } }),
    });
    const result = evaluate(input);
    // HW rule won't fire; SD rule needs a dehydrating illness symptom
    // very_hot_weather without isHeatDay=true: SD rules won't match (they need dehydration symptoms)
    expect(result.perMedicine[0].flag).toBe("NO_FLAG");
  });
});

describe("evaluate — red flags → GO_TO_HEALTH_FACILITY_NOW", () => {
  it("no urine in 8h → GO_TO_HEALTH_FACILITY_NOW", () => {
    const input = makeInput({
      brands: ["Glucophage"],
      symptoms: makeSymptoms({
        symptoms: { value: ["loose_motions"], confidence: 0.9 },
        urinePastEightHours: { value: false, confidence: 0.95 },
      }),
    });
    const result = evaluate(input);
    expect(result.urgency).toBe("GO_TO_HEALTH_FACILITY_NOW");
    expect(result.warnings).toContain("RED_FLAG:no_urine_8h");
  });

  it("dizziness → GO_TO_HEALTH_FACILITY_NOW", () => {
    const input = makeInput({
      brands: ["Lasix"],
      symptoms: makeSymptoms({
        symptoms: { value: ["vomiting"], confidence: 0.9 },
        dizziness: { value: true, confidence: 0.9 },
      }),
    });
    const result = evaluate(input);
    expect(result.urgency).toBe("GO_TO_HEALTH_FACILITY_NOW");
  });

  it("confusion → GO_TO_HEALTH_FACILITY_NOW", () => {
    const input = makeInput({
      brands: ["Envas"],
      symptoms: makeSymptoms({
        symptoms: { value: ["fever"], confidence: 0.9 },
        confusion: { value: true, confidence: 0.95 },
      }),
    });
    const result = evaluate(input);
    expect(result.urgency).toBe("GO_TO_HEALTH_FACILITY_NOW");
  });

  it("blood in stool → GO_TO_HEALTH_FACILITY_NOW", () => {
    const input = makeInput({
      brands: ["Paracetamol"],
      symptoms: makeSymptoms({
        symptoms: { value: ["loose_motions"], confidence: 0.9 },
        bloodInStool: { value: true, confidence: 0.95 },
      }),
    });
    const result = evaluate(input);
    expect(result.urgency).toBe("GO_TO_HEALTH_FACILITY_NOW");
    expect(result.warnings).toContain("RED_FLAG:blood_in_stool");
  });

  it("chest pain → GO_TO_HEALTH_FACILITY_NOW", () => {
    const input = makeInput({
      symptoms: makeSymptoms({
        chestPain: { value: true, confidence: 0.9 },
      }),
    });
    const result = evaluate(input);
    expect(result.urgency).toBe("GO_TO_HEALTH_FACILITY_NOW");
  });

  it("cannot keep fluids → GO_TO_HEALTH_FACILITY_NOW", () => {
    const input = makeInput({
      symptoms: makeSymptoms({
        cannotKeepFluids: { value: true, confidence: 0.9 },
      }),
    });
    const result = evaluate(input);
    expect(result.urgency).toBe("GO_TO_HEALTH_FACILITY_NOW");
  });

  it("child patient → GO_TO_HEALTH_FACILITY_NOW", () => {
    const input = makeInput({
      patient: makePatient({ ageBand: "child" }),
      brands: ["Glucophage"],
      symptoms: makeSymptoms({ symptoms: { value: ["fever"], confidence: 0.9 } }),
    });
    const result = evaluate(input);
    expect(result.urgency).toBe("GO_TO_HEALTH_FACILITY_NOW");
    expect(result.warnings).toContain("RED_FLAG:child_patient");
  });

  it("pregnant + illness → GO_TO_HEALTH_FACILITY_NOW", () => {
    const input = makeInput({
      patient: makePatient({ pregnant: true }),
      symptoms: makeSymptoms({ symptoms: { value: ["vomiting"], confidence: 0.9 } }),
    });
    const result = evaluate(input);
    expect(result.urgency).toBe("GO_TO_HEALTH_FACILITY_NOW");
    expect(result.warnings).toContain("RED_FLAG:pregnant_with_illness");
  });
});

describe("evaluate — unknown medicine fail-safe", () => {
  it("unknown brand → ASK_DOCTOR_TODAY", () => {
    const input = makeInput({
      brands: ["SomeRandomBrandXYZ"],
      symptoms: makeSymptoms({ symptoms: { value: ["loose_motions"], confidence: 0.9 } }),
    });
    const result = evaluate(input);
    const med = result.perMedicine[0];
    expect(med.flag).toBe("ASK_DOCTOR_TODAY");
    expect(med.brandStatus).toBe("unknown");
    expect(med.classes).toEqual(["unknown"]);
  });
});

describe("evaluate — low confidence warning", () => {
  it("low confidence symptoms field adds warning", () => {
    const input = makeInput({
      symptoms: makeSymptoms({ symptoms: { value: ["loose_motions"], confidence: 0.5 } }),
    });
    const result = evaluate(input);
    expect(result.warnings.some((w) => w.startsWith("LOW_CONFIDENCE"))).toBe(true);
  });
});

describe("evaluate — rule signed-off status propagated", () => {
  it("all rule hits report signedOff:false for unsigned rules", () => {
    const input = makeInput({
      brands: ["Glucophage"],
      symptoms: makeSymptoms({ symptoms: { value: ["loose_motions"], confidence: 0.9 } }),
    });
    const result = evaluate(input);
    for (const med of result.perMedicine) {
      for (const hit of med.ruleHits) {
        expect(hit.signedOff).toBe(false);
      }
    }
  });
});

describe("evaluate — multiple medicines", () => {
  it("evaluates each medicine independently and takes max urgency", () => {
    const input = makeInput({
      brands: ["Glucophage", "Paracetamol", "Lasix"],
      symptoms: makeSymptoms({ symptoms: { value: ["loose_motions", "vomiting"], confidence: 0.9 } }),
    });
    const result = evaluate(input);
    expect(result.urgency).toBe("ASK_DOCTOR_TODAY");
    const glucophage = result.perMedicine.find((m) => m.brand === "Glucophage");
    const paracetamol = result.perMedicine.find((m) => m.brand === "Paracetamol");
    const lasix = result.perMedicine.find((m) => m.brand === "Lasix");
    expect(glucophage?.flag).toBe("ASK_DOCTOR_TODAY");
    expect(paracetamol?.flag).toBe("NO_FLAG");
    expect(lasix?.flag).toBe("ASK_DOCTOR_TODAY");
  });
});
