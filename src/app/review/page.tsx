"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { t, getLanguage, type Lang } from "@/lib/i18n";
import {
  getPendingReviews,
  updateReviewItem,
  savePendingReview,
  type CheckRecord,
} from "@/lib/db";
import type { PendingReviewItem, DrugClass, Rule, BrandEntry } from "@/lib/schemas";
import RULES from "@/lib/ruleTable";
import { BRANDS_DICT, mergeBrandEntries, exportBrandsCSV, parseBrandsCSV } from "@/lib/brands";

const ALL_DRUG_CLASSES: { id: DrugClass; label: string }[] = [
  { id: "ace_inhibitor", label: "ACE Inhibitor" },
  { id: "arb", label: "ARB" },
  { id: "diuretic_loop", label: "Loop Diuretic" },
  { id: "diuretic_thiazide", label: "Thiazide Diuretic" },
  { id: "sglt2_inhibitor", label: "SGLT2 Inhibitor" },
  { id: "metformin", label: "Metformin" },
  { id: "sulfonylurea", label: "Sulfonylurea" },
  { id: "nsaid", label: "NSAID" },
  { id: "other", label: "Other / Unflagged" },
  { id: "unknown", label: "Unknown class" },
];

export default function ReviewPage() {
  const [lang, setLang] = useState<Lang>("bn");
  // Simple local PIN authentication (document that this is lightweight protection)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const [tab, setTab] = useState<"brands" | "rules">("brands");

  // Reviewer credentials
  const [reviewerName, setReviewerName] = useState("Dr. Ananya Roy, MO");
  const [reviewerReg, setReviewerReg] = useState("WBMC-58291");

  // Pending brands from DB and dictionary
  const [pendingItems, setPendingItems] = useState<PendingReviewItem[]>([]);
  const [rulesList, setRulesList] = useState<Rule[]>([...RULES]);
  const [editingBrand, setEditingBrand] = useState<PendingReviewItem | null>(null);
  const [editClass, setEditClass] = useState<DrugClass>("unknown");

  // Import / Export notification
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setLang(getLanguage());
    loadPendingItems();
    loadRulesFromStorage();
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    // Default PIN: 1234
    if (pinInput === "1234") {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  }

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

  // Approve a pending AI brand suggestion
  async function handleApproveBrand(item: PendingReviewItem, finalClass?: DrugClass) {
    const approvedClass: DrugClass = finalClass || item.suggestedClass || "unknown";
    const updated: PendingReviewItem = {
      ...item,
      status: "approved",
      reviewedBy: `${reviewerName} (${reviewerReg})`,
      reviewedAt: new Date().toISOString(),
    };
    await updateReviewItem(updated);

    // Merge into runtime dictionary
    const brandName = item.brand || "Unknown";
    const newEntry: BrandEntry = {
      brand: brandName,
      salt: `Approved salt for ${brandName}`,
      genericSalt: `Approved salt for ${brandName}`,
      classes: [approvedClass],
      signedOff: true,
      source: `Signed off by ${reviewerName} (${reviewerReg}) on ${new Date().toISOString().split("T")[0]}`,
    };
    mergeBrandEntries([newEntry]);

    setNotice(`✓ Approved brand "${brandName}" as ${approvedClass}.`);
    setEditingBrand(null);
    await loadPendingItems();
  }

  async function handleRejectBrand(item: PendingReviewItem) {
    const updated: PendingReviewItem = {
      ...item,
      status: "rejected",
      reviewedBy: `${reviewerName} (${reviewerReg})`,
      reviewedAt: new Date().toISOString(),
    };
    await updateReviewItem(updated);
    setNotice(`✕ Rejected brand "${item.brand}".`);
    await loadPendingItems();
  }

  // Sign off or un-sign a rule
  function handleToggleRuleSignOff(ruleId: string) {
    const updated = rulesList.map((r) => {
      if (r.id === ruleId) {
        return {
          ...r,
          signedOff: !r.signedOff,
          source: !r.signedOff
            ? `Clinician sign-off: ${reviewerName} (${reviewerReg}) on ${new Date().toISOString().split("T")[0]}`
            : "TO BE VERIFIED by physician/pharmacist",
        };
      }
      return r;
    });
    setRulesList(updated);

    // Persist signed rule IDs to localStorage
    const signedIds = updated.filter((r) => r.signedOff).map((r) => r.id);
    localStorage.setItem("ap_rules_signed", JSON.stringify(signedIds));
    setNotice(`Updated sign-off status for rule: ${ruleId}`);
  }

  // Export dictionary as JSON
  function handleExportBrandsJSON() {
    const blob = new Blob([JSON.stringify(Object.values(BRANDS_DICT), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aushadh-brands-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export dictionary as CSV
  function handleExportBrandsCSV() {
    const csv = exportBrandsCSV(Object.values(BRANDS_DICT));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aushadh-brands-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import brands from CSV
  function handleImportBrandsCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const entries = parseBrandsCSV(text);
        mergeBrandEntries(entries);
        setNotice(`✓ Successfully imported ${entries.length} brand entries from CSV.`);
      } catch (err) {
        setNotice("Error parsing CSV file.");
      }
    };
    reader.readAsText(file);
  }

  // Export Rules Table as JSON
  function handleExportRulesJSON() {
    const blob = new Blob([JSON.stringify(rulesList, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aushadh-rules-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // PIN Login Gate
  if (!isAuthenticated) {
    return (
      <div className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "75vh" }}>
        <div className="card" style={{ maxWidth: 380, width: "100%", textAlign: "center", padding: "2rem 1.5rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔒</div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-primary-dark)", marginBottom: "0.25rem" }}>
            ফার্মাসিস্ট / চিকিৎসক প্রবেশাধিকার
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
            Pharmacist & Physician Review Queue (Default PIN: 1234)
          </p>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              className="input"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN (1234)"
              style={{ textAlign: "center", fontSize: "1.2rem", letterSpacing: "0.2em", marginBottom: "0.75rem" }}
              autoFocus
            />

            {pinError && (
              <p style={{ color: "var(--color-danger)", fontSize: "0.8rem", marginBottom: "0.75rem", fontWeight: 600 }}>
                ভুল পিন কোড! ডিফল্ট পিন হল 1234
              </p>
            )}

            <button type="submit" className="btn btn-primary btn-full" style={{ fontSize: "1rem" }}>
              লগইন করুন (Enter) ➔
            </button>
          </form>

          <p style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: "1rem" }}>
            * Note: This simple local PIN serves as an access boundary for demonstration. Production deployments must integrate institution SSO.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ paddingBottom: "5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-primary-dark)" }}>
            🔬 {t("homeReview", lang)}
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            ওষুধের শ্রেণী ও ক্লিনিক্যাল নিয়ম পর্যালোচনা এবং স্বাক্ষর (Review Queue).
          </p>
        </div>
        <button
          className="btn btn-secondary"
          style={{ minHeight: 32, padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
          onClick={() => setIsAuthenticated(false)}
        >
          লগআউট (Logout)
        </button>
      </div>

      {notice && (
        <div
          style={{
            padding: "0.6rem 0.8rem",
            borderRadius: 8,
            background: "#ecfdf5",
            border: "1.5px solid #a7f3d0",
            color: "#065f46",
            fontWeight: 600,
            fontSize: "0.85rem",
            marginBottom: "1rem",
          }}
        >
          {notice}
        </div>
      )}

      {/* Reviewer Credentials Card */}
      <div className="card" style={{ marginBottom: "1rem", background: "#f8fafc" }}>
        <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
          পর্যালোচকের তথ্য (Reviewer Details for Signature):
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>নাম ও পদবী (Name & Role)</label>
            <input
              type="text"
              className="input"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              style={{ minHeight: 36, padding: "0.4rem" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>রেজিস্ট্রেশন নং (Registration No)</label>
            <input
              type="text"
              className="input"
              value={reviewerReg}
              onChange={(e) => setReviewerReg(e.target.value)}
              style={{ minHeight: 36, padding: "0.4rem" }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          type="button"
          onClick={() => setTab("brands")}
          className={`btn ${tab === "brands" ? "btn-primary" : "btn-secondary"}`}
          style={{ fontSize: "0.9rem" }}
        >
          💊 ব্র্যান্ড শ্রেণী পর্যালোচনা ({pendingItems.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("rules")}
          className={`btn ${tab === "rules" ? "btn-primary" : "btn-secondary"}`}
          style={{ fontSize: "0.9rem" }}
        >
          📜 ক্লিনিক্যাল নিয়ম স্বাক্ষর ({rulesList.filter((r) => !r.signedOff).length} Unsigned)
        </button>
      </div>

      {/* ────────────────── TAB 1: BRANDS REVIEW ────────────────── */}
      {tab === "brands" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>AI প্রস্তাবিত ও অজানা ব্র্যান্ড তালিকা:</h2>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ minHeight: 28, padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                onClick={handleExportBrandsCSV}
              >
                CSV Export
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ minHeight: 28, padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                onClick={handleExportBrandsJSON}
              >
                JSON Export
              </button>
              <label
                className="btn btn-secondary"
                style={{ minHeight: 28, padding: "0.2rem 0.5rem", fontSize: "0.75rem", cursor: "pointer" }}
              >
                CSV Import
                <input type="file" accept=".csv" onChange={handleImportBrandsCSV} style={{ display: "none" }} />
              </label>
            </div>
          </div>

          {pendingItems.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
              <span style={{ fontSize: "2rem" }}>✓</span>
              <p style={{ marginTop: "0.5rem", fontWeight: 600 }}>
                কোনো ব্র্যান্ড পর্যালোচনা অপেক্ষমান নেই (No pending brand suggestions in queue).
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                ব্যবহারকারী যখন চেক প্রবাহে অজানা ওষুধের জন্য "Ask AI" বোতাম চাপেন, তখন এখানে জমা হয়।
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {pendingItems.map((item) => (
                <div key={item.id} className="card" style={{ borderLeft: "4px solid #f59e0b" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>{item.brand}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                        AI Suggested Class: <strong>{item.suggestedClass}</strong> (Confidence:{" "}
                        {Math.round((item.confidence ?? 0) * 100)}%)
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                        Requested: {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <span className="badge badge-pending">Pending Review</span>
                  </div>

                  {editingBrand?.id === item.id ? (
                    <div style={{ marginTop: "0.75rem", background: "#f8fafc", padding: "0.5rem", borderRadius: 8 }}>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>
                        সঠিক ওষুধ শ্রেণী নির্বাচন করুন (Select Correct Drug Class):
                      </label>
                      <select
                        className="input"
                        value={editClass}
                        onChange={(e) => setEditClass(e.target.value as DrugClass)}
                        style={{ minHeight: 36, padding: "0.4rem", marginBottom: "0.5rem" }}
                      >
                        {ALL_DRUG_CLASSES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ minHeight: 32, fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                          onClick={() => handleApproveBrand(item, editClass)}
                        >
                          ✓ স্বাক্ষর ও অনুমোদন করুন (Sign & Approve)
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ minHeight: 32, fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                          onClick={() => setEditingBrand(null)}
                        >
                          বাতিল
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.75rem" }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ minHeight: 32, fontSize: "0.8rem", padding: "0.2rem 0.6rem" }}
                        onClick={() => handleApproveBrand(item)}
                      >
                        ✓ অনুমোদন (Approve as {item.suggestedClass})
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ minHeight: 32, fontSize: "0.8rem", padding: "0.2rem 0.6rem" }}
                        onClick={() => {
                          setEditingBrand(item);
                          setEditClass(item.suggestedClass || "unknown");
                        }}
                      >
                        ✏️ শ্রেণী পরিবর্তন (Edit)
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ minHeight: 32, fontSize: "0.8rem", padding: "0.2rem 0.6rem" }}
                        onClick={() => handleRejectBrand(item)}
                      >
                        ✕ প্রত্যাখ্যান (Reject)
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────── TAB 2: RULES REVIEW ────────────────── */}
      {tab === "rules" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>ক্লিনিক্যাল নিয়ম সারণী (Rules Sign-Off Table):</h2>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ minHeight: 28, padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
              onClick={handleExportRulesJSON}
            >
              Rules JSON Export
            </button>
          </div>

          <div className="card" style={{ marginBottom: "1rem", background: "#faf5ff", border: "1.5px solid #c4b5fd" }}>
            <p style={{ fontSize: "0.8rem", color: "#5b21b6", fontWeight: 600 }}>
              ⚠️ অহস্তান্তরযোগ্য নিরাপত্তা নিয়ম: সমস্ত প্রাথমিক নিয়মগুলি অপ্রমাণিত স্থানধারক (unsigned placeholders) হিসেবে সংরক্ষিত।
              চিকিৎসক বা বিশেষজ্ঞ ফার্মাসিস্ট পর্যালোচনা করে স্বাক্ষর না করা পর্যন্ত সিস্টেমে "UNSIGNED RULE" ব্যাজ প্রদর্শিত হবে।
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {rulesList.map((r) => (
              <div
                key={r.id}
                className="card"
                style={{
                  borderLeft: `4px solid ${r.signedOff ? "var(--color-primary)" : "#7c3aed"}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--color-text)" }}>
                      {r.id}
                    </span>
                    <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      Classes: {r.appliesToClasses.join(", ")}
                    </span>
                  </div>

                  <span className={r.signedOff ? "badge badge-verified" : "badge badge-unsigned"}>
                    {r.signedOff ? "✓ Signed Off" : "UNSIGNED RULE"}
                  </span>
                </div>

                <p style={{ fontSize: "0.85rem", color: "var(--color-text)", marginTop: "0.4rem" }}>
                  {r.text[lang] || r.text.en}
                </p>

                <div style={{ marginTop: "0.4rem", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                  সূত্র (Source): <em>{r.source}</em>
                </div>

                <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => handleToggleRuleSignOff(r.id)}
                    className={`btn ${r.signedOff ? "btn-secondary" : "btn-primary"}`}
                    style={{ minHeight: 32, fontSize: "0.8rem", padding: "0.2rem 0.6rem" }}
                  >
                    {r.signedOff ? "✕ স্বাক্ষর প্রত্যাহার (Revoke Sign-off)" : "✍️ স্বাক্ষর করুন (Sign Off)"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
