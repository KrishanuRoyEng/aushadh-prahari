/**
 * metrics.ts — Evaluation Metrics
 *
 * Computes: sensitivity, specificity, Cohen's kappa,
 * confusion matrix, missed urgent cases.
 * All computed ONLY from data provided by the caller.
 * No embedded clinical data or pre-computed numbers.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type BinaryLabel = "yes" | "no";

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface BinaryMetrics {
  sensitivity: number | null; // recall = TP/(TP+FN)
  specificity: number | null; // = TN/(TN+FP)
  ppv: number | null; // precision = TP/(TP+FP)
  npv: number | null;
  accuracy: number | null;
  f1: number | null;
  kappa: number | null;
  confusionMatrix: ConfusionMatrix;
  missedUrgentCases: string[]; // IDs of FN cases
  falseAlarms: string[]; // IDs of FP cases
  n: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeDiv(num: number, den: number): number | null {
  return den === 0 ? null : num / den;
}

// ─── Binary metrics ───────────────────────────────────────────────────────────

export function computeBinaryMetrics(
  predictions: Array<{ id: string; predicted: BinaryLabel; actual: BinaryLabel }>
): BinaryMetrics {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  const missedUrgentCases: string[] = [];
  const falseAlarms: string[] = [];

  for (const row of predictions) {
    const isPos = row.actual === "yes";
    const isPredPos = row.predicted === "yes";

    if (isPos && isPredPos) tp++;
    else if (!isPos && isPredPos) { fp++; falseAlarms.push(row.id); }
    else if (isPos && !isPredPos) { fn++; missedUrgentCases.push(row.id); }
    else tn++;
  }

  const n = predictions.length;
  const sensitivity = safeDiv(tp, tp + fn);
  const specificity = safeDiv(tn, tn + fp);
  const ppv = safeDiv(tp, tp + fp);
  const npv = safeDiv(tn, tn + fn);
  const accuracy = safeDiv(tp + tn, n);
  const f1 = ppv !== null && sensitivity !== null && (ppv + sensitivity) > 0
    ? safeDiv(2 * ppv * sensitivity, ppv + sensitivity)
    : null;

  // Cohen's kappa
  let kappa: number | null = null;
  if (n > 0) {
    const pObserved = (tp + tn) / n;
    const pExpectedPos = ((tp + fn) / n) * ((tp + fp) / n);
    const pExpectedNeg = ((tn + fp) / n) * ((tn + fn) / n);
    const pExpected = pExpectedPos + pExpectedNeg;
    kappa = pExpected === 1 ? null : (pObserved - pExpected) / (1 - pExpected);
  }

  return {
    sensitivity,
    specificity,
    ppv,
    npv,
    accuracy,
    f1,
    kappa,
    confusionMatrix: { tp, fp, tn, fn },
    missedUrgentCases,
    falseAlarms,
    n,
  };
}

// ─── Inter-rater reliability (reviewer vs reviewer) ───────────────────────────

export interface InterRaterResult {
  reviewerA: string;
  reviewerB: string;
  kappa: number | null;
  percentAgreement: number | null;
  n: number;
}

export function computeInterRaterKappa(
  labels: Array<{ labelA: BinaryLabel | undefined; labelB: BinaryLabel | undefined }>
): InterRaterResult {
  const paired = labels.filter((l) => l.labelA !== undefined && l.labelB !== undefined);
  const n = paired.length;
  if (n === 0) return { reviewerA: "R1", reviewerB: "R2", kappa: null, percentAgreement: null, n: 0 };

  const predictions = paired.map((l, i) => ({
    id: String(i),
    predicted: l.labelA as BinaryLabel,
    actual: l.labelB as BinaryLabel,
  }));

  const metrics = computeBinaryMetrics(predictions);
  return {
    reviewerA: "R1",
    reviewerB: "R2",
    kappa: metrics.kappa,
    percentAgreement: metrics.accuracy,
    n,
  };
}

// ─── Majority label ───────────────────────────────────────────────────────────

export function majorityLabel(
  labels: Array<BinaryLabel | undefined>
): BinaryLabel {
  const defined = labels.filter((l): l is BinaryLabel => l !== undefined);
  if (defined.length === 0) return "no";
  const yesCount = defined.filter((l) => l === "yes").length;
  return yesCount > defined.length / 2 ? "yes" : "no";
}

// ─── Brand mapping accuracy ───────────────────────────────────────────────────

export interface BrandMappingRow {
  brand: string;
  predictedClass: string;
  actualClass: string;
}

export interface BrandMappingMetrics {
  overallAccuracy: number | null;
  perClass: Record<string, { correct: number; total: number; accuracy: number | null }>;
  errors: BrandMappingRow[];
  n: number;
}

export function computeBrandMappingMetrics(rows: BrandMappingRow[]): BrandMappingMetrics {
  if (rows.length === 0) {
    return { overallAccuracy: null, perClass: {}, errors: [], n: 0 };
  }

  let correct = 0;
  const perClass: BrandMappingMetrics["perClass"] = {};
  const errors: BrandMappingRow[] = [];

  for (const row of rows) {
    const isCorrect = row.predictedClass.trim().toLowerCase() === row.actualClass.trim().toLowerCase();
    if (isCorrect) correct++;
    else errors.push(row);

    if (!perClass[row.actualClass]) {
      perClass[row.actualClass] = { correct: 0, total: 0, accuracy: null };
    }
    perClass[row.actualClass].total++;
    if (isCorrect) perClass[row.actualClass].correct++;
  }

  for (const cls of Object.keys(perClass)) {
    const { correct: c, total: t } = perClass[cls];
    perClass[cls].accuracy = t > 0 ? c / t : null;
  }

  return {
    overallAccuracy: rows.length > 0 ? correct / rows.length : null,
    perClass,
    errors,
    n: rows.length,
  };
}

// ─── Speech field-level accuracy ─────────────────────────────────────────────

export interface SpeechFieldRow {
  field: string;
  predicted: string;
  actual: string;
}

export interface SpeechMetrics {
  overallAccuracy: number | null;
  perField: Record<string, { correct: number; total: number; accuracy: number | null }>;
  n: number;
}

export function computeSpeechMetrics(rows: SpeechFieldRow[]): SpeechMetrics {
  if (rows.length === 0) return { overallAccuracy: null, perField: {}, n: 0 };

  let correct = 0;
  const perField: SpeechMetrics["perField"] = {};

  for (const row of rows) {
    const isCorrect = row.predicted.trim().toLowerCase() === row.actual.trim().toLowerCase();
    if (isCorrect) correct++;

    if (!perField[row.field]) perField[row.field] = { correct: 0, total: 0, accuracy: null };
    perField[row.field].total++;
    if (isCorrect) perField[row.field].correct++;
  }

  for (const f of Object.keys(perField)) {
    const { correct: c, total: t } = perField[f];
    perField[f].accuracy = t > 0 ? c / t : null;
  }

  return {
    overallAccuracy: correct / rows.length,
    perField,
    n: rows.length,
  };
}

// ─── Format metric as % string ────────────────────────────────────────────────

export function fmtPct(val: number | null, decimals = 1): string {
  if (val === null) return "N/A";
  return `${(val * 100).toFixed(decimals)}%`;
}

export const formatMetricPercent = fmtPct;

export function fmtKappa(val: number | null): string {
  if (val === null) return "N/A";
  return val.toFixed(3);
}
