"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { t, getLanguage, formatDate, type Lang } from "@/lib/i18n";
import {
  getPendingReviews,
  updateReviewItem,
  savePendingReview,
} from "@/lib/db";
import type { PendingReviewItem, DrugClass, Rule, BrandEntry } from "@/lib/schemas";
import RULES from "@/lib/ruleTable";
import { BRANDS_DICT, mergeBrandEntries, exportBrandsCSV, parseBrandsCSV, getBrandDisplayName } from "@/lib/brands";
import {
  isPinSet,
  setPin,
  verifyPin,
  changePin,
  isSessionActive,
  setSessionActive,
  lockSession,
  touchActivity,
  getLockoutRemainingSeconds,
  getSavedReviewer,
  saveReviewer,
  PIN_CONFIG,
} from "@/lib/pinAuth";

const DRUG_CLASSES: DrugClass[] = [
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

export default function ReviewPage() {
  const [lang, setLang] = useState<Lang>("bn");

  // PIN Auth States
  const [pinConfigured, setPinConfigured] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinConfirmInput, setPinConfirmInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Change PIN modal
  const [showChangePin, setShowChangePin] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [changePinMsg, setChangePinMsg] = useState<string | null>(null);

  // Reviewer credentials
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerReg, setReviewerReg] = useState("");
  const [showReviewerEdit, setShowReviewerEdit] = useState(false);

  // Tabs and items
  const [tab, setTab] = useState<"brands" | "rules">("brands");
  const [pendingItems, setPendingItems] = useState<PendingReviewItem[]>([]);
  const [rulesList, setRulesList] = useState<Rule[]>([...RULES]);
  const [editingBrand, setEditingBrand] = useState<PendingReviewItem | null>(null);
  const [editClass, setEditClass] = useState<DrugClass>("unknown");
  const [notice, setNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLang(getLanguage());
    const hasPin = isPinSet();
    setPinConfigured(hasPin);
    if (hasPin) {
      const active = isSessionActive();
      setAuthenticated(active);
    }

    const reviewer = getSavedReviewer();
    setReviewerName(reviewer.name || "Dr. Ananya Roy, MO");
    setReviewerReg(reviewer.reg || "WBMC-58291");

    loadPendingItems();
    loadRulesFromStorage();

    // Auto-lock and activity listeners
    const handleActivity = () => {
      touchActivity();
    };
    window.addEventListener("pointerdown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity);

    const interval = setInterval(() => {
      const remaining = getLockoutRemainingSeconds();
      setLockoutSeconds(remaining);
      if (authenticated && !isSessionActive()) {
        setAuthenticated(false);
        setAuthError(t("pinAutoLockNotice", getLanguage()));
      }
    }, 1000);

    const handleLangChange = () => setLang(getLanguage());
    window.addEventListener("ap-lang-change", handleLangChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("ap-lang-change", handleLangChange);
    };
  }, [authenticated]);

  async function loadPendingItems() {
    const items = await getPendingReviews();
    setPendingItems(items);
  }

  function loadRulesFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("ap_rules_signed");
      if (stored) {
        const signedIds = JSON.parse(stored) as string[];
        setRulesList(
          RULES.map((r) => ({
            ...r,
            signedOff: signedIds.includes(r.id),
          }))
        );
      }
    } catch {}
  }

  // ─── Setup First-Time PIN ──────────────────────────────────────────────────

  async function handleSetInitialPin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);

    if (pinInput.length < PIN_CONFIG.MIN_LENGTH || pinInput.length > PIN_CONFIG.MAX_LENGTH) {
      setAuthError(t("pinDescSetup", lang));
      return;
    }
    if (pinInput !== pinConfirmInput) {
      setAuthError(t("pinErrorWrong", lang));
      return;
    }

    const res = await setPin(pinInput);
    if (res.success) {
      setPinConfigured(true);
      setAuthenticated(true);
      setPinInput("");
      setPinConfirmInput("");
    } else {
      setAuthError(res.error || t("pinErrorWrong", lang));
    }
  }

  // ─── Login with Existing PIN ───────────────────────────────────────────────

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);

    const res = await verifyPin(pinInput);
    if (res.success) {
      setAuthenticated(true);
      setPinInput("");
      setRemainingAttempts(null);
    } else {
      if (res.error === "LOCKED_OUT") {
        setLockoutSeconds(res.lockoutSeconds || 30);
        setAuthError(t("pinLockedOut", lang));
      } else {
        setRemainingAttempts(res.remainingAttempts ?? null);
        setAuthError(t("pinErrorWrong", lang));
      }
    }
  }

  // ─── Logout ────────────────────────────────────────────────────────────────

  function handleLogout() {
    lockSession();
    setAuthenticated(false);
    setPinInput("");
    setAuthError(null);
  }

  // ─── Change PIN ────────────────────────────────────────────────────────────

  async function handleChangePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChangePinMsg(null);
    if (newPin.length < PIN_CONFIG.MIN_LENGTH || newPin.length > PIN_CONFIG.MAX_LENGTH) {
      setChangePinMsg(t("pinDescSetup", lang));
      return;
    }
    const res = await changePin(oldPin, newPin);
    if (res.success) {
      setChangePinMsg(t("pinChangeSuccess", lang));
      setTimeout(() => {
        setShowChangePin(false);
        setOldPin("");
        setNewPin("");
        setChangePinMsg(null);
      }, 1500);
    } else {
      setChangePinMsg(res.error || t("pinErrorWrong", lang));
    }
  }

  function handleSaveReviewerProfile(e: React.FormEvent) {
    e.preventDefault();
    saveReviewer(reviewerName, reviewerReg);
    setShowReviewerEdit(false);
    setNotice(t("saved", lang));
    setTimeout(() => setNotice(null), 2500);
  }

  // ─── Approval & Rejection Logic ────────────────────────────────────────────

  async function handleApproveBrand(item: PendingReviewItem, finalClass?: DrugClass) {
    const approvedClass: DrugClass = finalClass || item.suggestedClass || "unknown";
    const updated: PendingReviewItem = {
      ...item,
      status: "approved",
      reviewedBy: `${reviewerName} (${reviewerReg})`,
      reviewedAt: new Date().toISOString(),
    };
    await updateReviewItem(updated);

    const brandName = item.brand || "";
    const newBrandEntry: BrandEntry = {
      brand: brandName,
      brandBn: brandName,
      salt: brandName,
      classes: [approvedClass],
      signedOff: true,
      source: `Physician verified: ${reviewerName} (${reviewerReg}) on ${new Date().toISOString().split("T")[0]}`,
      reviewerName,
      reviewedAt: new Date().toISOString(),
    };
    mergeBrandEntries([newBrandEntry]);

    setNotice(t("saved", lang));
    setEditingBrand(null);
    await loadPendingItems();
    setTimeout(() => setNotice(null), 2500);
  }

  async function handleRejectBrand(item: PendingReviewItem) {
    const updated: PendingReviewItem = {
      ...item,
      status: "rejected",
      reviewedBy: `${reviewerName} (${reviewerReg})`,
      reviewedAt: new Date().toISOString(),
    };
    await updateReviewItem(updated);
    setNotice(t("saved", lang));
    await loadPendingItems();
    setTimeout(() => setNotice(null), 2500);
  }

  function handleSignOffRule(ruleId: string) {
    const updated = rulesList.map((r) => {
      if (r.id === ruleId) {
        return { ...r, signedOff: true };
      }
      return r;
    });
    setRulesList(updated);

    const signedIds = updated.filter((r) => r.signedOff).map((r) => r.id);
    localStorage.setItem("ap_rules_signed", JSON.stringify(signedIds));

    setNotice(t("saved", lang));
    setTimeout(() => setNotice(null), 2500);
  }

  // ─── CSV Import / Export ───────────────────────────────────────────────────

  function handleExportCSV() {
    const csv = exportBrandsCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aushadh-prahari-brands-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportJSON() {
    const data = {
      exportedAt: new Date().toISOString(),
      reviewer: { name: reviewerName, reg: reviewerReg },
      brands: Object.values(BRANDS_DICT),
      rules: rulesList,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aushadh-prahari-audit-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const entries = parseBrandsCSV(text);
        mergeBrandEntries(entries);
        setNotice(t("importSuccess", { count: entries.length }, lang));
        setTimeout(() => setNotice(null), 3000);
      } catch {
        setNotice(t("importError", lang));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // ─── Render: Setup PIN Screen (First-Time User) ─────────────────────────────

  if (!pinConfigured) {
    return (
      <div className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <div className="card" style={{ maxWidth: 440, width: "100%", padding: "1.75rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔐</div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-primary-dark)", marginBottom: "0.5rem" }}>
            {t("pinTitleSetup", lang)}
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "1.25rem" }}>
            {t("pinDescSetup", lang)}
          </p>

          <form onSubmit={handleSetInitialPin} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              type="password"
              inputMode="numeric"
              maxLength={PIN_CONFIG.MAX_LENGTH}
              className="input"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
              placeholder={t("pinInputSetup", lang)}
              autoFocus
              style={{ textAlign: "center", fontSize: "1.2rem", letterSpacing: "0.3em" }}
            />
            <input
              type="password"
              inputMode="numeric"
              maxLength={PIN_CONFIG.MAX_LENGTH}
              className="input"
              value={pinConfirmInput}
              onChange={(e) => setPinConfirmInput(e.target.value.replace(/\D/g, ""))}
              placeholder={t("pinConfirmSetup", lang)}
              style={{ textAlign: "center", fontSize: "1.2rem", letterSpacing: "0.3em" }}
            />

            {authError && (
              <div style={{ color: "var(--color-danger)", fontSize: "0.85rem", fontWeight: 700 }}>
                ⚠️ {authError}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: "0.5rem" }}>
              {t("pinBtnSet", lang)}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Render: PIN Login Screen ───────────────────────────────────────────────

  if (!authenticated) {
    return (
      <div className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <div className="card" style={{ maxWidth: 420, width: "100%", padding: "1.75rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔒</div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-primary-dark)", marginBottom: "0.5rem" }}>
            {t("pinTitleLogin", lang)}
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "1.25rem" }}>
            {t("pinDescLogin", lang)}
          </p>

          {lockoutSeconds > 0 ? (
            <div style={{ background: "#fee2e2", border: "1.5px solid #ef4444", borderRadius: 10, padding: "1rem", color: "#991b1b" }}>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                ⏳ {t("pinLockedOut", lang)}
              </div>
              <div style={{ fontSize: "0.85rem" }}>
                {t("pinLockedOutWait", { seconds: lockoutSeconds }, lang)}
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="password"
                inputMode="numeric"
                maxLength={PIN_CONFIG.MAX_LENGTH}
                className="input"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                placeholder={t("pinInputLogin", lang)}
                autoFocus
                style={{ textAlign: "center", fontSize: "1.3rem", letterSpacing: "0.3em" }}
              />

              {authError && (
                <div style={{ color: "var(--color-danger)", fontSize: "0.85rem", fontWeight: 700 }}>
                  ⚠️ {authError}
                </div>
              )}

              {remainingAttempts !== null && remainingAttempts > 0 && (
                <div style={{ fontSize: "0.8rem", color: "#b45309" }}>
                  {t("pinAttemptsRemaining", { remaining: remainingAttempts }, lang)}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: "0.5rem" }}>
                {t("pinBtnLogin", lang)}
              </button>
            </form>
          )}

          <div style={{ marginTop: "1.25rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {t("pinAutoLockNotice", lang)}
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Authenticated Review Queue Screen ──────────────────────────────

  return (
    <div className="page-content" style={{ paddingBottom: "5rem" }}>
      {/* Top Controls Bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.5rem",
        marginBottom: "1rem",
        background: "var(--color-surface-2)",
        padding: "0.75rem",
        borderRadius: 12,
        border: "1.5px solid var(--color-border)",
      }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-primary-dark)" }}>
            {reviewerName}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: "0.5rem" }}>
            ({reviewerReg})
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", minHeight: 32 }}
            onClick={() => setShowReviewerEdit(!showReviewerEdit)}
          >
            👤 {t("edit", lang)}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", minHeight: 32 }}
            onClick={() => setShowChangePin(true)}
          >
            🔑 {t("pinTitleChange", lang)}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", minHeight: 32 }}
            onClick={handleLogout}
          >
            🔒 {t("pinBtnLogout", lang)}
          </button>
        </div>
      </div>

      {/* Reviewer Credentials Edit Box */}
      {showReviewerEdit && (
        <form onSubmit={handleSaveReviewerProfile} className="card" style={{ marginBottom: "1rem" }}>
          <h4 style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.5rem" }}>
            {t("reviewerProfileSave", lang)}
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>{t("reviewerNameLabel", lang)}</label>
              <input
                type="text"
                className="input"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>{t("reviewerRegLabel", lang)}</label>
              <input
                type="text"
                className="input"
                value={reviewerReg}
                onChange={(e) => setReviewerReg(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ fontSize: "0.85rem" }}>
            {t("save", lang)}
          </button>
        </form>
      )}

      {/* Change PIN Modal Dialog */}
      {showChangePin && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem",
        }}>
          <form onSubmit={handleChangePinSubmit} className="card" style={{ maxWidth: 380, width: "100%", background: "white" }}>
            <h3 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.75rem", color: "var(--color-primary-dark)" }}>
              🔑 {t("pinTitleChange", lang)}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
              <input
                type="password"
                inputMode="numeric"
                maxLength={PIN_CONFIG.MAX_LENGTH}
                className="input"
                placeholder={t("pinOldInput", lang)}
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))}
                required
              />
              <input
                type="password"
                inputMode="numeric"
                maxLength={PIN_CONFIG.MAX_LENGTH}
                className="input"
                placeholder={t("pinNewInput", lang)}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>

            {changePinMsg && (
              <div style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: changePinMsg.startsWith("✓") ? "var(--color-success)" : "var(--color-danger)",
                marginBottom: "0.75rem",
              }}>
                {changePinMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => { setShowChangePin(false); setChangePinMsg(null); }}
              >
                {t("cancel", lang)}
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {t("pinBtnChange", lang)}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Action Notification */}
      {notice && (
        <div style={{
          background: notice.startsWith("✓") ? "#d1fae5" : "#fee2e2",
          color: notice.startsWith("✓") ? "#065f46" : "#991b1b",
          padding: "0.6rem 0.8rem",
          borderRadius: 8,
          marginBottom: "1rem",
          fontWeight: 700,
          fontSize: "0.85rem",
        }}>
          {notice}
        </div>
      )}

      {/* Audit Export & Import Toolbar */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button
          className="btn btn-secondary"
          style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", minHeight: 34 }}
          onClick={handleExportCSV}
        >
          📥 {t("exportCSV", lang)}
        </button>
        <button
          className="btn btn-secondary"
          style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", minHeight: 34 }}
          onClick={handleExportJSON}
        >
          📑 {t("exportJSON", lang)}
        </button>
        <button
          className="btn btn-secondary"
          style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", minHeight: 34 }}
          onClick={() => fileInputRef.current?.click()}
        >
          📤 {t("importCSV", lang)}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleImportFile}
          style={{ display: "none" }}
        />
      </div>

      {/* Tab Selectors */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          className={`btn ${tab === "brands" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("brands")}
          style={{ fontSize: "0.9rem" }}
        >
          {t("reviewTabBrands", { count: pendingItems.length }, lang)}
        </button>
        <button
          className={`btn ${tab === "rules" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("rules")}
          style={{ fontSize: "0.9rem" }}
        >
          {t("reviewTabRules", { count: rulesList.filter((r) => !r.signedOff).length }, lang)}
        </button>
      </div>

      {/* ────────────────── TAB 1: PENDING BRANDS ────────────────── */}
      {tab === "brands" && (
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-primary-dark)" }}>
            {t("reviewPendingBrands", lang)}
          </h3>

          {pendingItems.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
              {t("reviewNoPendingBrands", lang)}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {pendingItems.map((item) => (
                <div key={item.id} className="card" style={{ border: "1.5px solid var(--color-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>
                        {getBrandDisplayName(item.brand || "", lang)}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                        {t("customClassLabel", lang)}: <strong>{t(`drugClass_${item.suggestedClass || "unknown"}` as any, lang)}</strong>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                        {item.source || ""} · {item.createdAt ? formatDate(item.createdAt, lang) : ""}
                      </div>
                    </div>
                    <span className="badge badge-pending">
                      {t("brandStatusPendingReview", lang)}
                    </span>
                  </div>

                  {editingBrand?.id === item.id ? (
                    <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "#f8fafc", borderRadius: 8 }}>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>
                        {t("customClassLabel", lang)}
                      </label>
                      <select
                        className="input"
                        value={editClass}
                        onChange={(e) => setEditClass(e.target.value as DrugClass)}
                        style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}
                      >
                        {DRUG_CLASSES.map((cls) => (
                          <option key={cls} value={cls}>
                            {t(`drugClass_${cls}` as any, lang)}
                          </option>
                        ))}
                      </select>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="btn btn-primary"
                          style={{ flex: 1, fontSize: "0.8rem" }}
                          onClick={() => handleApproveBrand(item, editClass)}
                        >
                          {t("reviewSave", lang)}
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ flex: 1, fontSize: "0.8rem" }}
                          onClick={() => setEditingBrand(null)}
                        >
                          {t("cancel", lang)}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 2, fontSize: "0.85rem", minHeight: 36 }}
                        onClick={() => handleApproveBrand(item)}
                      >
                        ✓ {t("reviewApprove", lang)}
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ flex: 1, fontSize: "0.85rem", minHeight: 36 }}
                        onClick={() => {
                          setEditingBrand(item);
                          setEditClass(item.suggestedClass || "unknown");
                        }}
                      >
                        ✏️ {t("reviewEdit", lang)}
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ flex: 1, fontSize: "0.85rem", minHeight: 36 }}
                        onClick={() => handleRejectBrand(item)}
                      >
                        ✕ {t("reviewReject", lang)}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────── TAB 2: UNSIGNED RULES ────────────────── */}
      {tab === "rules" && (
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-primary-dark)" }}>
            {t("reviewUnsignedRules", lang)}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {rulesList.map((rule) => {
              const ruleKey = `rule_${rule.id.replace("-", "")}`;
              const ruleGuidance = rule.text[lang] || t(ruleKey as any, lang) || rule.text.en;

              return (
                <div key={rule.id} className="card" style={{ border: "1.5px solid var(--color-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--color-text)" }}>
                      {rule.id}
                    </span>
                    {rule.signedOff ? (
                      <span className="badge badge-verified">{t("ruleSignedOffBadge", lang)}</span>
                    ) : (
                      <span className="badge badge-unsigned">{t("ruleUnsignedBadge", lang)}</span>
                    )}
                  </div>

                  <p style={{ fontSize: "0.9rem", color: "var(--color-text)", marginBottom: "0.5rem", lineHeight: 1.5 }}>
                    {ruleGuidance}
                  </p>

                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                    {rule.source}
                  </div>

                  {!rule.signedOff && (
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: "0.85rem", minHeight: 36 }}
                      onClick={() => handleSignOffRule(rule.id)}
                    >
                      ✍️ {t("ruleSignOffBtn", lang)}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
