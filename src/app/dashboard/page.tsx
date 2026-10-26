"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { t, getLanguage, type Lang } from "@/lib/i18n";
import { getAllChecks, type CheckRecord } from "@/lib/db";
import { DEMO_CHECKS, exportChecksCSV } from "@/lib/seed";
import type { FlagAction } from "@/lib/schemas";

export default function DashboardPage() {
  const [lang, setLang] = useState<Lang>("bn");
  const [useRealData, setUseRealData] = useState<boolean>(false);
  const [realChecks, setRealChecks] = useState<CheckRecord[]>([]);
  const [, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLang(getLanguage());
    loadRealData();
  }, []);

  async function loadRealData() {
    setLoading(true);
    try {
      const data = await getAllChecks();
      setRealChecks(data);
    } finally {
      setLoading(false);
    }
  }

  const activeChecks = useRealData ? realChecks : DEMO_CHECKS;

  // Breakdown by urgency
  const urgencyCounts: Record<FlagAction, number> = {
    GO_TO_HEALTH_FACILITY_NOW: 0,
    ASK_DOCTOR_TODAY: 0,
    INFO: 0,
    NO_FLAG: 0,
  };

  // Breakdown by illness symptom
  const illnessCounts: Record<string, number> = {};

  // Breakdown by flagged drug class
  const classCounts: Record<string, number> = {};

  // Heat day vs non-heat
  let heatChecks = 0;

  for (const c of activeChecks) {
    urgencyCounts[c.result.urgency] = (urgencyCounts[c.result.urgency] || 0) + 1;
    if (c.input.isHeatDay) heatChecks++;

    for (const sym of c.input.symptoms.symptoms.value) {
      if (sym !== "none") {
        illnessCounts[sym] = (illnessCounts[sym] || 0) + 1;
      }
    }

    for (const med of c.result.perMedicine) {
      if (med.flag === "ASK_DOCTOR_TODAY") {
        for (const cls of med.classes) {
          classCounts[cls] = (classCounts[cls] || 0) + 1;
        }
      }
    }
  }

  function handleDownloadCSV() {
    const csv = exportChecksCSV(activeChecks);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aushadh-${useRealData ? "real" : "synthetic"}-checks-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-content" style={{ paddingBottom: "5rem" }}>
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-primary-dark)" }}>
            📈 {t("navDashboard", lang)}
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            {t("dashboardSubtitle", lang)}
          </p>
        </div>
        <button
          className="btn btn-secondary"
          style={{ minHeight: 32, padding: "0.2rem 0.6rem", fontSize: "0.75rem" }}
          onClick={handleDownloadCSV}
        >
          📥 {t("dashboardExportCSV", lang)}
        </button>
      </div>

      {/* Synthetic Banner (Mandatory Rule #5) */}
      {!useRealData && (
        <div className="synthetic-banner">
          {t("syntheticDemoBanner", lang)}
        </div>
      )}

      {/* Data Source Toggle */}
      <div className="card" style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>
          {useRealData ? t("viewingRealData", lang) : t("viewingDemoData", lang)}
        </span>
        <button
          type="button"
          className="btn btn-primary"
          style={{ minHeight: 32, padding: "0.2rem 0.6rem", fontSize: "0.75rem" }}
          onClick={() => setUseRealData(!useRealData)}
        >
          {useRealData ? t("switchToDemoData", lang) : t("switchToRealData", lang)}
        </button>
      </div>

      {useRealData && realChecks.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "1.5rem", marginBottom: "1rem" }}>
          <p style={{ fontWeight: 600 }}>{t("noLocalChecksFound", lang)}</p>
          <Link href="/check" className="btn btn-primary" style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
            {t("startFirstCheck", lang)} ➔
          </Link>
        </div>
      )}

      {/* Top Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
        <div className="card" style={{ borderLeft: "4px solid var(--color-primary)", padding: "0.75rem" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", fontWeight: 700 }}>
            {t("totalChecks", lang)}
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-primary-dark)" }}>
            {activeChecks.length}
          </div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid var(--color-danger)", padding: "0.75rem" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", fontWeight: 700 }}>
            {t("urgentReferrals", lang)}
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-danger)" }}>
            {urgencyCounts.GO_TO_HEALTH_FACILITY_NOW}
          </div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid var(--color-accent-dark)", padding: "0.75rem" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", fontWeight: 700 }}>
            {t("medicineFlags", lang)}
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-accent-dark)" }}>
            {urgencyCounts.ASK_DOCTOR_TODAY}
          </div>
        </div>
      </div>

      {/* Flags by Illness Symptom */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-text)" }}>
          {t("casesByIllness", lang)}:
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {Object.entries(illnessCounts).map(([sym, count]) => {
            const pct = Math.round((count / (activeChecks.length || 1)) * 100);
            return (
              <div key={sym}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "2px" }}>
                  <span style={{ fontWeight: 600 }}>{sym.replace(/_/g, " ")}</span>
                  <span>{t("checksCount", { count }, lang)} ({pct}%)</span>
                </div>
                <div style={{ width: "100%", height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: "var(--color-primary)",
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flags by Medicine Class */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-text)" }}>
          {t("casesByDrugClass", lang)}:
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {Object.entries(classCounts).map(([cls, count]) => {
            const maxVal = Math.max(...Object.values(classCounts), 1);
            const pct = Math.round((count / maxVal) * 100);
            return (
              <div key={cls}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "2px" }}>
                  <span style={{ fontWeight: 600 }}>{cls}</span>
                  <span>{count} {t("timesFlagged", lang)}</span>
                </div>
                <div style={{ width: "100%", height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: "#ea580c",
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Heatwave Caseload Stat */}
      <div className="card" style={{ marginBottom: "1rem", background: "#fffbeb" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#92400e" }}>
              {t("heatwaveDayCases", lang)}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#b45309", marginTop: "2px" }}>
              {t("heatwaveDayCasesDesc", lang)}
            </div>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#d97706" }}>
            {heatChecks}
          </div>
        </div>
      </div>
    </div>
  );
}
