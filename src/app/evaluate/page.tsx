"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { t, getLanguage, formatNumber, type Lang } from "@/lib/i18n";
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
import { getDemoStore, generateInitialDemoStore } from "@/lib/demo";

export default function EvaluatePage() {
  const [lang, setLang] = useState<Lang>("bn");
  const [activeTab, setActiveTab] = useState<"vignettes" | "brands" | "speech">("vignettes");

  // Vignette state
  const [vignetteCsv, setVignetteCsv] = useState<string>("");
  const [isDemoVignettes, setIsDemoVignettes] = useState<boolean>(false);
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
    // Auto-load demo vignettes on first render for presentation readiness
    handleLoadDemoVignettes();

    const handleLangChange = () => setLang(getLanguage());
    window.addEventListener("ap-lang-change", handleLangChange);
    return () => window.removeEventListener("ap-lang-change", handleLangChange);
  }, []);

  function handleLoadDemoVignettes() {
    const store = getDemoStore() || generateInitialDemoStore();
    setVignetteCsv(store.vignettesCSV);
    setIsDemoVignettes(true);
    runVignetteEvaluation(store.vignettesCSV);
  }

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

      const caseId = rowObj["vignette_id"] || rowObj["case_id"] || `VIG-${i}`;
      const ageBand = (rowObj["patient_age_band"] || rowObj["age_band"] || "adult") as AgeBand;
      const pregnant = (rowObj["pregnant"] || "").toLowerCase() === "yes" || (rowObj["illness"] || "").includes("pregnant");
      const kidneyDisease = (rowObj["kidney_disease"] || "").toLowerCase() === "yes";

      // Parse symptoms
      const illnessCol = (rowObj["illness"] || rowObj["symptoms"] || "none").toLowerCase();
      const symptomsList: IllnessSymptom[] = [];
      if (illnessCol.includes("loose_motions")) symptomsList.push("loose_motions");
      if (illnessCol.includes("vomiting")) symptomsList.push("vomiting");
      if (illnessCol.includes("fever")) symptomsList.push("fever");
      if (illnessCol.includes("not_eating")) symptomsList.push("not_eating_drinking");
      if (illnessCol.includes("hot_weather") || illnessCol.includes("very_hot_weather")) symptomsList.push("very_hot_weather");
      if (symptomsList.length === 0) symptomsList.push("none");

      // Check red flags
      const noUrine = illnessCol.includes("no_urine_8h") || illnessCol.includes("anuria");
      const dizzy = illnessCol.includes("dizziness");
      const confusion = illnessCol.includes("confusion");
      const chestPain = illnessCol.includes("chest_pain");

      // Parse medicines
      const brand = rowObj["brand_name"] || rowObj["medicines"] || "Paracetamol";
      const drugClass = (rowObj["class"] || "other") as DrugClass;

      const checkInput: CheckInput = {
        patient: {
          token: caseId,
          ageBand,
          pregnant,
          knownKidneyDisease: kidneyDisease,
          createdAt: new Date().toISOString(),
        },
        symptoms: {
          symptoms: { value: symptomsList, confidence: 1 },
          durationDays: { value: 2, confidence: 1 },
          ableToDrinkFluids: { value: true, confidence: 1 },
          urinePastEightHours: { value: !noUrine, confidence: 1 },
          dizziness: { value: dizzy, confidence: 1 },
          confusion: { value: confusion, confidence: 1 },
          bloodInStool: { value: false, confidence: 1 },
          chestPain: { value: chestPain, confidence: 1 },
          cannotKeepFluids: { value: false, confidence: 1 },
        },
        brands: [brand],
        isHeatDay: symptomsList.includes("very_hot_weather"),
        timestamp: new Date().toISOString(),
      };

      const result = evaluate(checkInput);
      const appFlag: BinaryLabel = result.urgency === "NO_FLAG" ? "no" : "yes";

      const r1Raw = (rowObj["reviewer_1_flag"] || rowObj["reviewer_1"] || "NO_FLAG").toUpperCase();
      const r2Raw = (rowObj["reviewer_2_flag"] || rowObj["reviewer_2"] || "NO_FLAG").toUpperCase();
      const r3Raw = (rowObj["reviewer_3_flag"] || rowObj["reviewer_3"] || "NO_FLAG").toUpperCase();

      const r1: BinaryLabel = r1Raw === "NO_FLAG" || r1Raw === "NO" ? "no" : "yes";
      const r2: BinaryLabel = r2Raw === "NO_FLAG" || r2Raw === "NO" ? "no" : "yes";
      const r3: BinaryLabel = r3Raw === "NO_FLAG" || r3Raw === "NO" ? "no" : "yes";

      const majority = majorityLabel([r1, r2, r3]);

      predictions.push({ id: caseId, predicted: appFlag, actual: majority });
      r1List.push(r1);
      r2List.push(r2);
      r3List.push(r3);
      appList.push(appFlag);

      rows.push({
        id: caseId,
        appFlag,
        majorityActual: majority,
        r1,
        r2,
        r3,
      });
    }

    const metrics = computeBinaryMetrics(predictions);
    setVignetteMetrics(metrics);
    setEvaluationRows(rows);

    const pairsAppVsR1 = appList.map((a, i) => ({ labelA: a, labelB: r1List[i] }));
    const pairsAppVsR2 = appList.map((a, i) => ({ labelA: a, labelB: r2List[i] }));
    const pairsAppVsR3 = appList.map((a, i) => ({ labelA: a, labelB: r3List[i] }));
    const pairsInterRater = r1List.map((r, i) => ({ labelA: r, labelB: r2List[i] }));

    const kAppVsR1 = computeInterRaterKappa(pairsAppVsR1).kappa;
    const kAppVsR2 = computeInterRaterKappa(pairsAppVsR2).kappa;
    const kAppVsR3 = computeInterRaterKappa(pairsAppVsR3).kappa;
    const kInterRater = computeInterRaterKappa(pairsInterRater).kappa;

    setRaterKappas({
      appVsR1: kAppVsR1,
      appVsR2: kAppVsR2,
      appVsR3: kAppVsR3,
      interRater: kInterRater,
    });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setVignetteCsv(text);
      setIsDemoVignettes(false);
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
          📊 {t("evaluatePageTitle", lang)}
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
          {t("evaluatePageSubtitle", lang)}
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
          📄 {t("importVignettes", lang)}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("brands")}
          className={`btn ${activeTab === "brands" ? "btn-primary" : "btn-secondary"}`}
          style={{ fontSize: "0.85rem", padding: "0.4rem" }}
        >
          💊 {t("reviewTabBrands", { count: "" }, lang).trim()}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("speech")}
          className={`btn ${activeTab === "speech" ? "btn-primary" : "btn-secondary"}`}
          style={{ fontSize: "0.85rem", padding: "0.4rem" }}
        >
          🎙️ {t("stepSymptomsMicPrompt", lang)}
        </button>
      </div>

      {/* ────────────────── TAB 1: VIGNETTES ────────────────── */}
      {activeTab === "vignettes" && (
        <div>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                {t("importVignettes", lang)}:
              </span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ minHeight: 28, padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                  onClick={handleLoadDemoVignettes}
                >
                  🧪 {t("loadDemoVignettesBtn", lang)}
                </button>
                <label
                  className="btn btn-primary"
                  style={{ minHeight: 28, padding: "0.2rem 0.5rem", fontSize: "0.75rem", cursor: "pointer" }}
                >
                  📁 CSV
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
                setIsDemoVignettes(false);
                runVignetteEvaluation(e.target.value);
              }}
              placeholder="vignette_id, patient_age_band, illness, brand_name, class, reviewer_1_flag, reviewer_2_flag, reviewer_3_flag, gold_flag, model_flag..."
              style={{ fontFamily: "monospace", fontSize: "0.75rem" }}
            />
          </div>

          {/* Persistent badge when computed from demo vignettes */}
          {isDemoVignettes && vignetteMetrics && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1.5px solid #86efac",
                color: "#166534",
                padding: "0.5rem 0.75rem",
                borderRadius: 8,
                fontSize: "0.85rem",
                fontWeight: 700,
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>🧪</span>
              <span>{t("demoVignettesComputed", lang)}</span>
            </div>
          )}

          {!vignetteMetrics ? (
            <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
              <span style={{ fontSize: "2rem" }}>📊</span>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
                {t("noDataYet", lang)}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: "1rem", fontSize: "0.85rem" }}
                onClick={handleLoadDemoVignettes}
              >
                🧪 {t("loadDemoVignettesBtn", lang)}
              </button>
            </div>
          ) : (
            <div>
              {/* Metrics Summary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div className="card" style={{ borderLeft: "4px solid var(--color-primary)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700 }}>
                    {t("sensitivityLabel", lang)}
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
                    {t("specificityLabel", lang)}
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#065f46" }}>
                    {formatMetricPercent(vignetteMetrics.specificity)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                    TN: {vignetteMetrics.confusionMatrix.tn} / (TN+FP:{" "}
                    {vignetteMetrics.confusionMatrix.tn + vignetteMetrics.confusionMatrix.fp})
                  </div>
                </div>

                <div className="card" style={{ borderLeft: "4px solid #f59e0b" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700 }}>
                    {t("ppvLabel", lang)}
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#b45309" }}>
                    {formatMetricPercent(vignetteMetrics.ppv)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                    TP: {vignetteMetrics.confusionMatrix.tp} / (TP+FP:{" "}
                    {vignetteMetrics.confusionMatrix.tp + vignetteMetrics.confusionMatrix.fp})
                  </div>
                </div>

                <div className="card" style={{ borderLeft: "4px solid #8b5cf6" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700 }}>
                    {t("kappaLabel", lang)}
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#6d28d9" }}>
                    {raterKappas?.appVsR1 !== null && raterKappas?.appVsR1 !== undefined
                      ? raterKappas.appVsR1.toFixed(3)
                      : "—"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                    Inter-Rater: {raterKappas?.interRater?.toFixed(3) ?? "—"}
                  </div>
                </div>
              </div>

              {/* Missed Urgent Cases Banner */}
              <div
                style={{
                  background: vignetteMetrics.confusionMatrix.fn === 0 ? "#f0fdf4" : "#fee2e2",
                  border: `1.5px solid ${vignetteMetrics.confusionMatrix.fn === 0 ? "#86efac" : "#fca5a5"}`,
                  borderRadius: 10,
                  padding: "0.75rem 1rem",
                  marginBottom: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontWeight: 800, color: vignetteMetrics.confusionMatrix.fn === 0 ? "#166534" : "#991b1b" }}>
                    {t("missedUrgent", { count: vignetteMetrics.confusionMatrix.fn, total: evaluationRows.length }, lang)}
                  </span>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                    {vignetteMetrics.confusionMatrix.fn === 0 ? "✓ Zero missed emergency decisions" : "⚠️ Discrepancy observed against gold standard"}
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ minHeight: 32, padding: "0.2rem 0.6rem", fontSize: "0.75rem" }}
                  onClick={handleExportVignetteResults}
                >
                  📥 {t("exportResults", lang)}
                </button>
              </div>

              {/* Detailed Vignette Result Rows */}
              <div className="card" style={{ padding: "0.5rem" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid var(--color-border)" }}>
                        <th style={{ padding: "0.5rem", textAlign: "left" }}>{t("evalTableVignetteId", lang)}</th>
                        <th style={{ padding: "0.5rem", textAlign: "center" }}>{t("evalTableEngine", lang)}</th>
                        <th style={{ padding: "0.5rem", textAlign: "center" }}>{t("evalTableGold", lang)}</th>
                        <th style={{ padding: "0.5rem", textAlign: "center" }}>{t("evalTableMatch", lang)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluationRows.map((r) => {
                        const isMatch = r.appFlag === r.majorityActual;
                        return (
                          <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "0.45rem", fontWeight: 700 }}>{r.id}</td>
                            <td style={{ padding: "0.45rem", textAlign: "center" }}>
                              <span style={{
                                padding: "2px 6px",
                                borderRadius: 4,
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                background: r.appFlag === "yes" ? "#fee2e2" : "#d1fae5",
                                color: r.appFlag === "yes" ? "#991b1b" : "#065f46",
                              }}>
                                {r.appFlag.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: "0.45rem", textAlign: "center" }}>
                              <span style={{
                                padding: "2px 6px",
                                borderRadius: 4,
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                background: r.majorityActual === "yes" ? "#fee2e2" : "#d1fae5",
                                color: r.majorityActual === "yes" ? "#991b1b" : "#065f46",
                              }}>
                                {r.majorityActual.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: "0.45rem", textAlign: "center", fontWeight: 800 }}>
                              {isMatch ? "✓ PASS" : "✗ MISMATCH"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────── TAB 2: BRAND MAPPING ────────────────── */}
      {activeTab === "brands" && (
        <div className="card">
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--color-primary-dark)" }}>
            {t("reviewTabBrands", { count: "" }, lang).trim()}
          </h3>
          <textarea
            className="input"
            rows={4}
            value={brandCsv}
            onChange={(e) => setBrandCsv(e.target.value)}
            placeholder="brand,predicted_class,gold_standard_class..."
            style={{ fontFamily: "monospace", fontSize: "0.75rem", marginBottom: "0.5rem" }}
          />
          <button className="btn btn-primary" onClick={handleEvaluateBrandMapping}>
            {t("runEvaluation", lang)}
          </button>

          {brandMetrics && (
            <div style={{ marginTop: "1rem" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                Accuracy: {formatMetricPercent(brandMetrics.overallAccuracy)} (N = {brandMetrics.n})
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────── TAB 3: SPEECH ACCURACY ────────────────── */}
      {activeTab === "speech" && (
        <div className="card">
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--color-primary-dark)" }}>
            {t("stepSymptomsMicPrompt", lang)}
          </h3>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t("audioTranscriptLabel", lang)}</label>
            <input
              type="text"
              className="input"
              value={speechTranscript}
              onChange={(e) => setSpeechTranscript(e.target.value)}
              placeholder="e.g. কাল থেকে পাতলা পায়খানা ও বমি হচ্ছে..."
            />
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t("groundTruthJsonLabel", lang)}</label>
            <textarea
              className="input"
              rows={3}
              value={speechGroundTruth}
              onChange={(e) => setSpeechGroundTruth(e.target.value)}
              style={{ fontFamily: "monospace", fontSize: "0.75rem" }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleEvaluateSpeech} disabled={isEvaluatingSpeech}>
            {isEvaluatingSpeech ? t("loading", lang) : t("runEvaluation", lang)}
          </button>

          {speechTestOutput && (
            <div style={{ marginTop: "1rem" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                Exact Match Ratio: {formatMetricPercent(speechTestOutput.overallAccuracy)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
