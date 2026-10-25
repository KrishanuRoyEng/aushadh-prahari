"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { t, getLanguage, type Lang } from "@/lib/i18n";
import { getFontScale, setFontScale, type FontScale, getMOPhone, setMOPhone, deleteAllData } from "@/lib/privacy";
import { getPendingOutbox, getAllChecks } from "@/lib/db";

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("bn");
  const [fontScale, setFontScaleState] = useState<FontScale>(100);
  const [moPhone, setMoPhoneState] = useState("");
  const [pendingSync, setPendingSync] = useState(0);
  const [totalChecks, setTotalChecks] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    setLang(getLanguage());
    setFontScaleState(getFontScale());
    setMoPhoneState(getMOPhone());
    getPendingOutbox().then((q) => setPendingSync(q.length));
    getAllChecks().then((c) => setTotalChecks(c.length));
  }, []);

  function handleFontScale(scale: FontScale) {
    setFontScale(scale);
    setFontScaleState(scale);
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
      if (outbox.length === 0) { setSyncMsg("✓ আপ টু ডেট"); setSyncing(false); return; }
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: outbox.slice(0, 10) }),
      });
      if (res.ok) {
        const { markSynced } = await import("@/lib/db");
        for (const r of outbox.slice(0, 10)) await markSynced(r.id);
        setPendingSync(Math.max(0, outbox.length - 10));
        setSyncMsg("✓ সিঙ্ক সম্পন্ন");
      } else {
        setSyncMsg("✗ সিঙ্ক ব্যর্থ — পুনরায় চেষ্টা করুন");
      }
    } catch {
      setSyncMsg("✗ অফলাইন — পরে চেষ্টা করুন");
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
      subtitle: "অসুস্থ রোগীর ওষুধ পরীক্ষা করুন",
    },
    {
      href: "/heat",
      icon: "🌡️",
      cls: "big-btn-amber",
      title: t("homeHeatwave", lang),
      subtitle: "তাপপ্রবাহে ঝুঁকিপূর্ণ রোগীদের তালিকা",
    },
    {
      href: "/patients",
      icon: "👥",
      cls: "big-btn-blue",
      title: t("homePatients", lang),
      subtitle: "রোগী যোগ করুন ও দেখুন",
    },
    {
      href: "/review",
      icon: "🔬",
      cls: "big-btn-purple",
      title: t("homeReview", lang),
      subtitle: "ব্র্যান্ড ও নিয়ম অনুমোদন করুন",
    },
    {
      href: "/dashboard",
      icon: "📊",
      cls: "big-btn-teal",
      title: t("navDashboard", lang),
      subtitle: "পরিসংখ্যান ও ডেমো ডেটা",
    },
    {
      href: "/about",
      icon: "ℹ️",
      cls: "big-btn-red",
      title: t("homeAbout", lang),
      subtitle: "সীমাবদ্ধতা, গোপনীয়তা, উৎস",
    },
  ];

  return (
    <div className="page-content">
      {/* App branding */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "3.5rem", lineHeight: 1, marginBottom: "0.5rem" }}>💊</div>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-primary-dark)" }}>
          ঔষধ প্রহরী
        </h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
          CHO ও ASHA-দের জন্য ওষুধ রক্ষক
        </p>
      </div>

      {/* Stats bar */}
      <div style={{
        display: "flex", gap: "0.75rem", marginBottom: "1.25rem",
        background: "var(--color-surface-2)", padding: "0.75rem", borderRadius: 12,
        border: "1.5px solid var(--color-border)"
      }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary)" }}>{totalChecks}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>মোট চেক</div>
        </div>
        <div style={{ width: 1, background: "var(--color-border)" }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: pendingSync > 0 ? "var(--color-warning)" : "var(--color-success)" }}>
            {pendingSync}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>সিঙ্ক বাকি</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <button
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "0.4rem 0.75rem", minHeight: 36 }}
            onClick={handleSync}
            disabled={syncing}
            aria-label="Sync data"
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
        <div className="section-title" style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>⚙️ সেটিংস</div>

        {/* Font scale */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
            {t("fontScaleLabel", lang)}
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

        {/* MO Phone */}
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="mo-phone" style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
            📞 MO ফোন নম্বর
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              id="mo-phone"
              className="input"
              type="tel"
              placeholder="+91 98765 43210"
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
              🗑️ {t("deleteAll", lang)}
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
