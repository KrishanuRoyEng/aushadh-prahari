/**
 * metrics.test.ts — Evaluation metrics unit tests
 */

import { describe, it, expect } from "vitest";
import {
  computeBinaryMetrics,
  computeInterRaterKappa,
  majorityLabel,
  computeBrandMappingMetrics,
  computeSpeechMetrics,
  fmtPct,
  fmtKappa,
} from "./metrics";

describe("computeBinaryMetrics", () => {
  it("perfect sensitivity and specificity", () => {
    const preds = [
      { id: "1", predicted: "yes" as const, actual: "yes" as const },
      { id: "2", predicted: "yes" as const, actual: "yes" as const },
      { id: "3", predicted: "no" as const, actual: "no" as const },
      { id: "4", predicted: "no" as const, actual: "no" as const },
    ];
    const m = computeBinaryMetrics(preds);
    expect(m.sensitivity).toBe(1);
    expect(m.specificity).toBe(1);
    expect(m.kappa).toBe(1);
    expect(m.missedUrgentCases).toHaveLength(0);
    expect(m.falseAlarms).toHaveLength(0);
  });

  it("all false negatives = zero sensitivity", () => {
    const preds = [
      { id: "1", predicted: "no" as const, actual: "yes" as const },
      { id: "2", predicted: "no" as const, actual: "yes" as const },
    ];
    const m = computeBinaryMetrics(preds);
    expect(m.sensitivity).toBe(0);
    expect(m.missedUrgentCases).toContain("1");
    expect(m.missedUrgentCases).toContain("2");
  });

  it("all false positives = zero specificity", () => {
    const preds = [
      { id: "1", predicted: "yes" as const, actual: "no" as const },
      { id: "2", predicted: "yes" as const, actual: "no" as const },
    ];
    const m = computeBinaryMetrics(preds);
    expect(m.specificity).toBe(0);
    expect(m.falseAlarms).toContain("1");
    expect(m.falseAlarms).toContain("2");
  });

  it("n is correct", () => {
    const preds = [
      { id: "1", predicted: "yes" as const, actual: "yes" as const },
      { id: "2", predicted: "no" as const, actual: "no" as const },
      { id: "3", predicted: "yes" as const, actual: "no" as const },
    ];
    const m = computeBinaryMetrics(preds);
    expect(m.n).toBe(3);
  });

  it("empty input returns null metrics", () => {
    const m = computeBinaryMetrics([]);
    expect(m.sensitivity).toBeNull();
    expect(m.specificity).toBeNull();
    expect(m.kappa).toBeNull();
    expect(m.n).toBe(0);
  });

  it("known kappa example", () => {
    // 4 agreements out of 4 = kappa 1
    const preds = [
      { id: "1", predicted: "yes" as const, actual: "yes" as const },
      { id: "2", predicted: "yes" as const, actual: "yes" as const },
      { id: "3", predicted: "no" as const, actual: "no" as const },
      { id: "4", predicted: "no" as const, actual: "no" as const },
    ];
    const m = computeBinaryMetrics(preds);
    expect(m.kappa).toBeCloseTo(1, 3);
  });
});

describe("majorityLabel", () => {
  it("returns yes when majority yes", () => {
    expect(majorityLabel(["yes", "yes", "no"])).toBe("yes");
  });

  it("returns no when majority no", () => {
    expect(majorityLabel(["no", "no", "yes"])).toBe("no");
  });

  it("returns no when empty", () => {
    expect(majorityLabel([])).toBe("no");
  });

  it("returns no when all undefined", () => {
    expect(majorityLabel([undefined, undefined])).toBe("no");
  });
});

describe("computeInterRaterKappa", () => {
  it("returns null when no paired labels", () => {
    const r = computeInterRaterKappa([
      { labelA: undefined, labelB: undefined },
    ]);
    expect(r.kappa).toBeNull();
    expect(r.n).toBe(0);
  });

  it("returns 1 for perfect agreement", () => {
    const r = computeInterRaterKappa([
      { labelA: "yes", labelB: "yes" },
      { labelA: "no", labelB: "no" },
    ]);
    expect(r.kappa).toBeCloseTo(1, 3);
  });
});

describe("computeBrandMappingMetrics", () => {
  it("returns null accuracy for empty input", () => {
    const m = computeBrandMappingMetrics([]);
    expect(m.overallAccuracy).toBeNull();
    expect(m.n).toBe(0);
  });

  it("100% accuracy for correct predictions", () => {
    const rows = [
      { brand: "Glucophage", predictedClass: "metformin", actualClass: "metformin" },
      { brand: "Lasix", predictedClass: "diuretic_loop", actualClass: "diuretic_loop" },
    ];
    const m = computeBrandMappingMetrics(rows);
    expect(m.overallAccuracy).toBe(1);
    expect(m.errors).toHaveLength(0);
  });

  it("lists errors correctly", () => {
    const rows = [
      { brand: "Glucophage", predictedClass: "nsaid", actualClass: "metformin" },
    ];
    const m = computeBrandMappingMetrics(rows);
    expect(m.overallAccuracy).toBe(0);
    expect(m.errors).toHaveLength(1);
    expect(m.errors[0].brand).toBe("Glucophage");
  });
});

describe("computeSpeechMetrics", () => {
  it("empty returns null", () => {
    const m = computeSpeechMetrics([]);
    expect(m.overallAccuracy).toBeNull();
  });

  it("perfect match returns 1.0", () => {
    const m = computeSpeechMetrics([
      { field: "symptoms", predicted: "diarrhoea", actual: "diarrhoea" },
      { field: "duration", predicted: "2", actual: "2" },
    ]);
    expect(m.overallAccuracy).toBe(1);
  });
});

describe("formatters", () => {
  it("fmtPct formats null as N/A", () => {
    expect(fmtPct(null)).toBe("N/A");
  });

  it("fmtPct formats 0.857 as 85.7%", () => {
    expect(fmtPct(0.857)).toBe("85.7%");
  });

  it("fmtKappa formats null as N/A", () => {
    expect(fmtKappa(null)).toBe("N/A");
  });

  it("fmtKappa formats 0.723 as 0.723", () => {
    expect(fmtKappa(0.723)).toBe("0.723");
  });
});
