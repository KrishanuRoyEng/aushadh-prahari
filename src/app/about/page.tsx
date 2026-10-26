"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { t, getLanguage, type Lang } from "@/lib/i18n";
import { deleteAllData } from "@/lib/db";

export default function AboutPage() {
  const [lang, setLang] = useState<Lang>("bn");
  const [deletedSuccess, setDeletedSuccess] = useState(false);

  useEffect(() => {
    setLang(getLanguage());
    const handleLangChange = () => setLang(getLanguage());
    window.addEventListener("ap-lang-change", handleLangChange);
    return () => window.removeEventListener("ap-lang-change", handleLangChange);
  }, []);

  async function handleDeleteAllData() {
    if (confirm(t("deleteConfirm", lang))) {
      await deleteAllData();
      setDeletedSuccess(true);
      setTimeout(() => setDeletedSuccess(false), 3000);
    }
  }

  return (
    <div className="page-content" style={{ paddingBottom: "5rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-primary-dark)" }}>
          ℹ️ {t("aboutTitle", lang)}
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
          {t("aboutSubtitle", lang)}
        </p>
      </div>

      {/* Mandatory Safety Disclaimer */}
      <div className="safety-disclaimer" style={{ marginBottom: "1rem", fontSize: "0.95rem" }}>
        🔒 {t("safetyDisclaimer", lang)}
      </div>

      {deletedSuccess && (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "#ecfdf5",
            border: "1.5px solid #6ee7b7",
            borderRadius: 8,
            color: "#065f46",
            fontWeight: 700,
            fontSize: "0.85rem",
            marginBottom: "1rem",
          }}
        >
          ✓ {t("saved", lang)}
        </div>
      )}

      {/* 1. NON-NEGOTIABLE CLINICAL SAFETY RULES */}
      <div className="card" style={{ marginBottom: "1rem", borderLeft: "4px solid var(--color-danger)" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-danger-dark)", marginBottom: "0.5rem" }}>
          {t("aboutSafetySection", lang)}
        </h2>
        <ul style={{ fontSize: "0.85rem", lineHeight: 1.7, paddingLeft: "1.2rem", color: "var(--color-text)" }}>
          <li>
            <strong>{t("aboutRuleEngineLabel", lang)}</strong> {t("safetyDisclaimer", lang)}
          </li>
          <li>
            <strong>{t("aboutAskDoctorLabel", lang)}</strong> {t("resultAskDoctorDesc", lang)}
          </li>
          <li>
            <strong>{t("aboutUrgentLabel", lang)}</strong> {t("resultUrgentDesc", lang)}
          </li>
        </ul>
      </div>

      {/* 2. PLACEHOLDER CONTENT NOTICE */}
      <div className="card" style={{ marginBottom: "1rem", borderLeft: "4px solid #7c3aed" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#5b21b6", marginBottom: "0.5rem" }}>
          {t("aboutLimitsSection", lang)}
        </h2>
        <p style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--color-text)" }}>
          {t("aboutUnvalidatedWarning", lang)}
        </p>
        <p style={{ fontSize: "0.85rem", lineHeight: 1.7, marginTop: "0.5rem", color: "var(--color-text)" }}>
          <span className="badge badge-unsigned">{t("unsignedBadge", lang)}</span>
        </p>
      </div>

      {/* 3. DPDP ACT 2023 PRIVACY ALIGNMENT */}
      <div className="card" style={{ marginBottom: "1rem", borderLeft: "4px solid var(--color-primary)" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-primary-dark)", marginBottom: "0.5rem" }}>
          {t("aboutPrivacySection", lang)}
        </h2>
        <ul style={{ fontSize: "0.85rem", lineHeight: 1.7, paddingLeft: "1.2rem", color: "var(--color-text)" }}>
          <li>{t("consentBody", lang)}</li>
          <li>{t("pinAutoLockNotice", lang)}</li>
        </ul>

        <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed var(--color-border)" }}>
          <button className="btn btn-danger btn-full" onClick={handleDeleteAllData}>
            🗑️ {t("deleteAll", lang)}
          </button>
        </div>
      </div>

      {/* 4. LANGUAGE AUDIT & CHECKS */}
      <div className="card" style={{ marginBottom: "1rem", borderLeft: "4px solid #0284c7" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0369a1", marginBottom: "0.5rem" }}>
          🌐 {t("langCheckTitle", lang)}
        </h2>
        <p style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--color-text)", marginBottom: "0.75rem" }}>
          {t("langCheckSubtitle", lang)}
        </p>
        <Link href="/about/language-check" className="btn btn-primary btn-full" style={{ textAlign: "center" }}>
          🔍 {t("aboutLanguageCheckLink", lang)} →
        </Link>
      </div>

      {/* 5. DATA SOURCES */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-text)", marginBottom: "0.5rem" }}>
          {t("aboutSourcesSection", lang)}
        </h2>
        <ul style={{ fontSize: "0.85rem", lineHeight: 1.7, paddingLeft: "1.2rem", color: "var(--color-text)" }}>
          <li>{t("aboutSourceOpenMeteo", lang)}</li>
          <li>{t("aboutSourceRules", lang)}</li>
          <li>{t("aboutSourceDPDP", lang)}</li>
        </ul>
      </div>

      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <Link href="/" className="btn btn-secondary">
          ⬅ {t("navHome", lang)}
        </Link>
      </div>
    </div>
  );
}
