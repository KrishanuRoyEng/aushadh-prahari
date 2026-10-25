/**
 * risk.test.ts — Risk scoring unit tests
 */

import { describe, it, expect } from "vitest";
import { computeRiskScore, computeHeatIndex, isHeatDay } from "./risk";
import type { Patient } from "./schemas";

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

describe("computeRiskScore", () => {
  it("returns score object with token", () => {
    const result = computeRiskScore({ patient: makePatient({ token: "ABC1" }) });
    expect(result.token).toBe("ABC1");
    expect(typeof result.totalScore).toBe("number");
    expect(Array.isArray(result.breakdown)).toBe(true);
  });

  it("elderly scores more than adult", () => {
    const adult = computeRiskScore({ patient: makePatient({ ageBand: "adult" }) });
    const elderly = computeRiskScore({ patient: makePatient({ ageBand: "elderly" }) });
    expect(elderly.totalScore).toBeGreaterThan(adult.totalScore);
  });

  it("kidney disease adds points", () => {
    const without = computeRiskScore({ patient: makePatient() });
    const with_ = computeRiskScore({ patient: makePatient({ kidneyDisease: true }) });
    expect(with_.totalScore).toBeGreaterThan(without.totalScore);
  });

  it("lives alone adds points", () => {
    const without = computeRiskScore({ patient: makePatient() });
    const with_ = computeRiskScore({ patient: makePatient({ livesAlone: true }) });
    expect(with_.totalScore).toBeGreaterThan(without.totalScore);
  });

  it("recent illness adds points", () => {
    const without = computeRiskScore({ patient: makePatient(), hasRecentIllness: false });
    const with_ = computeRiskScore({ patient: makePatient(), hasRecentIllness: true });
    expect(with_.totalScore).toBeGreaterThan(without.totalScore);
  });

  it("flagged medicines add points", () => {
    const withFlagged = computeRiskScore({
      patient: makePatient({ medicines: ["Lasix"] }),
    });
    const withNone = computeRiskScore({ patient: makePatient({ medicines: [] }) });
    expect(withFlagged.totalScore).toBeGreaterThan(withNone.totalScore);
  });

  it("breakdown factors sum to totalScore", () => {
    const result = computeRiskScore({
      patient: makePatient({ kidneyDisease: true, livesAlone: true }),
      hasRecentIllness: true,
    });
    const sum = result.breakdown.reduce((s, b) => s + b.points, 0);
    expect(sum).toBe(result.totalScore);
  });
});

describe("computeHeatIndex", () => {
  it("returns a number", () => {
    const hi = computeHeatIndex(38, 70);
    expect(typeof hi).toBe("number");
  });

  it("very hot + humid > threshold", () => {
    const hi = computeHeatIndex(45, 80);
    expect(hi).toBeGreaterThan(41);
  });

  it("mild temperature is below threshold", () => {
    const hi = computeHeatIndex(28, 50);
    expect(hi).toBeLessThan(41);
  });
});

describe("isHeatDay", () => {
  it("returns true for extreme heat+humidity", () => {
    expect(isHeatDay(44, 80)).toBe(true);
  });

  it("returns false for mild conditions", () => {
    expect(isHeatDay(28, 50)).toBe(false);
  });
});
