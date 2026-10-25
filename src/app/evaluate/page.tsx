"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { t, getLanguage, type Lang } from "@/lib/i18n";
import {
  computeBinaryMetrics,
  computeInterRaterKappa,
  majorityLabel,
  computeBrandMappingMetrics,
  computeSpeechMetrics,
  formatMetricPercent,
  type BinaryLabel,
  type BinaryMetrics,
  type BrandMappingMetrics,
  type SpeechMetrics,
} from "@/lib/metrics";
import { evaluate } from "@/lib/rules";
import type { CheckInput, DrugClass, IllnessSymptom, AgeBand } from "@/lib/schemas";

// Sample CSV template for vignettes
const SAMPLE_VIGNETTES_CSV = `case_id,age_band,pregnant,kidney_disease,symptoms,medicines,reviewer_1,reviewer_2,reviewer_3
VIG-01,elderly,no,yes,loose_motions;fever,Envas (ace_inhibitor);Glycomet (metformin),yes,yes,yes
VIG-02,adult,no,no,none,Amlodipine (other),no,no,no
VIG-03,adult,no,no,vomiting;loose_motions,Lasix (diuretic_loop),yes,yes,yes
VIG-04,elderly,no,no,none,Brufen (nsaid),no,no,no
VIG-05,child,no,no,fever;loose_motions,Brufen (nsaid),yes,yes,yes
VIG-06,adult,yes,no,fever,Paracetamol (other),yes,yes,yes
VIG-07,elderly,no,yes,very_hot_weather,Forxiga (sglt2_inhibitor),yes,yes,yes
VIG-08,adult,no,no,loose_motions,unknown_tablet (unknown),yes,yes,no`;

export default function EvaluatePage() {
  const [lang, setLang] = useState<Lang>("bn");
  const [activeTab, setActiveTab] = useState<"vignettes" | "brands" | "speech">("vignettes");

  // Vignette state
  const [vignetteCsv, setVignetteCsv] = useState<string>("");
  const [vignetteMetrics, setVignetteMetrics] = useState<BinaryMetrics | null>(null);
  const [raterKappas, setRaterKappas] = useState<{
    appVsR1: number | null;
    appVsR2: number | null;
    appVsR3: number | null;
    interRater: number | null;
  } | null>(null);
  const [evaluationRows, setEvaluationRows] = useState<
    Array<{
      id: string;
      appFlag: BinaryLabel;
      majorityActual: BinaryLabel;
      r1: BinaryLabel;
      r2: BinaryLabel;
      r3: BinaryLabel;
    }>
  >([]);

  // Brand Mapping state
  const [brandCsv, setBrandCsv] = useState<string>("");
  const [brandMetrics, setBrandMetrics] = useState<BrandMappingMetrics | null>(null);

  // Speech Extraction state
  const [speechTranscript, setSpeechTranscript] = useState<string>("");
  const [speechGroundTruth, setSpeechGroundTruth] = useState<string>(
    '{"symptoms":["loose_motions","vomiting"],"durationDays":2,"ableToDrinkFluids":true,"urinePastEightHours":true}'
  );
  const [speechTestOutput, setSpeechTestOutput] = useState<SpeechMetrics | null>(null);
  const [isEvaluatingSpeech, setIsEvaluatingSpeech] = useState(false);

  useEffect(() => {
    setLang(getLanguage());
  }, []);

  // ─── Vignettes Parser & Runner ─────────────────────────────────────────────
  function runVignetteEvaluation(csvText: string) {
    if (!csvText.trim()) return;

    const lines = csvText.trim().split("\n");
    if (lines.length < 2) return;

    const header = lines[0].split(",").map((s) => s.trim().toLowerCase());
    const predictions: Array<{ id: string; predicted: BinaryLabel; actual: BinaryLabel }> = [];
    const r1List: BinaryLabel[] = [];
    const r2List: BinaryLabel[] = [];
    const r3List: BinaryLabel[] = [];
    const appList: BinaryLabel[] = [];
    const rows: typeof evaluationRows = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(",").map((s) => s.trim());
      const rowObj: Record<string, string> = {};
      header.forEach((h, idx) => {
        rowObj[h] = cols[idx] ?? "";
      });

      const caseId = rowObj["case_id"] || `VIG-${i}`;
      const ageBand = (rowObj["age_band"] || "adult") as AgeBand;
      const pregnant = rowObj["pregnant"]?.toLowerCase() === "yes";
      const kidneyDisease = rowObj["kidney_disease"]?.toLowerCase() === "yes";

      // Parse symptoms
      const symList = (rowObj["symptoms"] || "none")
        .split(";")
        .map((s) => s.trim()) as IllnessSymptom[];

      // Parse medicines
      const medList = (rowObj["medicines"] || "").split(";").map((mStr) => {
        const match = mStr.match(/(.+)\s*\((.+)\)/);
        if (match) {
          return {
            brand: match[1].trim(),
            classes: [match[2].trim() as DrugClass],
            signedOff: false,
          };
        }
        return {
          brand: mStr.trim() || "Unknown",
          classes: ["unknown" as DrugClass],
          signedOff: false,
        };
      });

      // Construct CheckInput and run pure rule engine
      const checkInput: CheckInput = {
        patient: {
          token: caseId,
          ageBand,
          pregnant,
          kidneyDisease,
          medicines: medList.map((m) => m.brand),
          chronicMedicines: medList.map((m) => ({ brand: m.brand, classes: m.classes, dose: "" })),
          createdAt: new Date().toISOString(),
        },
        symptoms: {
          symptoms: { value: symList, confidence: 1 },
          durationDays: { value: 1, confidence: 1 },
          ableToDrinkFluids: { value: true, confidence: 1 },
          urinePastEightHours: { value: true, confidence: 1 },
          dizziness: { value: false, confidence: 1 },
          confusion: { value: false, confidence: 1 },
          bloodInStool: { value: false, confidence: 1 },
          chestPain: { value: false, confidence: 1 },
          cannotKeepFluids: { value: false, confidence: 1 },
        },
        brands: medList.map((m) => m.brand),
        isHeatDay: symList.includes("very_hot_weather"),
        timestamp: new Date().toISOString(),
      };

      const result = evaluate(checkInput);
      const appFlag: BinaryLabel =
        result.urgency === "GO_TO_HEALTH_FACILITY_NOW" ||
        result.urgency === "ASK_DOCTOR_TODAY"
          ? "yes"
          : "no";

      const r1: BinaryLabel = rowObj["reviewer_1"]?.toLowerCase() === "yes" ? "yes" : "no";
      const r2: BinaryLabel = rowObj["reviewer_2"]?.toLowerCase() === "yes" ? "yes" : "no";
      const r3: BinaryLabel = rowObj["reviewer_3"]?.toLowerCase() === "yes" ? "yes" : "no";

      const majority = majorityLabel([r1, r2, r3]);

      predictions.push({ id: caseId, predicted: appFlag, actual: majority });
      appList.push(appFlag);
      r1List.push(r1);
      r2List.push(r2);
      r3List.push(r3);

      rows.push({ id: caseId, appFlag, majorityActual: majority, r1, r2, r3 });
    }

    const metrics = computeBinaryMetrics(predictions);
    setVignetteMetrics(metrics);
    setEvaluationRows(rows);

    // Compute Cohen's kappa
    const appVsR1 = computeInterRaterKappa(appList.map((a, idx) => ({ labelA: a, labelB: r1List[idx] }))).kappa;
    const appVsR2 = computeInterRaterKappa(appList.map((a, idx) => ({ labelA: a, labelB: r2List[idx] }))).kappa;
    const appVsR3 = computeInterRaterKappa(appList.map((a, idx) => ({ labelA: a, labelB: r3List[idx] }))).kappa;
    const interRater = computeInterRaterKappa(r1List.map((r, idx) => ({ labelA: r, labelB: r2List[idx] }))).kappa;

    setRaterKappas({ appVsR1, appVsR2, appVsR3, interRater });
  }

  function handleLoadTemplate() {
    setVignetteCsv(SAMPLE_VIGNETTES_CSV);
    runVignetteEvaluation(SAMPLE_VIGNETTES_CSV);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setVignetteCsv(text);
      runVignetteEvaluation(text);
    };
    reader.readAsText(file);
  }

  function handleExportVignetteResults() {
    if (!vignetteMetrics) return;
    let csv = "Case_ID,App_Decision,Reviewer_Majority,Reviewer_1,Reviewer_2,Reviewer_3,Match\n";
    for (const r of evaluationRows) {
      csv += `${r.id},${r.appFlag},${r.majorityActual},${r.r1},${r.r2},${r.r3},${r.appFlag === r.majorityActual ? "PASS" : "FAIL"}\n`;
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vignette-evaluation-results-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Brand Mapping Evaluation ───────────────────────────────────────────────
  function handleEvaluateBrandMapping() {
    if (!brandCsv.trim()) return;
    const lines = brandCsv.trim().split("\n");
    const pairs: Array<{ brand: string; predictedClass: string; actualClass: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const [brand, predicted, groundTruth] = line.split(",").map((s) => s.trim());
      if (brand && groundTruth) {
        pairs.push({
          brand,
          predictedClass: predicted || "unknown",
          actualClass: groundTruth,
        });
      }
    }

    const bMetrics = computeBrandMappingMetrics(pairs);
    setBrandMetrics(bMetrics);
  }

  // ─── Speech Extraction Evaluation ───────────────────────────────────────────
  async function handleEvaluateSpeech() {
    if (!speechTranscript.trim() || !speechGroundTruth.trim()) return;
    setIsEvaluatingSpeech(true);

    try {
      const res = await fetch("/api/parse-symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: speechTranscript, language: lang }),
      });

      if (!res.ok) throw new Error("API call failed");
      const parsedData = await res.json();
      const groundTruthObj = JSON.parse(speechGroundTruth);

      const rows = [
        {
          field: "symptoms",
          predicted: (parsedData.symptoms?.value ?? []).join(","),
          actual: (groundTruthObj.symptoms ?? []).join(","),
        },
        {
          field: "durationDays",
          predicted: String(parsedData.durationDays?.value ?? ""),
          actual: String(groundTruthObj.durationDays ?? ""),
        },
        {
          field: "ableToDrinkFluids",
          predicted: String(parsedData.ableToDrinkFluids?.value ?? ""),
          actual: String(groundTruthObj.ableToDrinkFluids ?? ""),
        },
        {
          field: "urinePastEightHours",
          predicted: String(parsedData.urinePastEightHours?.value ?? ""),
          actual: String(groundTruthObj.urinePastEightHours ?? ""),
        },
      ];
      const sMetrics = computeSpeechMetrics(rows);
      setSpeechTestOutput(sMetrics);
    } catch {
      alert("Error parsing speech or invalid ground truth JSON.");
    } finally {
      setIsEvaluatingSpeech(false);
    }
  }

  return (
    <div className="page-content" style={{ paddingBottom: "5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-primary-dark)" }}>
          📊 {t("navEvaluate", lang)} — Evaluation Harness
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
          ক্লিনিক্যাল ভিনিয়েট, ব্র্যান্ড ম্যাপিং এবং স্পিচ পার্সিং পারফরম্যান্স মূল্যায়ন (Safety & Accuracy Validation).
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          type="button"
          onClick={() => setActiveTab("vignettes")}
          className={`btn ${activeTab === "vignettes" ? "btn-primary" : "btn-secondary"}`}
          style={{ fontSize: "0.85rem", padding: "0.4rem" }}
        >
          📄 ভিনিয়েট টেস্ট (Vignettes)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("brands")}
          className={`btn ${activeTab === "brands" ? "btn-primary" : "btn-secondary"}`}
          style={{ fontSize: "0.85rem", padding: "0.4rem" }}
        >
          💊 ব্র্যান্ড ম্যাপিং (Brands)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("speech")}
          className={`btn ${activeTab === "speech" ? "btn-primary" : "btn-secondary"}`}
          style={{ fontSize: "0.85rem", padding: "0.4rem" }}
        >
          🎙️ ভয়েস নির্ভুলতা (Speech)
        </button>
      </div>

      {/* ────────────────── TAB 1: VIGNETTES ────────────────── */}
      {activeTab === "vignettes" && (
        <div>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                ক্লিনিক্যাল ভিনিয়েট CSV আপলোড (Upload Vignette CSV):
              </span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ minHeight: 28, padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                  onClick={handleLoadTemplate}
                >
                  🧪 নমুনা টেমপ্লেট লোড করুন (Sample CSV)
                </button>
                <label
                  className="btn btn-primary"
                  style={{ minHeight: 28, padding: "0.2rem 0.5rem", fontSize: "0.75rem", cursor: "pointer" }}
                >
                  📁 CSV ফাইল আপলোড
                  <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} />
                </label>
              </div>
            </div>

            <textarea
              className="input"
              rows={4}
              value={vignetteCsv}
              onChange={(e) => {
                setVignetteCsv(e.target.value);
                runVignetteEvaluation(e.target.value);
              }}
              placeholder="Paste or upload CSV with columns: case_id, age_band, pregnant, kidney_disease, symptoms, medicines, reviewer_1, reviewer_2, reviewer_3..."
              style={{ fontFamily: "monospace", fontSize: "0.75rem" }}
            />
          </div>

          {/* Non-negotiable rule #5 empty state */}
          {!vignetteMetrics ? (
            <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
              <span style={{ fontSize: "2rem" }}>📊</span>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "0.5rem" }}>No data yet.</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                মূল্যায়ন মেট্রিক্স কেবলমাত্র আপনার আপলোড করা ডেটা থেকেই হিসাব করা হয়। ওপরের "নমুনা টেমপ্লেট লোড করুন" বোতাম চাপুন।
              </p>
            </div>
          ) : (
            <div>
              {/* Metrics Summary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div className="card" style={{ borderLeft: "4px solid var(--color-primary)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700 }}>
                    SENSITIVITY (RECALL)
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--color-primary-dark)" }}>
                    {formatMetricPercent(vignetteMetrics.sensitivity)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                    TP: {vignetteMetrics.confusionMatrix.tp} / (TP+FN:{" "}
                    {vignetteMetrics.confusionMatrix.tp + vignetteMetrics.confusionMatrix.fn})
                  </div>
                </div>

                <div className="card" style={{ borderLeft: "4px solid #10b981" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700 }}>
                    SPECIFICITY
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#065f46" }}>
                    {formatMetricPercent(vignetteMetrics.specificity)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                    TN: {vignetteMetrics.confusionMatrix.tn} / (TN+FP:{" "}
                    {vignetteMetrics.confusionMatrix.tn + vignetteMetrics.confusionMatrix.fp})
                  </div>
                </div>

                <div className="card" style={{ borderLeft: "4px solid #3b82f6" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700 }}>
                    OVERALL ACCURACY
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1e40af" }}>
                    {formatMetricPercent(vignetteMetrics.accuracy)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                    N = {vignetteMetrics.n} cases evaluated
                  </div>
                </div>

                <div className="card" style={{ borderLeft: "4px solid #7c3aed" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700 }}>
                    COHEN'S KAPPA (App vs Majority)
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#5b21b6" }}>
                    {vignetteMetrics.kappa != null ? vignetteMetrics.kappa.toFixed(3) : "N/A"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                    Inter-rater: {raterKappas?.interRater != null ? raterKappas.interRater.toFixed(3) : "N/A"}
                  </div>
                </div>
              </div>

              {/* Missed Urgent Cases Alert (Rule #6 critical) */}
              {vignetteMetrics.missedUrgentCases.length > 0 ? (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "2px solid var(--color-danger)",
                    borderRadius: "var(--radius)",
                    padding: "0.75rem 1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div style={{ fontWeight: 800, color: "var(--color-danger-dark)", fontSize: "0.95rem" }}>
                    🚨 MISSED URGENT CASES ({vignetteMetrics.missedUrgentCases.length}):
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "#991b1b", marginTop: "2px" }}>
                    এগুলি হল False Negatives (FN), যেখানে পর্যালোচকগণ রেফারেল চিহ্নিত করেছিলেন কিন্তু ইঞ্জিন পতাকাঙ্কিত করেনি:
                  </p>
                  <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem" }}>
                    {vignetteMetrics.missedUrgentCases.map((id) => (
                      <span
                        key={id}
                        style={{
                          background: "white",
                          border: "1px solid #f87171",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          color: "#b91c1c",
                        }}
                      >
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1.5px solid #86efac",
                    borderRadius: "var(--radius)",
                    padding: "0.75rem 1rem",
                    marginBottom: "1rem",
                    color: "#166534",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                  }}
                >
                  ✓ Zero missed urgent cases in this evaluation dataset (0 False Negatives).
                </div>
              )}

              {/* Confusion Matrix Table */}
              <div className="card" style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  Confusion Matrix (কনফিউশন ম্যাট্রিক্স):
                </h3>
                <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse", textAlign: "center" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "6px", border: "1px solid #e2e8f0" }}></th>
                      <th style={{ padding: "6px", border: "1px solid #e2e8f0" }}>Actual Positive (Yes)</th>
                      <th style={{ padding: "6px", border: "1px solid #e2e8f0" }}>Actual Negative (No)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 700, padding: "6px", border: "1px solid #e2e8f0" }}>App: Yes</td>
                      <td style={{ background: "#d1fae5", fontWeight: 800, padding: "6px", border: "1px solid #e2e8f0" }}>
                        TP = {vignetteMetrics.confusionMatrix.tp}
                      </td>
                      <td style={{ background: "#fee2e2", fontWeight: 800, padding: "6px", border: "1px solid #e2e8f0" }}>
                        FP = {vignetteMetrics.confusionMatrix.fp}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, padding: "6px", border: "1px solid #e2e8f0" }}>App: No</td>
                      <td style={{ background: "#fee2e2", fontWeight: 800, padding: "6px", border: "1px solid #e2e8f0" }}>
                        FN = {vignetteMetrics.confusionMatrix.fn}
                      </td>
                      <td style={{ background: "#d1fae5", fontWeight: 800, padding: "6px", border: "1px solid #e2e8f0" }}>
                        TN = {vignetteMetrics.confusionMatrix.tn}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Export Results */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-secondary btn-full" onClick={handleExportVignetteResults}>
                  📥 ভিনিয়েট মূল্যায়ন ফলাফল CSV ডাউনলোড (Export CSV)
                </button>
                <button className="btn btn-primary btn-full" onClick={() => window.print()}>
                  🖨️ সংক্ষিপ্ত প্রতিবেদন প্রিন্ট (Print Summary)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────── TAB 2: BRAND MAPPING ────────────────── */}
      {activeTab === "brands" && (
        <div>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <span style={{ fontWeight: 700, fontSize: "0.95rem", display: "block", marginBottom: "0.5rem" }}>
              ফার্মাসিস্ট গ্রাউন্ড-ট্রুথ বনাম AI ড্রাগ ক্লাস মূল্যায়ন:
            </span>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
              Enter CSV with format: <code>brand, predicted_class, ground_truth_class</code>
            </p>

            <textarea
              className="input"
              rows={4}
              value={brandCsv}
              onChange={(e) => setBrandCsv(e.target.value)}
              placeholder={`brand,predicted_class,ground_truth_class
Envas,ace_inhibitor,ace_inhibitor
Losar,arb,arb
Glycomet,metformin,metformin
UnknownBrand,unknown,sulfonylurea`}
              style={{ fontFamily: "monospace", fontSize: "0.75rem" }}
            />

            <button
              className="btn btn-primary"
              style={{ marginTop: "0.5rem" }}
              onClick={handleEvaluateBrandMapping}
            >
              ব্র্যান্ড ম্যাপিং মেট্রিক্স বিশ্লেষণ করুন ➔
            </button>
          </div>

          {!brandMetrics ? (
            <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>No data yet.</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                ওপরে ব্র্যান্ড এবং গ্রাউন্ড-ট্রুথ ডেটা লিখে বোতাম চাপুন।
              </p>
            </div>
          ) : (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontWeight: 700 }}>Overall Accuracy:</span>
                <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-primary-dark)" }}>
                  {formatMetricPercent(brandMetrics.overallAccuracy)}
                </span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                Total evaluated: {brandMetrics.n} brands.
              </p>

              {brandMetrics.errors.length > 0 && (
                <div style={{ marginTop: "0.75rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-danger)" }}>
                    Errors List ({brandMetrics.errors.length}):
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                    {brandMetrics.errors.map((err, i) => (
                      <div key={i} style={{ fontSize: "0.75rem", background: "#fef2f2", padding: "4px 8px", borderRadius: 4 }}>
                        <strong>{err.brand}</strong>: predicted "{err.predictedClass}" but ground truth is "{err.actualClass}".
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ────────────────── TAB 3: SPEECH EXTRACTION ────────────────── */}
      {activeTab === "speech" && (
        <div>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>
              কথার প্রতিলিপি (Spoken Transcript):
            </label>
            <textarea
              className="input"
              rows={2}
              value={speechTranscript}
              onChange={(e) => setSpeechTranscript(e.target.value)}
              placeholder="e.g. কাল থেকে পেট খারাপ ও বমি হচ্ছে, জল খেতে পারছে কিন্তু প্রস্রাব কম..."
            />

            <label style={{ fontSize: "0.85rem", fontWeight: 700, display: "block", marginTop: "0.75rem", marginBottom: "0.3rem" }}>
              প্রকৃত প্রত্যাশিত ফলাফল (Ground Truth JSON):
            </label>
            <textarea
              className="input"
              rows={3}
              value={speechGroundTruth}
              onChange={(e) => setSpeechGroundTruth(e.target.value)}
              style={{ fontFamily: "monospace", fontSize: "0.75rem" }}
            />

            <button
              className="btn btn-primary"
              style={{ marginTop: "0.75rem" }}
              disabled={isEvaluatingSpeech}
              onClick={handleEvaluateSpeech}
            >
              {isEvaluatingSpeech ? "বিশ্লেষণ হচ্ছে..." : "স্পিচ নির্ভুলতা পরিমাপ করুন ➔"}
            </button>
          </div>

          {!speechTestOutput ? (
            <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>No data yet.</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                কথোপকথন ও প্রত্যাশিত JSON প্রদান করে মেট্রিক্স পরিমাপ করুন।
              </p>
            </div>
          ) : (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontWeight: 700 }}>Field Accuracy:</span>
                <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-primary-dark)" }}>
                  {formatMetricPercent(speechTestOutput.overallAccuracy)}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.8rem", marginTop: "0.5rem" }}>
                {Object.entries(speechTestOutput.perField).map(([field, item]) => (
                  <div key={field} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{field}:</span>
                    <span style={{ fontWeight: 700 }}>{formatMetricPercent(item.accuracy)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
