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
import { searchBrands, lookupBrand, getBrandDisplayName } from "@/lib/brands";
import { evaluate } from "@/lib/rules";
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

const DRUG_CLASS_KEYS: DrugClass[] = [
  "ace_inhibitor",
  "arb",
  "diuretic_loop",
  "diuretic_thiazide",
  "sglt2_inhibitor",
  "metformin",
  "sulfonylurea",
  "nsaid",
  "other",
  "unknown",
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

    // Check for demo walkthrough scenarios in URL query
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const demoParam = params.get("demo");
      if (demoParam === "scenario1") {
        setPatientToken("DEMO-P01");
        setAgeBand("elderly");
        setPregnant(false);
        setKidneyDisease(false);
        setSelectedSymptoms(["loose_motions"]);
        setDurationDays(2);
        setAbleToDrink(true);
        setUrine8h(true);
        const brands = [
          { brand: "Cardace", classes: ["ace_inhibitor" as DrugClass], signedOff: true, source: "National Formularies" },
          { brand: "Glycomet", classes: ["metformin" as DrugClass], signedOff: true, source: "National Formularies" },
        ];
        setSelectedBrands(brands);
        const p: Patient = { token: "DEMO-P01", ageBand: "elderly", pregnant: false, knownKidneyDisease: false, createdAt: new Date().toISOString() };
        const s: ParsedSymptoms = {
          symptoms: { value: ["loose_motions"], confidence: 1 },
          durationDays: { value: 2, confidence: 1 },
          ableToDrinkFluids: { value: true, confidence: 1 },
          urinePastEightHours: { value: true, confidence: 1 },
          dizziness: { value: false, confidence: 1 },
          confusion: { value: false, confidence: 1 },
          bloodInStool: { value: false, confidence: 1 },
          chestPain: { value: false, confidence: 1 },
          cannotKeepFluids: { value: false, confidence: 1 },
        };
        const res = evaluate({ patient: p, symptoms: s, brands: ["Cardace", "Glycomet"], isHeatDay: false, timestamp: new Date().toISOString() });
        setCheckResult(res);
        setBuiltMessage(buildMOMessage({ patient: p, symptoms: s, result: res, isHeatDay: false, timestamp: new Date().toISOString() }));
        setStep(4);
      } else if (demoParam === "scenario2") {
        setPatientToken("DEMO-P02");
        setAgeBand("elderly");
        setPregnant(false);
        setKidneyDisease(true);
        setCreatinine("2.2");
        setEgfr("34");
        setSelectedSymptoms(["loose_motions", "vomiting"]);
        setDurationDays(2);
        setAbleToDrink(false);
        setUrine8h(false);
        setDizziness(true);
        setCannotKeepFluids(true);
        const brands = [
          { brand: "Lasix", classes: ["diuretic_loop" as DrugClass], signedOff: true, source: "National Formularies" },
          { brand: "Cosart", classes: ["arb" as DrugClass], signedOff: true, source: "National Formularies" },
        ];
        setSelectedBrands(brands);
        const p: Patient = { token: "DEMO-P02", ageBand: "elderly", pregnant: false, knownKidneyDisease: true, latestCreatinine: 2.2, latestEGFR: 34, createdAt: new Date().toISOString() };
        const s: ParsedSymptoms = {
          symptoms: { value: ["loose_motions", "vomiting"], confidence: 1 },
          durationDays: { value: 2, confidence: 1 },
          ableToDrinkFluids: { value: false, confidence: 1 },
          urinePastEightHours: { value: false, confidence: 1 },
          dizziness: { value: true, confidence: 1 },
          confusion: { value: false, confidence: 1 },
          bloodInStool: { value: false, confidence: 1 },
          chestPain: { value: false, confidence: 1 },
          cannotKeepFluids: { value: true, confidence: 1 },
        };
        const res = evaluate({ patient: p, symptoms: s, brands: ["Lasix", "Cosart"], isHeatDay: false, timestamp: new Date().toISOString() });
        setCheckResult(res);
        setBuiltMessage(buildMOMessage({ patient: p, symptoms: s, result: res, isHeatDay: false, timestamp: new Date().toISOString() }));
        setStep(4);
      } else if (demoParam === "scenario3") {
        setPatientToken("DEMO-P03");
        setAgeBand("adult");
        setPregnant(false);
        setKidneyDisease(false);
        setSelectedSymptoms(["fever", "not_eating_drinking"]);
        setDurationDays(1);
        setAbleToDrink(true);
        setUrine8h(true);
        const brands = [
          { brand: "AyurDiab-Plus", classes: ["unknown" as DrugClass], signedOff: false, source: "Village Pharmacy / Unmapped", isCustom: true, pendingReview: true },
        ];
        setSelectedBrands(brands);
        const p: Patient = { token: "DEMO-P03", ageBand: "adult", pregnant: false, knownKidneyDisease: false, createdAt: new Date().toISOString() };
        const s: ParsedSymptoms = {
          symptoms: { value: ["fever", "not_eating_drinking"], confidence: 1 },
          durationDays: { value: 1, confidence: 1 },
          ableToDrinkFluids: { value: true, confidence: 1 },
          urinePastEightHours: { value: true, confidence: 1 },
          dizziness: { value: false, confidence: 1 },
          confusion: { value: false, confidence: 1 },
          bloodInStool: { value: false, confidence: 1 },
          chestPain: { value: false, confidence: 1 },
          cannotKeepFluids: { value: false, confidence: 1 },
        };
        const res = evaluate({ patient: p, symptoms: s, brands: ["AyurDiab-Plus"], isHeatDay: false, timestamp: new Date().toISOString() });
        setCheckResult(res);
        setBuiltMessage(buildMOMessage({ patient: p, symptoms: s, result: res, isHeatDay: false, timestamp: new Date().toISOString() }));
        setStep(4);
      }
    }

    const handleLangChange = () => setLang(getLanguage());
    window.addEventListener("ap-lang-change", handleLangChange);
    return () => window.removeEventListener("ap-lang-change", handleLangChange);
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
    handleReadAloud(t("stepSymptomsPrompt", lang));
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
        setVoiceNotice(err);
      },
      () => {
        setIsListening(false);
      }
    );

    if (!handle) {
      setIsListening(false);
      setVoiceNotice(t("noVoice", lang));
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

      if (data.symptoms?.value?.length > 0) {
        setSelectedSymptoms(data.symptoms.value);
      }
      if (data.durationDays?.value != null) {
        setDurationDays(data.durationDays.value);
      }
      if (data.ableToDrinkFluids?.value != null) {
        setAbleToDrink(data.ableToDrinkFluids.value);
      }
      if (data.urinePastEightHours?.value !== undefined && data.urinePastEightHours.value !== null) {
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

      setVoiceNotice(t("stepSymptomsParseSuccess", lang));
    } catch {
      setVoiceNotice(t("aiManualFallback", lang));
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
    handleReadAloud(t("stepMedicinesPrompt", lang));
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
        source: pendingReview ? t("brandStatusPendingReview", lang) : t("brandStatusUnknown", lang),
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

      await savePendingReview({
        id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: "brand_suggestion",
        createdAt: new Date().toISOString(),
        brand: customBrandName.trim(),
        suggestedClass: suggested,
        confidence: data.confidence ?? 0.5,
        status: "pending",
        source: "AI suggestion from user input",
        submittedBy: "Illness Check Flow",
        submittedAt: new Date().toISOString(),
      });

      // NON-NEGOTIABLE SAFETY RULE:
      // Suggested class goes to review queue and is NOT used for clinical flags until approved.
      // The check treats this medicine as UNKNOWN -> ASK_DOCTOR_TODAY.
      handleAddCustomBrand("unknown", true);
      setSuggestNotice(t("submitToReview", lang));
    } catch {
      setSuggestNotice(t("aiManualFallback", lang));
      handleAddCustomBrand("unknown", false);
    } finally {
      setIsSuggestingClass(false);
    }
  }

  // Execute Rule Engine & Build Result
  async function handleRunCheck() {
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

    await savePatient(patientObj);

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

    const checkInput: CheckInput = {
      patient: patientObj,
      symptoms: symptomsObj,
      brands: selectedBrands.map((b) => b.brand),
      isHeatDay: selectedSymptoms.includes("very_hot_weather"),
      timestamp: new Date().toISOString(),
    };

    const result = evaluate(checkInput);
    setCheckResult(result);

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

    const checkRecord: CheckRecord = {
      id: `chk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      input: checkInput,
      result,
      createdAt: new Date().toISOString(),
    };
    await saveCheck(checkRecord);

    await enqueue({
      id: `out_${checkRecord.id}`,
      type: "check",
      payload: checkRecord,
      createdAt: checkRecord.createdAt,
      synced: false,
      attempts: 0,
    });

    setStep(4);

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
            {step === 1 && t("step1Title", lang)}
            {step === 2 && t("step2Title", lang)}
            {step === 3 && t("step3Title", lang)}
            {step === 4 && t("step4Title", lang)}
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
                🔄 {t("patientCreateNew", lang)}
              </button>
            </div>
            <input
              type="text"
              className="input"
              value={patientToken}
              onChange={(e) => setPatientToken(e.target.value)}
              placeholder={t("patientTokenPlaceholder", lang)}
            />

            {/* Quick selector for existing patients */}
            {savedPatients.length > 0 && (
              <div style={{ marginTop: "0.75rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                  {t("patientSelectExisting", lang)}
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
                      {p.token} ({t(`ageBand${p.ageBand.charAt(0).toUpperCase() + p.ageBand.slice(1)}` as any, lang)})
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

            {/* Pregnancy toggle */}
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
                    placeholder="1.8"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>{t("patientEGFR", lang)}</label>
                  <input
                    type="number"
                    className="input"
                    value={egfr}
                    onChange={(e) => setEgfr(e.target.value)}
                    placeholder="35"
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
            {t("next", lang)}: {t("step2Title", lang)} ➔
          </button>
        </div>
      )}

      {/* ────────────────── STEP 2: ILLNESS & SYMPTOMS ────────────────── */}
      {step === 2 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>
              {t("stepSymptomsPrompt", lang)}
            </h2>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ minHeight: 36, padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
              onClick={() => handleReadAloud(t("stepSymptomsPrompt", lang))}
            >
              🔊 {t("stepSymptomsMicPrompt", lang)}
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
                ? t("stepSymptomsListening", lang)
                : isParsingVoice
                ? t("askAILoading", lang)
                : t("stepSymptomsMicPrompt", lang)}
            </button>

            {transcript && (
              <div style={{ marginTop: "0.75rem", textAlign: "left", background: "white", padding: "0.75rem", borderRadius: 8 }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)" }}>
                  {t("notes", lang)}:
                </span>
                <p style={{ fontSize: "0.9rem", color: "var(--color-text)", marginTop: "0.25rem" }}>{transcript}</p>
              </div>
            )}

            {voiceNotice && (
              <p
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.8rem",
                  color: "var(--color-primary-dark)",
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
              {t("step2Subtitle", lang)}
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
              ⬅ {t("back", lang)}
            </button>
            <button className="btn btn-primary" style={{ flex: 2, fontSize: "1.05rem" }} onClick={handleStep2Next}>
              {t("next", lang)}: {t("step3Title", lang)} ➔
            </button>
          </div>
        </div>
      )}

      {/* ────────────────── STEP 3: MEDICINES ────────────────── */}
      {step === 3 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>
              {t("stepMedicinesPrompt", lang)}
            </h2>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ minHeight: 36, padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
              onClick={() => handleReadAloud(t("stepMedicinesPrompt", lang))}
            >
              🔊 {t("stepSymptomsMicPrompt", lang)}
            </button>
          </div>

          {/* Search Bar */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: 600, fontSize: "0.85rem", display: "block", marginBottom: "0.3rem" }}>
              {t("searchMedicine", lang)}
            </label>
            <input
              type="text"
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchMedicinePlaceholder", lang)}
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
                      <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
                        {getBrandDisplayName(b, lang)}
                      </span>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {b.salt} · {b.classes.map((cls) => t(`drugClass_${cls}` as any, lang)).join(", ")}
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
              {t("customBrandTitle", lang)}
            </h3>
            <input
              type="text"
              className="input"
              value={customBrandName}
              onChange={(e) => setCustomBrandName(e.target.value)}
              placeholder={t("customBrandPlaceholder", lang)}
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
                {isSuggestingClass ? t("askAILoading", lang) : "🤖 " + t("askAISuggest", lang)}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: "0.85rem", minHeight: 40 }}
                disabled={!customBrandName.trim()}
                onClick={() => handleAddCustomBrand(customDrugClass, false)}
              >
                ➕ {t("addManualClass", lang)}
              </button>
            </div>

            {/* Manual class selection dropdown */}
            <div style={{ marginTop: "0.5rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>
                {t("customClassLabel", lang)}
              </label>
              <select
                className="input"
                value={customDrugClass}
                onChange={(e) => setCustomDrugClass(e.target.value as DrugClass)}
                style={{ fontSize: "0.85rem" }}
              >
                {DRUG_CLASS_KEYS.map((cls) => (
                  <option key={cls} value={cls}>
                    {t(`drugClass_${cls}` as any, lang)}
                  </option>
                ))}
              </select>
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
              {t("selectedMedicinesTitle", { count: selectedBrands.length }, lang)}
            </h3>

            {selectedBrands.length === 0 ? (
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                {t("selectedMedicinesEmpty", lang)}
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
                      <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                        {getBrandDisplayName(b.brand, lang)}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                        {b.classes.map((cls) => t(`drugClass_${cls}` as any, lang)).join(", ")}
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
                      {t("removeMedicine", lang)}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(2)}>
              ⬅ {t("back", lang)}
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 2, fontSize: "1.05rem" }}
              onClick={handleRunCheck}
            >
              {t("next", lang)}: {t("step4Title", lang)} ➔
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
                <div style={{ fontWeight: 800 }}>{t("resultUrgentBanner", lang)}</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 500, marginTop: "2px" }}>
                  {t("resultUrgentDesc", lang)}
                </div>
              </div>
            </div>
          )}

          {checkResult.urgency === "ASK_DOCTOR_TODAY" && (
            <div className="banner banner-warn">
              <span style={{ fontSize: "1.8rem" }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 800 }}>{t("resultAskDoctorBanner", lang)}</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 500, marginTop: "2px" }}>
                  {t("resultAskDoctorDesc", lang)}
                </div>
              </div>
            </div>
          )}

          {checkResult.urgency === "NO_FLAG" && (
            <div className="banner banner-ok">
              <span style={{ fontSize: "1.8rem" }}>✓</span>
              <div>
                <div style={{ fontWeight: 800 }}>{t("resultNoFlag", lang)}</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 500, marginTop: "2px" }}>
                  {t("resultNoFlagDesc", lang)}
                </div>
              </div>
            </div>
          )}

          {/* MEDICINE FLAGS LIST */}
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-primary-dark)" }}>
              {t("step4Title", lang)}
            </h3>

            {checkResult.perMedicine.length === 0 ? (
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                {t("none", lang)}
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
                          <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                            {getBrandDisplayName(med.brand, lang)}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                            {med.classes.map((cls) => t(`drugClass_${cls}` as any, lang)).join(", ")}
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
                          {isFlagged ? `⚠️ ${t("resultAskDoctorBanner", lang)}` : `✓ ${t("resultNoFlag", lang)}`}
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
                            {isExpanded ? `▲ ${t("whyClose", lang)}` : `▼ ${t("whyToggle", lang)}`}
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
                              {med.ruleHits.map((rule) => {
                                const ruleKey = `rule_${rule.ruleId.replace("-", "")}`;
                                const localizedRuleText =
                                  rule.ruleText[lang] ||
                                  t(ruleKey as any, lang) ||
                                  rule.ruleText.en;

                                return (
                                  <div key={rule.ruleId} style={{ marginBottom: "0.5rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)" }}>
                                        {rule.ruleId}
                                      </span>
                                      {rule.signedOff ? (
                                        <span className="badge badge-verified">{t("ruleSignedOffBadge", lang)}</span>
                                      ) : (
                                        <span className="badge badge-unsigned">{t("unsignedBadge", lang)}</span>
                                      )}
                                    </div>
                                    <p style={{ fontSize: "0.85rem", marginTop: "2px", color: "var(--color-text)" }}>
                                      {localizedRuleText}
                                    </p>
                                  </div>
                                );
                              })}
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
                  {t("moMessageTitle", lang)}
                </h3>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
                  {t("moMessageCount", { count: builtMessage.text.length }, lang)}
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
                  {copySuccess ? t("messageCopied", lang) : "📋 " + t("copyMessage", lang)}
                </button>
                <a
                  href={builtMessage.smsLink}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.8rem", padding: "0.4rem", textDecoration: "none", textAlign: "center" }}
                >
                  ✉️ {t("shareViaSMS", lang)}
                </a>
                <a
                  href={builtMessage.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: "0.8rem", padding: "0.4rem", textDecoration: "none", textAlign: "center" }}
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
              🏠 {t("homeCareTitle", lang)}
            </span>
            <p style={{ fontSize: "0.85rem", color: "#065f46", marginTop: "0.25rem" }}>
              {t("homeCareReminder", lang)}
            </p>
          </div>

          {/* MANDATORY SAFETY DISCLAIMER */}
          <div className="safety-disclaimer">
            🔒 {t("safetyDisclaimer", lang)}
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
              {t("homeNewCheck", lang)}
            </button>
            <Link href="/" className="btn btn-secondary" style={{ flex: 1, textAlign: "center" }}>
              {t("navHome", lang)}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
