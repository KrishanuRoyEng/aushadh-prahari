"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { t, getLanguage, type Lang } from "@/lib/i18n";
import { readAloud } from "@/lib/speech";
import { generatePatientToken, getMOPhone } from "@/lib/privacy";
import {
  saveCheck,
  savePatient,
  getAllPatients,
  enqueue,
  savePendingReview,
  type CheckRecord,
} from "@/lib/db";
import { searchBrands, lookupBrand } from "@/lib/brands";
import { evaluate, SAFETY_DISCLAIMER } from "@/lib/rules";
import { buildMOMessage, type BuiltMessage } from "@/lib/message";
import type {
  Patient,
  AgeBand,
  CheckInput,
  CheckResult,
  ParsedSymptoms,
  IllnessSymptom,
  DrugClass,
  BrandEntry,
} from "@/lib/schemas";
import { startRecognition, type RecognitionHandle } from "@/lib/speech";

const ALL_SYMPTOMS: { id: IllnessSymptom; icon: string; labelKey: string }[] = [
  { id: "loose_motions", icon: "💧", labelKey: "symptomLooseMotions" },
  { id: "vomiting", icon: "🤮", labelKey: "symptomVomiting" },
  { id: "fever", icon: "🤒", labelKey: "symptomFever" },
  { id: "not_eating_drinking", icon: "🚫", labelKey: "symptomNotEating" },
  { id: "very_hot_weather", icon: "☀️", labelKey: "symptomHotWeather" },
  { id: "none", icon: "✓", labelKey: "symptomNone" },
];

const ALL_DRUG_CLASSES: { id: DrugClass; label: string }[] = [
  { id: "ace_inhibitor", label: "ACE Inhibitor (e.g. Enalapril, Ramipril)" },
  { id: "arb", label: "ARB (e.g. Losartan, Telmisartan)" },
  { id: "diuretic_loop", label: "Loop Diuretic (e.g. Furosemide)" },
  { id: "diuretic_thiazide", label: "Thiazide Diuretic (e.g. Hydrochlorothiazide, Chlorthalidone)" },
  { id: "sglt2_inhibitor", label: "SGLT2 Inhibitor (e.g. Dapagliflozin, Empagliflozin)" },
  { id: "metformin", label: "Metformin" },
  { id: "sulfonylurea", label: "Sulfonylurea (e.g. Glimepiride, Gliclazide)" },
  { id: "nsaid", label: "NSAID (e.g. Ibuprofen, Diclofenac)" },
  { id: "other", label: "Other / Unflagged" },
  { id: "unknown", label: "Unknown class" },
];

export default function CheckPage() {
  const [lang, setLang] = useState<Lang>("bn");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Patient State
  const [savedPatients, setSavedPatients] = useState<Patient[]>([]);
  const [patientToken, setPatientToken] = useState("");
  const [ageBand, setAgeBand] = useState<AgeBand>("adult");
  const [pregnant, setPregnant] = useState(false);
  const [kidneyDisease, setKidneyDisease] = useState(false);
  const [creatinine, setCreatinine] = useState<string>("");
  const [egfr, setEgfr] = useState<string>("");
  const [livesAlone, setLivesAlone] = useState(false);
  const [worksOutdoors, setWorksOutdoors] = useState(false);

  // Step 2: Symptoms State
  const [selectedSymptoms, setSelectedSymptoms] = useState<IllnessSymptom[]>([]);
  const [durationDays, setDurationDays] = useState<number>(1);
  const [ableToDrink, setAbleToDrink] = useState<boolean>(true);
  const [urine8h, setUrine8h] = useState<boolean | null>(true);
  const [dizziness, setDizziness] = useState<boolean>(false);
  const [confusion, setConfusion] = useState<boolean>(false);
  const [bloodInStool, setBloodInStool] = useState<boolean>(false);
  const [chestPain, setChestPain] = useState<boolean>(false);
  const [cannotKeepFluids, setCannotKeepFluids] = useState<boolean>(false);

  // Voice recognition & AI transcript parse
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isParsingVoice, setIsParsingVoice] = useState(false);
  const [voiceParsedData, setVoiceParsedData] = useState<ParsedSymptoms | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Step 3: Medicines State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BrandEntry[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<{
    brand: string;
    classes: DrugClass[];
    signedOff: boolean;
    source: string;
    isCustom?: boolean;
    pendingReview?: boolean;
  }[]>([]);
  const [customBrandName, setCustomBrandName] = useState("");
  const [customDrugClass, setCustomDrugClass] = useState<DrugClass>("unknown");
  const [isSuggestingClass, setIsSuggestingClass] = useState(false);
  const [suggestNotice, setSuggestNotice] = useState<string | null>(null);

  // Step 4: Result State
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [builtMessage, setBuiltMessage] = useState<BuiltMessage | null>(null);
  const [expandedWhy, setExpandedWhy] = useState<Record<string, boolean>>({});
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    setLang(getLanguage());
    setPatientToken(generatePatientToken());
    getAllPatients().then((pts) => setSavedPatients(pts)).catch(() => {});
  }, []);

  // Filter brands when user types
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setSearchResults(searchBrands(searchQuery));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Read aloud helper for current screen
  function handleReadAloud(text: string) {
    readAloud(text, lang);
  }

  // Pick an existing patient
  function handleSelectExistingPatient(p: Patient) {
    setPatientToken(p.token);
    setAgeBand(p.ageBand);
    setPregnant(p.pregnant ?? false);
    setKidneyDisease(p.knownKidneyDisease ?? p.kidneyDisease ?? false);
    setCreatinine(p.latestCreatinine ? String(p.latestCreatinine) : "");
    setEgfr(p.latestEGFR ? String(p.latestEGFR) : "");
    setLivesAlone(p.livesAlone ?? false);
    setWorksOutdoors(p.worksOutdoors ?? false);

    // Pre-populate chronic medicines if present
    if (p.chronicMedicines && p.chronicMedicines.length > 0) {
      const meds = p.chronicMedicines.map((m) => {
        const found = lookupBrand(m.brand);
        return {
          brand: m.brand,
          classes: m.classes,
          signedOff: found?.signedOff ?? false,
          source: found?.source ?? "Saved in patient profile",
        };
      });
      setSelectedBrands(meds);
    }
  }

  // Step 1 Validation & Proceed
  function handleStep1Next() {
    if (!patientToken.trim()) {
      setPatientToken(generatePatientToken());
    }
    setStep(2);
    handleReadAloud(t("stepSymptoms", lang));
  }

  // Toggle symptom button
  function toggleSymptom(s: IllnessSymptom) {
    if (s === "none") {
      setSelectedSymptoms(["none"]);
      return;
    }
    const filtered = selectedSymptoms.filter((item) => item !== "none");
    if (filtered.includes(s)) {
      setSelectedSymptoms(filtered.filter((item) => item !== s));
    } else {
      setSelectedSymptoms([...filtered, s]);
    }
  }

  // Voice transcript recording & AI parsing
  function handleStartListening() {
    setVoiceNotice(null);
    setTranscript("");
    setIsListening(true);

    const handle: RecognitionHandle | null = startRecognition(
      lang,
      (text, isFinal) => {
        setTranscript(text);
        if (isFinal) {
          setIsListening(false);
          parseTranscriptWithAI(text);
        }
      },
      (err) => {
        setIsListening(false);
        setVoiceNotice(`Speech error: ${err}`);
      },
      () => {
        setIsListening(false);
      }
    );

    if (!handle) {
      setIsListening(false);
      setVoiceNotice("Voice recognition is not supported in this browser. Please use manual entry.");
    }
  }

  async function parseTranscriptWithAI(text: string) {
    if (!text.trim()) return;
    setIsParsingVoice(true);
    setVoiceNotice(null);

    try {
      const res = await fetch("/api/parse-symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, language: lang }),
      });

      if (!res.ok) {
        throw new Error("Failed to parse symptoms from voice.");
      }

      const data: ParsedSymptoms = await res.json();
      setVoiceParsedData(data);

      // Auto-populate fields from parsed symptoms
      if (data.symptoms?.value?.length > 0) {
        setSelectedSymptoms(data.symptoms.value);
      }
      if (data.durationDays?.value != null) {
        setDurationDays(data.durationDays.value);
      }
      if (data.ableToDrinkFluids?.value != null) {
        setAbleToDrink(data.ableToDrinkFluids.value);
      }
      if (data.urinePastEightHours?.value !== undefined) {
        setUrine8h(data.urinePastEightHours.value);
      }
      if (data.dizziness?.value != null) {
        setDizziness(data.dizziness.value);
      }
      if (data.confusion?.value != null) {
        setConfusion(data.confusion.value);
      }
      if (data.bloodInStool?.value != null) {
        setBloodInStool(data.bloodInStool.value);
      }
      if (data.chestPain?.value != null) {
        setChestPain(data.chestPain.value);
      }
      if (data.cannotKeepFluids?.value != null) {
        setCannotKeepFluids(data.cannotKeepFluids.value);
      }

      setVoiceNotice("Voice transcript parsed. Please review and confirm below.");
    } catch {
      setVoiceNotice("Could not reach AI parser (offline or no key). Degraded to manual selection.");
    } finally {
      setIsParsingVoice(false);
    }
  }

  // Step 2 Validation & Proceed
  function handleStep2Next() {
    if (selectedSymptoms.length === 0) {
      setSelectedSymptoms(["none"]);
    }
    setStep(3);
    handleReadAloud(t("stepMedicines", lang));
  }

  // Medicine brand selection
  function handleAddBrand(b: BrandEntry) {
    if (selectedBrands.some((x) => x.brand.toLowerCase() === b.brand.toLowerCase())) {
      return;
    }
    setSelectedBrands([
      ...selectedBrands,
      {
        brand: b.brand,
        classes: b.classes,
        signedOff: b.signedOff,
        source: b.source,
      },
    ]);
    setSearchQuery("");
    setSearchResults([]);
  }

  function handleRemoveBrand(idx: number) {
    setSelectedBrands(selectedBrands.filter((_, i) => i !== idx));
  }

  // Add custom or unknown brand
  function handleAddCustomBrand(cls: DrugClass, pendingReview = false) {
    if (!customBrandName.trim()) return;
    setSelectedBrands([
      ...selectedBrands,
      {
        brand: customBrandName.trim(),
        classes: [cls],
        signedOff: false,
        source: pendingReview ? "AI suggestion — pending clinician sign-off" : "Manual entry CHO",
        isCustom: true,
        pendingReview,
      },
    ]);
    setCustomBrandName("");
    setCustomDrugClass("unknown");
    setSuggestNotice(null);
  }

  // AI drug class suggestion
  async function handleAskAISuggestClass() {
    if (!customBrandName.trim()) return;
    setIsSuggestingClass(true);
    setSuggestNotice(null);

    try {
      const res = await fetch("/api/suggest-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: customBrandName.trim() }),
      });

      if (!res.ok) throw new Error("API call failed");

      const data = await res.json();
      const suggested = (data.suggestedClass as DrugClass) || "unknown";

      // Queue for pharmacist review
      await savePendingReview({
        id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: "brand_suggestion",
        brand: customBrandName.trim(),
        suggestedClass: suggested,
        confidence: data.confidence ?? 0.5,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      // NON-NEGOTIABLE SAFETY RULE:
      // Suggested class goes to review queue and is NOT used for clinical flags until approved.
      // The check treats this medicine as UNKNOWN -> ASK_DOCTOR_TODAY.
      handleAddCustomBrand("unknown", true);
      setSuggestNotice(
        `AI suggested: ${suggested}. Sent to Pharmacist Review Queue. Per safety rules, this medicine is flagged as UNKNOWN until approved.`
      );
    } catch {
      setSuggestNotice("AI service unavailable. Marked as Unknown class (fails safe: ask doctor).");
      handleAddCustomBrand("unknown", false);
    } finally {
      setIsSuggestingClass(false);
    }
  }

  // Execute Rule Engine & Build Result
  async function handleRunCheck() {
    // 1. Build Patient record
    const patientObj: Patient = {
      token: patientToken.trim() || generatePatientToken(),
      ageBand,
      pregnant,
      knownKidneyDisease: kidneyDisease,
      latestCreatinine: creatinine ? parseFloat(creatinine) : undefined,
      latestEGFR: egfr ? parseFloat(egfr) : undefined,
      livesAlone,
      worksOutdoors,
      chronicMedicines: selectedBrands.map((b) => ({
        brand: b.brand,
        classes: b.classes,
        dose: "",
      })),
      createdAt: new Date().toISOString(),
    };

    // Save patient profile
    await savePatient(patientObj);

    // 2. Build Symptoms record
    const symptomsObj: ParsedSymptoms = {
      transcript: transcript || undefined,
      symptoms: { value: selectedSymptoms.length > 0 ? selectedSymptoms : ["none"], confidence: 1 },
      durationDays: { value: durationDays, confidence: 1 },
      ableToDrinkFluids: { value: ableToDrink, confidence: 1 },
      urinePastEightHours: { value: urine8h, confidence: 1 },
      dizziness: { value: dizziness, confidence: 1 },
      confusion: { value: confusion, confidence: 1 },
      bloodInStool: { value: bloodInStool, confidence: 1 },
      chestPain: { value: chestPain, confidence: 1 },
      cannotKeepFluids: { value: cannotKeepFluids, confidence: 1 },
    };

    // 3. Build Check Input
    const checkInput: CheckInput = {
      patient: patientObj,
      symptoms: symptomsObj,
      brands: selectedBrands.map((b) => b.brand),
      isHeatDay: selectedSymptoms.includes("very_hot_weather"),
      timestamp: new Date().toISOString(),
    };

    // 4. Deterministic Rule Engine Evaluation (Pure, Zero AI)
    const result = evaluate(checkInput);
    setCheckResult(result);

    // 5. Build MO Message
    const moPhone = getMOPhone();
    const built = buildMOMessage({
      patient: patientObj,
      symptoms: symptomsObj,
      result,
      isHeatDay: checkInput.isHeatDay ?? false,
      timestamp: new Date().toISOString(),
      moPhoneNumber: moPhone || undefined,
    });
    setBuiltMessage(built);

    // 6. Save check record to IndexedDB
    const checkRecord: CheckRecord = {
      id: `chk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      input: checkInput,
      result,
      createdAt: new Date().toISOString(),
    };
    await saveCheck(checkRecord);

    // 7. Enqueue in Outbox for sync
    await enqueue({
      id: `out_${checkRecord.id}`,
      type: "check",
      payload: checkRecord,
      createdAt: checkRecord.createdAt,
      synced: false,
      attempts: 0,
    });

    setStep(4);

    // Read urgency aloud
    if (result.urgency === "GO_TO_HEALTH_FACILITY_NOW") {
      handleReadAloud(t("resultUrgentBanner", lang));
    } else if (result.urgency === "ASK_DOCTOR_TODAY") {
      handleReadAloud(t("resultAskDoctorBanner", lang));
    } else {
      handleReadAloud(t("resultNoFlag", lang));
    }
  }

  function toggleWhy(brand: string) {
    setExpandedWhy((prev) => ({ ...prev, [brand]: !prev[brand] }));
  }

  async function handleCopyMessage() {
    if (!builtMessage) return;
    try {
      await navigator.clipboard.writeText(builtMessage.text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      setCopySuccess(false);
    }
  }

  return (
    <div className="page-content" style={{ paddingBottom: "5rem" }}>
      {/* Step Indicator Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>
            {step === 1 && "১. রোগী (Patient)"}
            {step === 2 && "২. লক্ষণ (Symptoms)"}
            {step === 3 && "৩. ওষুধ (Medicines)"}
            {step === 4 && "৪. ফলাফল (Decision Support)"}
          </span>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 24,
                height: 8,
                borderRadius: 4,
                background: i <= step ? "var(--color-primary)" : "var(--color-border)",
              }}
            />
          ))}
        </div>
      </div>

      {/* ────────────────── STEP 1: PATIENT PROFILE ────────────────── */}
      {step === 1 && (
        <div>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <label style={{ fontWeight: 700, color: "var(--color-text)" }}>
                {t("patientToken", lang)}:
              </label>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "0.25rem 0.5rem", minHeight: "auto", fontSize: "0.75rem" }}
                onClick={() => setPatientToken(generatePatientToken())}
              >
                🔄 নতুন কোড (New)
              </button>
            </div>
            <input
              type="text"
              className="input"
              value={patientToken}
              onChange={(e) => setPatientToken(e.target.value)}
              placeholder="e.g. AP-98214"
            />
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.4rem" }}>
              গোপনীয়তার সুরক্ষার জন্য কোনো আসল নাম সংরক্ষণ করা হয় না। (No real names stored).
            </p>

            {/* Quick selector for existing patients */}
            {savedPatients.length > 0 && (
              <div style={{ marginTop: "0.75rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                  সংরক্ষিত রোগী বাছুন (Or pick saved patient):
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.3rem" }}>
                  {savedPatients.slice(0, 5).map((p) => (
                    <button
                      key={p.token}
                      type="button"
                      onClick={() => handleSelectExistingPatient(p)}
                      style={{
                        padding: "0.3rem 0.6rem",
                        borderRadius: 6,
                        border: "1px solid var(--color-border)",
                        background: patientToken === p.token ? "#d1fae5" : "white",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      {p.token} ({p.ageBand})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>
              {t("patientAgeBand", lang)}
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
              {(["child", "adult", "elderly"] as AgeBand[]).map((ab) => (
                <button
                  key={ab}
                  type="button"
                  onClick={() => setAgeBand(ab)}
                  className={`btn ${ageBand === ab ? "btn-primary" : "btn-secondary"}`}
                  style={{ fontSize: "0.85rem", padding: "0.5rem" }}
                >
                  {ab === "child" && t("ageBandChild", lang)}
                  {ab === "adult" && t("ageBandAdult", lang)}
                  {ab === "elderly" && t("ageBandElderly", lang)}
                </button>
              ))}
            </div>

            {/* Pregnancy toggle (adult female) */}
            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>{t("patientPregnant", lang)}</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className={`btn ${pregnant ? "btn-primary" : "btn-secondary"}`}
                  style={{ minHeight: 36, padding: "0.3rem 1rem" }}
                  onClick={() => setPregnant(true)}
                >
                  {t("yes", lang)}
                </button>
                <button
                  type="button"
                  className={`btn ${!pregnant ? "btn-primary" : "btn-secondary"}`}
                  style={{ minHeight: 36, padding: "0.3rem 1rem" }}
                  onClick={() => setPregnant(false)}
                >
                  {t("no", lang)}
                </button>
              </div>
            </div>

            {/* Kidney Disease Toggle */}
            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>{t("patientKidneyDisease", lang)}</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className={`btn ${kidneyDisease ? "btn-primary" : "btn-secondary"}`}
                  style={{ minHeight: 36, padding: "0.3rem 1rem" }}
                  onClick={() => setKidneyDisease(true)}
                >
                  {t("yes", lang)}
                </button>
                <button
                  type="button"
                  className={`btn ${!kidneyDisease ? "btn-primary" : "btn-secondary"}`}
                  style={{ minHeight: 36, padding: "0.3rem 1rem" }}
                  onClick={() => setKidneyDisease(false)}
                >
                  {t("no", lang)}
                </button>
              </div>
            </div>

            {/* Creatinine / eGFR */}
            {kidneyDisease && (
              <div style={{ marginTop: "0.75rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>{t("patientCreatinine", lang)}</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={creatinine}
                    onChange={(e) => setCreatinine(e.target.value)}
                    placeholder="e.g. 1.8"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>{t("patientEGFR", lang)}</label>
                  <input
                    type="number"
                    className="input"
                    value={egfr}
                    onChange={(e) => setEgfr(e.target.value)}
                    placeholder="e.g. 35"
                  />
                </div>
              </div>
            )}

            {/* Lives Alone & Works Outdoors */}
            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>{t("patientLivesAlone", lang)}</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className={`btn ${livesAlone ? "btn-primary" : "btn-secondary"}`}
                  style={{ minHeight: 36, padding: "0.3rem 1rem" }}
                  onClick={() => setLivesAlone(true)}
                >
                  {t("yes", lang)}
                </button>
                <button
                  type="button"
                  className={`btn ${!livesAlone ? "btn-primary" : "btn-secondary"}`}
                  style={{ minHeight: 36, padding: "0.3rem 1rem" }}
                  onClick={() => setLivesAlone(false)}
                >
                  {t("no", lang)}
                </button>
              </div>
            </div>

            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>{t("patientWorksOutdoors", lang)}</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className={`btn ${worksOutdoors ? "btn-primary" : "btn-secondary"}`}
                  style={{ minHeight: 36, padding: "0.3rem 1rem" }}
                  onClick={() => setWorksOutdoors(true)}
                >
                  {t("yes", lang)}
                </button>
                <button
                  type="button"
                  className={`btn ${!worksOutdoors ? "btn-primary" : "btn-secondary"}`}
                  style={{ minHeight: 36, padding: "0.3rem 1rem" }}
                  onClick={() => setWorksOutdoors(false)}
                >
                  {t("no", lang)}
                </button>
              </div>
            </div>
          </div>

          <button className="btn btn-primary btn-full" style={{ fontSize: "1.1rem" }} onClick={handleStep1Next}>
            পরের ধাপ: লক্ষণ (Next: Symptoms) ➔
          </button>
        </div>
      )}

      {/* ────────────────── STEP 2: ILLNESS & SYMPTOMS ────────────────── */}
      {step === 2 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>
              {t("stepSymptoms", lang)}
            </h2>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ minHeight: 36, padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
              onClick={() => handleReadAloud(t("stepSymptoms", lang))}
            >
              🔊 শোনান (Listen)
            </button>
          </div>

          {/* Voice Input Section */}
          <div
            style={{
              background: isListening ? "#fee2e2" : "#f0fdf4",
              border: `2px solid ${isListening ? "var(--color-danger)" : "var(--color-border)"}`,
              borderRadius: "var(--radius)",
              padding: "1rem",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            <button
              type="button"
              className={`btn ${isListening ? "btn-danger" : "btn-primary"}`}
              onClick={handleStartListening}
              disabled={isListening || isParsingVoice}
              style={{ width: "100%", fontSize: "1rem", gap: "0.75rem" }}
            >
              <span style={{ fontSize: "1.4rem" }}>{isListening ? "🔴" : "🎙️"}</span>
              {isListening
                ? "শুনছি... কথা বলুন (Listening...)"
                : isParsingVoice
                ? "AI পার্স করছে... (Analyzing voice...)"
                : t("symptomMicButton", lang)}
            </button>

            {transcript && (
              <div style={{ marginTop: "0.75rem", textAlign: "left", background: "white", padding: "0.75rem", borderRadius: 8 }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)" }}>
                  রেকর্ড করা কথা (Transcript):
                </span>
                <p style={{ fontSize: "0.9rem", color: "var(--color-text)", marginTop: "0.25rem" }}>{transcript}</p>
              </div>
            )}

            {voiceNotice && (
              <p
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.8rem",
                  color: voiceNotice.includes("error") || voiceNotice.includes("unavailable")
                    ? "var(--color-danger)"
                    : "var(--color-primary-dark)",
                  fontWeight: 600,
                }}
              >
                {voiceNotice}
              </p>
            )}
          </div>

          {/* Symptom Grid (Big buttons) */}
          <div className="symptom-grid" style={{ marginBottom: "1rem" }}>
            {ALL_SYMPTOMS.map((sym) => {
              const selected = selectedSymptoms.includes(sym.id);
              return (
                <button
                  key={sym.id}
                  type="button"
                  className={`symptom-btn ${selected ? "selected" : ""}`}
                  onClick={() => toggleSymptom(sym.id)}
                >
                  <span className="sym-icon">{sym.icon}</span>
                  <span>{t(sym.labelKey as any, lang)}</span>
                </button>
              );
            })}
          </div>

          {/* Manual Acute Questions */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-primary-dark)" }}>
              তীব্রতার প্রশ্ন (Severity Questions):
            </h3>

            {/* Duration */}
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>{t("durationQuestion", lang)}</label>
              <input
                type="number"
                min="1"
                max="30"
                className="input"
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                style={{ marginTop: "0.25rem" }}
              />
            </div>

            {/* Able to drink fluids */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{t("ableToDrink", lang)}</span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  className={`btn ${ableToDrink ? "btn-primary" : "btn-secondary"}`}
                  style={{ minHeight: 32, padding: "0.2rem 0.8rem", fontSize: "0.8rem" }}
                  onClick={() => setAbleToDrink(true)}
                >
                  {t("yes", lang)}
                </button>
                <button
                  type="button"
                  className={`btn ${!ableToDrink ? "btn-danger" : "btn-secondary"}`}
                  style={{ minHeight: 32, padding: "0.2rem 0.8rem", fontSize: "0.8rem" }}
                  onClick={() => setAbleToDrink(false)}
                >
                  {t("no", lang)}
                </button>
              </div>
            </div>

            {/* Urine in last 8 hours */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{t("urineQuestion", lang)}</span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  className={`btn ${urine8h === true ? "btn-primary" : "btn-secondary"}`}
                  style={{ minHeight: 32, padding: "0.2rem 0.6rem", fontSize: "0.8rem" }}
                  onClick={() => setUrine8h(true)}
                >
                  {t("yes", lang)}
                </button>
                <button
                  type="button"
                  className={`btn ${urine8h === false ? "btn-danger" : "btn-secondary"}`}
                  style={{ minHeight: 32, padding: "0.2rem 0.6rem", fontSize: "0.8rem" }}
                  onClick={() => setUrine8h(false)}
                >
                  {t("no", lang)}
                </button>
                <button
                  type="button"
                  className={`btn ${urine8h === null ? "btn-primary" : "btn-secondary"}`}
                  style={{ minHeight: 32, padding: "0.2rem 0.6rem", fontSize: "0.8rem" }}
                  onClick={() => setUrine8h(null)}
                >
                  {t("unknown", lang)}
                </button>
              </div>
            </div>

            {/* Dizziness / fainting */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{t("dizzinessQuestion", lang)}</span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  className={`btn ${dizziness ? "btn-danger" : "btn-secondary"}`}
                  style={{ minHeight: 32, padding: "0.2rem 0.8rem", fontSize: "0.8rem" }}
                  onClick={() => setDizziness(true)}
                >
                  {t("yes", lang)}
                </button>
                <button
                  type="button"
                  className={`btn ${!dizziness ? "btn-primary" : "btn-secondary"}`}
                  style={{ minHeight: 32, padding: "0.2rem 0.8rem", fontSize: "0.8rem" }}
                  onClick={() => setDizziness(false)}
                >
                  {t("no", lang)}
                </button>
              </div>
            </div>

            {/* Confusion */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{t("confusionQuestion", lang)}</span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  className={`btn ${confusion ? "btn-danger" : "btn-secondary"}`}
                  style={{ minHeight: 32, padding: "0.2rem 0.8rem", fontSize: "0.8rem" }}
                  onClick={() => setConfusion(true)}
                >
                  {t("yes", lang)}
                </button>
                <button
                  type="button"
                  className={`btn ${!confusion ? "btn-primary" : "btn-secondary"}`}
                  style={{ minHeight: 32, padding: "0.2rem 0.8rem", fontSize: "0.8rem" }}
                  onClick={() => setConfusion(false)}
                >
                  {t("no", lang)}
                </button>
              </div>
            </div>

            {/* Blood in stool */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{t("bloodInStool", lang)}</span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  className={`btn ${bloodInStool ? "btn-danger" : "btn-secondary"}`}
                  style={{ minHeight: 32, padding: "0.2rem 0.8rem", fontSize: "0.8rem" }}
                  onClick={() => setBloodInStool(true)}
                >
                  {t("yes", lang)}
                </button>
                <button
                  type="button"
                  className={`btn ${!bloodInStool ? "btn-primary" : "btn-secondary"}`}
                  style={{ minHeight: 32, padding: "0.2rem 0.8rem", fontSize: "0.8rem" }}
                  onClick={() => setBloodInStool(false)}
                >
                  {t("no", lang)}
                </button>
              </div>
            </div>

            {/* Chest Pain */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{t("chestPain", lang)}</span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  className={`btn ${chestPain ? "btn-danger" : "btn-secondary"}`}
                  style={{ minHeight: 32, padding: "0.2rem 0.8rem", fontSize: "0.8rem" }}
                  onClick={() => setChestPain(true)}
                >
                  {t("yes", lang)}
                </button>
                <button
                  type="button"
                  className={`btn ${!chestPain ? "btn-primary" : "btn-secondary"}`}
                  style={{ minHeight: 32, padding: "0.2rem 0.8rem", fontSize: "0.8rem" }}
                  onClick={() => setChestPain(false)}
                >
                  {t("no", lang)}
                </button>
              </div>
            </div>

            {/* Cannot keep fluids down */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{t("cannotKeepFluids", lang)}</span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  className={`btn ${cannotKeepFluids ? "btn-danger" : "btn-secondary"}`}
                  style={{ minHeight: 32, padding: "0.2rem 0.8rem", fontSize: "0.8rem" }}
                  onClick={() => setCannotKeepFluids(true)}
                >
                  {t("yes", lang)}
                </button>
                <button
                  type="button"
                  className={`btn ${!cannotKeepFluids ? "btn-primary" : "btn-secondary"}`}
                  style={{ minHeight: 32, padding: "0.2rem 0.8rem", fontSize: "0.8rem" }}
                  onClick={() => setCannotKeepFluids(false)}
                >
                  {t("no", lang)}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>
              ⬅ পূর্ববর্তী (Back)
            </button>
            <button className="btn btn-primary" style={{ flex: 2, fontSize: "1.05rem" }} onClick={handleStep2Next}>
              পরের ধাপ: ওষুধ (Next: Medicines) ➔
            </button>
          </div>
        </div>
      )}

      {/* ────────────────── STEP 3: MEDICINES ────────────────── */}
      {step === 3 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>
              {t("stepMedicines", lang)}
            </h2>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ minHeight: 36, padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
              onClick={() => handleReadAloud(t("stepMedicines", lang))}
            >
              🔊 শোনান (Listen)
            </button>
          </div>

          {/* Search Bar */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: 600, fontSize: "0.85rem", display: "block", marginBottom: "0.3rem" }}>
              {t("searchMedicine", lang)} (বাংলা বা ইংরেজি / Bengali or English):
            </label>
            <input
              type="text"
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Envas, Losar, Glycomet, ডায়ামাইক্রন..."
            />

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div
                style={{
                  marginTop: "0.5rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  maxHeight: 200,
                  overflowY: "auto",
                  background: "white",
                }}
              >
                {searchResults.map((b) => (
                  <div
                    key={b.brand}
                    onClick={() => handleAddBrand(b)}
                    style={{
                      padding: "0.6rem 0.75rem",
                      borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{b.brand}</span>
                      {b.brandBn && (
                        <span style={{ marginLeft: "0.5rem", color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                          ({b.brandBn})
                        </span>
                      )}
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {b.genericSalt} · {b.classes.join(", ")}
                      </div>
                    </div>
                    <span className={b.signedOff ? "badge badge-verified" : "badge badge-unsigned"}>
                      {b.signedOff ? t("brandStatusVerified", lang) : t("brandStatusUnsigned", lang)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unknown Brand Helper / AI Suggestion */}
          <div className="card" style={{ marginBottom: "1rem", background: "#f8fafc" }}>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
              তালিকাভুক্ত নয় এমন ওষুধ? (Unknown brand not in list?):
            </h3>
            <input
              type="text"
              className="input"
              value={customBrandName}
              onChange={(e) => setCustomBrandName(e.target.value)}
              placeholder="ওষুধের নাম লিখুন (Enter brand name)..."
              style={{ marginBottom: "0.5rem" }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ fontSize: "0.85rem", minHeight: 40 }}
                disabled={!customBrandName.trim() || isSuggestingClass}
                onClick={handleAskAISuggestClass}
              >
                {isSuggestingClass ? "AI বিশ্লেষণ করছে..." : "🤖 " + t("askAISuggest", lang)}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: "0.85rem", minHeight: 40 }}
                disabled={!customBrandName.trim()}
                onClick={() => handleAddCustomBrand(customDrugClass, false)}
              >
                ➕ নিজে যোগ করুন (Add Manual)
              </button>
            </div>

            {suggestNotice && (
              <p
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.75rem",
                  color: "#92400e",
                  background: "#fffbeb",
                  padding: "0.4rem 0.6rem",
                  borderRadius: 6,
                }}
              >
                {suggestNotice}
              </p>
            )}
          </div>

          {/* Selected Medicines List */}
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem" }}>
              নির্বাচিত ওষুধসমূহ ({selectedBrands.length}) (Selected Medicines):
            </h3>

            {selectedBrands.length === 0 ? (
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                কোনো ওষুধ নির্বাচন করা হয়নি। ওপর থেকে খুঁজুন। (No medicines selected yet).
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {selectedBrands.map((b, idx) => (
                  <div
                    key={`${b.brand}-${idx}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.6rem 0.75rem",
                      borderRadius: 8,
                      background: "#f0fdf4",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{b.brand}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                        শ্রেণী (Class): {b.classes.join(", ")}
                      </div>
                      <div style={{ marginTop: "2px" }}>
                        {b.signedOff ? (
                          <span className="badge badge-verified">{t("brandStatusVerified", lang)}</span>
                        ) : b.pendingReview ? (
                          <span className="badge badge-pending">{t("brandStatusPendingReview", lang)}</span>
                        ) : (
                          <span className="badge badge-unsigned">{t("brandStatusUnsigned", lang)}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ padding: "0.2rem 0.6rem", minHeight: 32, fontSize: "0.8rem" }}
                      onClick={() => handleRemoveBrand(idx)}
                    >
                      মুছুন (✕)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(2)}>
              ⬅ পূর্ববর্তী (Back)
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 2, fontSize: "1.05rem" }}
              onClick={handleRunCheck}
            >
              ফলাফল দেখুন (View Decision Support) ➔
            </button>
          </div>
        </div>
      )}

      {/* ────────────────── STEP 4: RESULT ────────────────── */}
      {step === 4 && checkResult && (
        <div>
          {/* URGENCY BANNER */}
          {checkResult.urgency === "GO_TO_HEALTH_FACILITY_NOW" && (
            <div className="banner banner-urgent">
              <span style={{ fontSize: "1.8rem" }}>🚨</span>
              <div>
                <div>{t("resultUrgentBanner", lang)}</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 500, marginTop: "2px" }}>
                  জরুরি বিপদসূচক লক্ষণ চিহ্নিত হয়েছে। অবিলম্বে স্বাস্থ্য কেন্দ্রে রেফার করুন।
                </div>
              </div>
            </div>
          )}

          {checkResult.urgency === "ASK_DOCTOR_TODAY" && (
            <div className="banner banner-warn">
              <span style={{ fontSize: "1.8rem" }}>⚠️</span>
              <div>
                <div>{t("resultAskDoctorBanner", lang)}</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 500, marginTop: "2px" }}>
                  চিহ্নিত ওষুধগুলির বিষয়ে আজই মেডিকেল অফিসারের (MO) পরামর্শ নিন।
                </div>
              </div>
            </div>
          )}

          {checkResult.urgency === "NO_FLAG" && (
            <div className="banner banner-ok">
              <span style={{ fontSize: "1.8rem" }}>✓</span>
              <div>
                <div>{t("resultNoFlag", lang)}</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 500, marginTop: "2px" }}>
                  বর্তমান তথ্যের ভিত্তিতে কোনো ওষুধের সিদ্ধান্ত-সহায়তা ফ্ল্যাগ নেই।
                </div>
              </div>
            </div>
          )}

          {/* MEDICINE FLAGS LIST */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-primary-dark)" }}>
              ওষুধের সিদ্ধান্ত-সহায়তা মূল্যায়ন (Medicine Decision Support):
            </h3>

            {checkResult.perMedicine.length === 0 ? (
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                কোনো ওষুধ নির্বাচন করা হয়নি।
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {checkResult.perMedicine.map((med, idx) => {
                  const isFlagged = med.flag === "ASK_DOCTOR_TODAY";
                  const isExpanded = !!expandedWhy[med.brand];
                  return (
                    <div
                      key={`${med.brand}-${idx}`}
                      style={{
                        padding: "0.75rem",
                        borderRadius: 10,
                        border: `2px solid ${isFlagged ? "var(--color-accent)" : "var(--color-border)"}`,
                        background: isFlagged ? "#fffbeb" : "white",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "1rem" }}>{med.brand}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                            শ্রেণী (Class): {med.classes.join(", ")}
                          </div>
                        </div>
                        <span
                          style={{
                            padding: "0.25rem 0.6rem",
                            borderRadius: 6,
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            background: isFlagged ? "#fee2e2" : "#d1fae5",
                            color: isFlagged ? "#991b1b" : "#065f46",
                          }}
                        >
                          {isFlagged ? "⚠️ ASK DOCTOR TODAY" : "✓ NO FLAG"}
                        </span>
                      </div>

                      {/* Rule Hits & Why toggle */}
                      {med.ruleHits && med.ruleHits.length > 0 && (
                        <div style={{ marginTop: "0.5rem" }}>
                          <button
                            type="button"
                            onClick={() => toggleWhy(med.brand)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--color-primary-light)",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            {isExpanded ? "▲ কেন? বন্ধ করুন" : "▼ কেন? নিয়ম দেখুন (Why? See rule)"}
                          </button>

                          {isExpanded && (
                            <div
                              style={{
                                marginTop: "0.5rem",
                                padding: "0.5rem",
                                background: "#f8fafc",
                                borderRadius: 6,
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              {med.ruleHits.map((rule) => (
                                <div key={rule.ruleId} style={{ marginBottom: "0.5rem" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)" }}>
                                      {rule.ruleId}
                                    </span>
                                    {rule.signedOff ? (
                                      <span className="badge badge-verified">Signed off</span>
                                    ) : (
                                      <span className="badge badge-unsigned">UNSIGNED RULE — clinician review required</span>
                                    )}
                                  </div>
                                  <p style={{ fontSize: "0.85rem", marginTop: "2px", color: "var(--color-text)" }}>
                                    {rule.ruleText[lang] || rule.ruleText.en}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* MO MESSAGE CARD */}
          {builtMessage && (
            <div className="card" style={{ marginBottom: "1rem", background: "#f0fdf4" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>
                  মেডিকেল অফিসারকে বার্তা (MO Message):
                </h3>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
                  {builtMessage.text.length}/300 chars
                </span>
              </div>

              <div
                style={{
                  background: "white",
                  padding: "0.75rem",
                  borderRadius: 8,
                  border: "1.5px solid var(--color-border)",
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  marginBottom: "0.75rem",
                }}
              >
                {builtMessage.text}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: "0.8rem", padding: "0.4rem" }}
                  onClick={handleCopyMessage}
                >
                  {copySuccess ? "✓ Copied!" : "📋 " + t("copyMessage", lang)}
                </button>
                <a
                  href={builtMessage.smsLink}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.8rem", padding: "0.4rem", textDecoration: "none" }}
                >
                  ✉️ {t("shareViaSMS", lang)}
                </a>
                <a
                  href={builtMessage.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: "0.8rem", padding: "0.4rem", textDecoration: "none" }}
                >
                  💬 {t("shareViaWhatsApp", lang)}
                </a>
              </div>
            </div>
          )}

          {/* HOME CARE REMINDER */}
          <div
            style={{
              background: "#ecfdf5",
              border: "1.5px solid #a7f3d0",
              borderRadius: "var(--radius)",
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#065f46" }}>
              🏠 হোম কেয়ার অনুস্মারক (Home Care):
            </span>
            <p style={{ fontSize: "0.85rem", color: "#065f46", marginTop: "0.25rem" }}>
              {t("homeCareReminder", lang)}
            </p>
          </div>

          {/* MANDATORY SAFETY DISCLAIMER */}
          <div className="safety-disclaimer">
            {SAFETY_DISCLAIMER}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => {
                setStep(1);
                setPatientToken(generatePatientToken());
                setSelectedSymptoms([]);
                setSelectedBrands([]);
                setCheckResult(null);
                setBuiltMessage(null);
              }}
            >
              নতুন চেক শুরু করুন (New Check)
            </button>
            <Link href="/" className="btn btn-secondary" style={{ flex: 1, textAlign: "center" }}>
              হোম পেজে ফিরুন (Home)
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
