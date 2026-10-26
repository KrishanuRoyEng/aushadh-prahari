"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  t,
  getLanguage,
  formatNumber,
  isIndicNumeralsEnabled,
  setIndicNumeralsEnabled,
  type Lang,
} from "@/lib/i18n";
import { getFontScale, setFontScale, type FontScale, getMOPhone, setMOPhone, deleteAllData } from "@/lib/privacy";
import { getPendingOutbox, getAllChecks } from "@/lib/db";

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("bn");
  const [fontScale, setFontScaleState] = useState<FontScale>(100);
  const [indicNums, setIndicNums] = useState(false);
  const [moPhone, setMoPhoneState] = useState("");
  const [pendingSync, setPendingSync] = useState(0);
  const [totalChecks, setTotalChecks] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    setLang(getLanguage());
    setFontScaleState(getFontScale());
    setIndicNums(isIndicNumeralsEnabled());
    setMoPhoneState(getMOPhone());
    getPendingOutbox().then((q) => setPendingSync(q.length));
    getAllChecks().then((c) => setTotalChecks(c.length));

    const handleLangChange = () => {
      setLang(getLanguage());
      setIndicNums(isIndicNumeralsEnabled());
    };
    window.addEventListener("ap-lang-change", handleLangChange);
    return () => window.removeEventListener("ap-lang-change", handleLangChange);
  }, []);

  function handleFontScale(scale: FontScale) {
    setFontScale(scale);
    setFontScaleState(scale);
  }

  function handleIndicToggle() {
    const next = !indicNums;
    setIndicNumeralsEnabled(next);
    setIndicNums(next);
  }

  function handleMOPhoneSave(phone: string) {
    setMOPhone(phone);
    setMoPhoneState(phone);
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMsg("");
    try {
      const outbox = await getPendingOutbox();
      if (outbox.length === 0) {
        setSyncMsg(t("syncUpToDate", lang));
        setSyncing(false);
        return;
      }
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: outbox.slice(0, 10) }),
      });
      if (res.ok) {
        const { markSynced } = await import("@/lib/db");
        for (const r of outbox.slice(0, 10)) await markSynced(r.id);
        setPendingSync(Math.max(0, outbox.length - 10));
        setSyncMsg(t("syncSuccess", lang));
      } else {
        setSyncMsg(t("syncFailed", lang));
      }
    } catch {
      setSyncMsg(t("syncOffline", lang));
    }
    setSyncing(false);
  }

  async function handleDeleteAll() {
    await deleteAllData();
    setShowDeleteConfirm(false);
    window.location.reload();
  }

  const menuItems = [
    {
      href: "/check",
      icon: "🩺",
      cls: "big-btn-green",
      title: t("homeNewCheck", lang),
      subtitle: t("homeNewCheckSubtitle", lang),
    },
    {
      href: "/heat",
      icon: "🌡️",
      cls: "big-btn-amber",
      title: t("homeHeatwave", lang),
      subtitle: t("homeHeatwaveSubtitle", lang),
    },
    {
      href: "/patients",
      icon: "👥",
      cls: "big-btn-blue",
      title: t("homePatients", lang),
      subtitle: t("homePatientsSubtitle", lang),
    },
    {
      href: "/review",
      icon: "🔬",
      cls: "big-btn-purple",
      title: t("homeReview", lang),
      subtitle: t("homeReviewSubtitle", lang),
    },
    {
      href: "/demo",
      icon: "✨",
      cls: "big-btn-teal",
      title: t("homeDemo", lang),
      subtitle: t("homeDemoSubtitle", lang),
    },
    {
      href: "/dashboard",
      icon: "📊",
      cls: "big-btn-blue",
      title: t("homeDashboard", lang),
      subtitle: t("homeDashboardSubtitle", lang),
    },
    {
      href: "/about",
      icon: "ℹ️",
      cls: "big-btn-red",
      title: t("homeAbout", lang),
      subtitle: t("homeAboutSubtitle", lang),
    },
  ];

  return (
    <div className="page-content">
      {/* App branding */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "3.5rem", lineHeight: 1, marginBottom: "0.5rem" }}>💊</div>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-primary-dark)" }}>
          {t("appName", lang)}
        </h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
          {t("appTagline", lang)}
        </p>
      </div>

      {/* Stats bar */}
      <div style={{
        display: "flex", gap: "0.75rem", marginBottom: "1.25rem",
        background: "var(--color-surface-2)", padding: "0.75rem", borderRadius: 12,
        border: "1.5px solid var(--color-border)"
      }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary)" }}>
            {formatNumber(totalChecks, lang)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {t("homeStatsTotalChecks", lang)}
          </div>
        </div>
        <div style={{ width: 1, background: "var(--color-border)" }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: pendingSync > 0 ? "var(--color-warning)" : "var(--color-success)" }}>
            {formatNumber(pendingSync, lang)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {t("homeStatsPendingSync", lang)}
          </div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <button
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "0.4rem 0.75rem", minHeight: 36 }}
            onClick={handleSync}
            disabled={syncing}
            aria-label={t("syncNow", lang)}
          >
            {syncing ? "⏳" : "🔄"} {t("syncNow", lang)}
          </button>
        </div>
      </div>

      {syncMsg && (
        <div style={{
          padding: "0.5rem 0.75rem", borderRadius: 8, marginBottom: "1rem",
          background: syncMsg.startsWith("✓") ? "#d1fae5" : "#fee2e2",
          color: syncMsg.startsWith("✓") ? "#065f46" : "#991b1b",
          fontSize: "0.85rem", fontWeight: 600
        }}>
          {syncMsg}
        </div>
      )}

      {/* Main menu */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "1.5rem" }}>
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href} className={`big-btn ${item.cls}`} aria-label={item.title}>
            <div className="big-btn-icon" aria-hidden="true">{item.icon}</div>
            <div className="big-btn-text">
              <span className="big-btn-title">{item.title}</span>
              <span className="big-btn-subtitle">{item.subtitle}</span>
            </div>
            <span aria-hidden="true" style={{ fontSize: "1.5rem", opacity: 0.7 }}>›</span>
          </Link>
        ))}
      </div>

      {/* Settings section */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="section-title" style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>
          {t("settingsTitle", lang)}
        </div>

        {/* Font scale */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
            {t("settingsFontScale", lang)}
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {([100, 125, 150] as FontScale[]).map((scale) => (
              <button
                key={scale}
                className={`btn ${fontScale === scale ? "btn-primary" : "btn-secondary"}`}
                style={{ flex: 1, fontSize: "0.85rem", padding: "0.5rem" }}
                onClick={() => handleFontScale(scale)}
                aria-pressed={fontScale === scale}
              >
                {scale}%
              </button>
            ))}
          </div>
        </div>

        {/* Indic Numerals Setting */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>
            <input
              type="checkbox"
              checked={indicNums}
              onChange={handleIndicToggle}
              style={{ width: 18, height: 18 }}
            />
            <span>{t("settingsIndicNumerals", lang)}</span>
          </label>
        </div>

        {/* MO Phone */}
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="mo-phone" style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
            📞 {t("settingsMOPhone", lang)}
          </label>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
            {t("settingsMOPhoneHelp", lang)}
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              id="mo-phone"
              className="input"
              type="tel"
              placeholder={t("settingsMOPhonePlaceholder", lang)}
              value={moPhone}
              onChange={(e) => setMoPhoneState(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-primary"
              style={{ flexShrink: 0, padding: "0.5rem 1rem" }}
              onClick={() => handleMOPhoneSave(moPhone)}
            >
              {t("save", lang)}
            </button>
          </div>
        </div>

        {/* Delete data */}
        <div>
          {!showDeleteConfirm ? (
            <button
              className="btn btn-danger btn-full"
              style={{ fontSize: "0.9rem" }}
              onClick={() => setShowDeleteConfirm(true)}
            >
              🗑️ {t("settingsDeleteData", lang)}
            </button>
          ) : (
            <div style={{ background: "#fef2f2", border: "2px solid var(--color-danger)", borderRadius: 10, padding: "1rem" }}>
              <p style={{ fontWeight: 700, color: "var(--color-danger)", marginBottom: "0.75rem", textAlign: "center" }}>
                ⚠️ {t("deleteConfirm", lang)}
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(false)}>
                  {t("cancel", lang)}
                </button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDeleteAll}>
                  {t("delete", lang)}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Safety disclaimer */}
      <div className="safety-disclaimer">
        🔒 {t("safetyDisclaimer", lang)}
      </div>

      <div style={{ textAlign: "center", marginTop: "1rem", marginBottom: "0.5rem" }}>
        <Link href="/about/language-check" style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
          {t("aboutLanguageCheckLink", lang)}
        </Link>
        {" · "}
        <Link href="/evaluate" style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
          {t("navEvaluate", lang)}
        </Link>
        {" · "}
        <Link href="/about" style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
          {t("navAbout", lang)}
        </Link>
      </div>
    </div>
  );
}
