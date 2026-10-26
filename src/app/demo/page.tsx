"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { t, getLanguage, setLanguage, type Lang } from "@/lib/i18n";
import {
  isDemoMode,
  setDemoMode,
  resetDemo,
  loadDemoWalkthroughData,
} from "@/lib/demo";

export default function DemoPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("bn");
  const [demoActive, setDemoActive] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setLang(getLanguage());
    setDemoActive(isDemoMode());

    const handleLangChange = () => setLang(getLanguage());
    const handleDemoToggle = () => setDemoActive(isDemoMode());

    window.addEventListener("ap-lang-change", handleLangChange);
    window.addEventListener("ap-demo-toggle", handleDemoToggle);
    return () => {
      window.removeEventListener("ap-lang-change", handleLangChange);
      window.removeEventListener("ap-demo-toggle", handleDemoToggle);
    };
  }, []);

  function handleToggleDemo() {
    const nextState = !demoActive;
    setDemoMode(nextState);
    setDemoActive(nextState);
    setNotice(nextState ? t("demoModeActive", lang) : t("demoModeDisabled", lang));
    setTimeout(() => setNotice(null), 3000);
  }

  function handleLoadData() {
    setDemoMode(true);
    setDemoActive(true);
    loadDemoWalkthroughData();
    setNotice(t("demoModeActive", lang));
    setTimeout(() => setNotice(null), 3000);
  }

  function handleReset() {
    resetDemo();
    setNotice(t("demoResetSuccess", lang));
    setTimeout(() => setNotice(null), 3000);
  }

  function handleStep1LanguageBengali() {
    setDemoMode(true);
    setLanguage("bn");
    router.push("/");
  }

  return (
    <div className="page-content" style={{ paddingBottom: "5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-primary-dark)" }}>
          🎯 {t("demoPageTitle", lang)}
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
          {t("demoPageSubtitle", lang)}
        </p>
      </div>

      {notice && (
        <div className="banner" style={{ marginBottom: "1rem", background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" }}>
          {notice}
        </div>
      )}

      {/* Control Card: Mode Toggle, Seed & Reset */}
      <div className="card" style={{ marginBottom: "1.25rem", borderLeft: demoActive ? "4px solid #f59e0b" : "4px solid var(--color-border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div>
            <span
              className="badge"
              style={{
                background: demoActive ? "#fef3c7" : "#f1f5f9",
                color: demoActive ? "#92400e" : "#475569",
                fontWeight: 700,
              }}
            >
              {demoActive ? t("demoModeActive", lang) : t("demoModeDisabled", lang)}
            </span>
          </div>
          <button
            type="button"
            className={`btn ${demoActive ? "btn-secondary" : "btn-primary"}`}
            style={{ fontSize: "0.8rem", padding: "0.3rem 0.75rem" }}
            onClick={handleToggleDemo}
          >
            {demoActive ? t("demoToggleOff", lang) : t("demoToggleOn", lang)}
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", paddingTop: "0.5rem", borderTop: "1px dashed var(--color-border)" }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", flex: 1 }}
            onClick={handleLoadData}
          >
            📦 {t("demoLoadDataBtn", lang)}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
            onClick={handleReset}
          >
            🔄 {t("demoResetBtn", lang)}
          </button>
        </div>
      </div>

      {/* 6-Step Presentation Walkthrough Checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Step 1: Language Switch to Bengali */}
        <div className="card" style={{ borderLeft: "4px solid #3b82f6" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🌐</span>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>
                {t("demoStep1Title", lang)}
              </h2>
              <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                {t("demoStep1Desc", lang)}
              </p>
              <div style={{ marginTop: "0.75rem" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
                  onClick={handleStep1LanguageBengali}
                >
                  🚀 {t("demoStep1Btn", lang)}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Illness Check Flow (Dehydration + ACEi + Metformin) */}
        <div className="card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🩺</span>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>
                {t("demoStep2Title", lang)}
              </h2>
              <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                {t("demoStep2Desc", lang)}
              </p>
              <div style={{ marginTop: "0.75rem" }}>
                <Link
                  href="/check?demo=scenario1"
                  className="btn btn-primary"
                  style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", display: "inline-block" }}
                >
                  🚀 {t("demoStep2Btn", lang)}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Red-Flag Emergency Screening (No Urine 8h) */}
        <div className="card" style={{ borderLeft: "4px solid var(--color-danger)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🚨</span>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-danger-dark)" }}>
                {t("demoStep3Title", lang)}
              </h2>
              <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                {t("demoStep3Desc", lang)}
              </p>
              <div style={{ marginTop: "0.75rem" }}>
                <Link
                  href="/check?demo=scenario2"
                  className="btn btn-danger"
                  style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", display: "inline-block" }}
                >
                  🚀 {t("demoStep3Btn", lang)}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Unrecognized Brand Submission */}
        <div className="card" style={{ borderLeft: "4px solid #8b5cf6" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.5rem" }}>💊</span>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#6d28d9" }}>
                {t("demoStep4Title", lang)}
              </h2>
              <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                {t("demoStep4Desc", lang)}
              </p>
              <div style={{ marginTop: "0.75rem" }}>
                <Link
                  href="/check?demo=scenario3"
                  className="btn btn-primary"
                  style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", display: "inline-block" }}
                >
                  🚀 {t("demoStep4Btn", lang)}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Review Queue & Secure PIN Workflow */}
        <div className="card" style={{ borderLeft: "4px solid #10b981" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🔒</span>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#065f46" }}>
                {t("demoStep5Title", lang)}
              </h2>
              <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                {t("demoStep5Desc", lang)}
              </p>
              <div style={{ marginTop: "0.75rem" }}>
                <Link
                  href="/review"
                  className="btn btn-primary"
                  style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", display: "inline-block" }}
                >
                  🚀 {t("demoStep5Btn", lang)}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Step 6: Heatwave Caseload & Evaluation Metrics */}
        <div className="card" style={{ borderLeft: "4px solid #ec4899" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.5rem" }}>📊</span>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#9d174d" }}>
                {t("demoStep6Title", lang)}
              </h2>
              <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                {t("demoStep6Desc", lang)}
              </p>
              <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                <Link
                  href="/heat"
                  className="btn btn-secondary"
                  style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", display: "inline-block" }}
                >
                  🌡️ {t("navHeat", lang)}
                </Link>
                <Link
                  href="/evaluate"
                  className="btn btn-primary"
                  style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", display: "inline-block" }}
                >
                  🚀 {t("demoStep6Btn", lang)}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
