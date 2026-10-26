"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { t, getLanguage, formatNumber, type Lang } from "@/lib/i18n";
import { getAllPatients, getContactStatus, setContactStatus, savePatient } from "@/lib/db";
import { computeRiskScore, RISK_WEIGHTS } from "@/lib/risk";
import {
  fetchForecast,
  getStoredLocation,
  buildManualForecast,
  type ForecastResult,
  type DayForecast,
} from "@/lib/weather";
import type { Patient, RiskScore } from "@/lib/schemas";
import { DEMO_PATIENTS } from "@/lib/seed";

interface PatientRiskItem {
  patient: Patient;
  risk: RiskScore;
  contactStatus: "called" | "not_reached" | "none";
}

export default function HeatwavePage() {
  const [lang, setLang] = useState<Lang>("bn");
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Manual Weather Entry fallback
  const [manualTemp, setManualTemp] = useState<string>("39");
  const [manualHumidity, setManualHumidity] = useState<string>("65");

  // Patients & Risk Rankings
  const [rankedList, setRankedList] = useState<PatientRiskItem[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [expandedBreakdown, setExpandedBreakdown] = useState<Record<string, boolean>>({});
  const [isDemoData, setIsDemoData] = useState<boolean>(false);

  useEffect(() => {
    setLang(getLanguage());
    loadWeather();

    const handleLangChange = () => setLang(getLanguage());
    window.addEventListener("ap-lang-change", handleLangChange);
    return () => window.removeEventListener("ap-lang-change", handleLangChange);
  }, []);

  useEffect(() => {
    loadPatientsAndRank();
  }, [selectedDayIndex, forecast]);

  async function loadWeather() {
    setLoadingWeather(true);
    setWeatherError(null);
    try {
      const loc = getStoredLocation() ?? { lat: 22.9868, lon: 87.855, label: "Bardhaman / Purba Bardhaman" };
      const res = await fetchForecast(loc.lat, loc.lon, true);
      setForecast(res);
    } catch {
      setWeatherError(t("offlineMode", lang));
      const fallback = buildManualForecast(parseFloat(manualTemp) || 39, parseFloat(manualHumidity) || 65);
      setForecast(fallback);
    } finally {
      setLoadingWeather(false);
    }
  }

  function handleApplyManualWeather() {
    const temp = parseFloat(manualTemp) || 38;
    const hum = parseFloat(manualHumidity) || 60;
    const manual = buildManualForecast(temp, hum);
    setForecast(manual);
    setWeatherError(null);
  }

  async function loadPatientsAndRank() {
    let patients = await getAllPatients();
    let isDemo = false;

    if (patients.length === 0) {
      patients = DEMO_PATIENTS;
      isDemo = true;
    }
    setIsDemoData(isDemo);

    const todayStr =
      forecast?.days[selectedDayIndex]?.date ?? new Date().toISOString().split("T")[0];

    const items: PatientRiskItem[] = [];

    for (const p of patients) {
      const risk = computeRiskScore({ patient: p, hasRecentIllness: false });
      const cs = await getContactStatus(p.token, todayStr);
      items.push({
        patient: p,
        risk,
        contactStatus: cs?.status ?? "none",
      });
    }

    items.sort((a, b) => b.risk.totalScore - a.risk.totalScore);
    setRankedList(items);
  }

  async function handleToggleContact(token: string, newStatus: "called" | "not_reached" | "none") {
    const todayStr =
      forecast?.days[selectedDayIndex]?.date ?? new Date().toISOString().split("T")[0];
    await setContactStatus({ token, date: todayStr, status: newStatus });
    setRankedList((prev) =>
      prev.map((item) =>
        item.patient.token === token ? { ...item, contactStatus: newStatus } : item
      )
    );
  }

  async function handleSeedDemoPatients() {
    for (const p of DEMO_PATIENTS) {
      await savePatient(p);
    }
    await loadPatientsAndRank();
  }

  function toggleWhy(token: string) {
    setExpandedBreakdown((prev) => ({ ...prev, [token]: !prev[token] }));
  }

  const selectedDay: DayForecast | undefined = forecast?.days[selectedDayIndex];

  return (
    <div className="page-content" style={{ paddingBottom: "5rem" }}>
      {/* Disclaimer header */}
      <div style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-primary-dark)" }}>
          🌡️ {t("heatPageTitle", lang)}
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
          {t("heatPageSubtitle", lang)}
        </p>
      </div>

      {isDemoData && (
        <div className="synthetic-banner">
          {t("syntheticDataBanner", lang)}
        </div>
      )}

      {/* 3-Day Forecast Section */}
      <div className="card" style={{ marginBottom: "1rem", background: "#f8fafc" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
            {t("heatForecast", lang)}:
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: "0.2rem 0.6rem", minHeight: 32, fontSize: "0.75rem" }}
            onClick={loadWeather}
            disabled={loadingWeather}
          >
            {loadingWeather ? t("loading", lang) : "🔄 " + t("search", lang)}
          </button>
        </div>

        {weatherError && (
          <div
            style={{
              padding: "0.5rem 0.75rem",
              background: "#fffbeb",
              borderRadius: 8,
              border: "1px solid #fde68a",
              fontSize: "0.8rem",
              marginBottom: "0.75rem",
              color: "#92400e",
            }}
          >
            {weatherError}
          </div>
        )}

        {/* 3 Days Tabs */}
        {forecast && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
            {forecast.days.map((day, idx) => {
              const isSelected = idx === selectedDayIndex;
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDayIndex(idx)}
                  style={{
                    padding: "0.6rem 0.4rem",
                    borderRadius: 10,
                    border: isSelected ? "2.5px solid var(--color-primary)" : "1.5px solid var(--color-border)",
                    background: isSelected ? "#ecfdf5" : "white",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)" }}>
                    {idx === 0 ? t("heatForecastToday", lang) : idx === 1 ? t("heatForecastTomorrow", lang) : t("heatForecastDayAfter", lang)}
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-danger)" }}>
                    {day.maxTempCelsius}°C
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                    HI: {day.heatIndex}°C
                  </div>
                  {day.isHeatDay && (
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "2px",
                        fontSize: "0.65rem",
                        padding: "1px 4px",
                        borderRadius: 4,
                        background: "#fee2e2",
                        color: "#991b1b",
                        fontWeight: 700,
                      }}
                    >
                      {t("heatDay", lang)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Manual Weather Inputs Toggle */}
        <details style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
          <summary style={{ cursor: "pointer", color: "var(--color-primary-light)", fontWeight: 600 }}>
            {t("heatManualEntryTitle", lang)}
          </summary>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.5rem", marginTop: "0.5rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>{t("heatManualTempLabel", lang)}</label>
              <input
                type="number"
                className="input"
                value={manualTemp}
                onChange={(e) => setManualTemp(e.target.value)}
                style={{ minHeight: 36, padding: "0.4rem" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>{t("heatManualHumidityLabel", lang)}</label>
              <input
                type="number"
                className="input"
                value={manualHumidity}
                onChange={(e) => setManualHumidity(e.target.value)}
                style={{ minHeight: 36, padding: "0.4rem" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ minHeight: 36, padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                onClick={handleApplyManualWeather}
              >
                {t("confirm", lang)}
              </button>
            </div>
          </div>
        </details>
      </div>

      {/* Heat Status Banner */}
      {selectedDay && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius)",
            background: selectedDay.isHeatDay ? "#fef2f2" : "#f0fdf4",
            border: `2px solid ${selectedDay.isHeatDay ? "var(--color-danger)" : "var(--color-border)"}`,
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <span style={{ fontSize: "1.8rem" }}>{selectedDay.isHeatDay ? "🔥" : "🌤️"}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: selectedDay.isHeatDay ? "var(--color-danger-dark)" : "var(--color-primary-dark)" }}>
              {selectedDay.isHeatDay ? t("heatDay", lang) : t("notHeatDay", lang)}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
              {t("heatIndex", lang)}: {selectedDay.heatIndex}°C · {t("heatThresholdNote", lang)}
            </div>
          </div>
        </div>
      )}

      {/* Caseload Risk Ranking List */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text)" }}>
          {t("heatCaseloadTitle", { count: rankedList.length }, lang)}
        </h2>
        {isDemoData && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: "0.2rem 0.5rem", minHeight: 28, fontSize: "0.75rem" }}
            onClick={handleSeedDemoPatients}
          >
            {t("save", lang)}
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {rankedList.map((item, idx) => {
          const p = item.patient;
          const isExpanded = !!expandedBreakdown[p.token];
          const medCount = p.chronicMedicines?.length ?? p.medicines?.length ?? 0;
          const hasFlags = medCount > 0;

          return (
            <div
              key={p.token}
              style={{
                borderRadius: "var(--radius)",
                border: "1.5px solid var(--color-border)",
                background: "white",
                padding: "0.85rem 1rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span
                      style={{
                        background: "var(--color-primary-dark)",
                        color: "white",
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      {formatNumber(idx + 1, lang)}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--color-text)" }}>
                      {p.token}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                      ({t(`ageBand${p.ageBand.charAt(0).toUpperCase() + p.ageBand.slice(1)}` as any, lang)})
                    </span>
                  </div>

                  {/* Badges / Factors */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "0.4rem" }}>
                    {(p.knownKidneyDisease || p.kidneyDisease) && (
                      <span className="badge badge-unsigned" style={{ fontSize: "0.7rem" }}>
                        {t("patientKnownKidney", lang)}
                      </span>
                    )}
                    {p.livesAlone && (
                      <span className="badge badge-unsigned" style={{ fontSize: "0.7rem" }}>
                        {t("patientLivesAlone", lang)}
                      </span>
                    )}
                    {p.worksOutdoors && (
                      <span className="badge badge-unsigned" style={{ fontSize: "0.7rem" }}>
                        {t("patientWorksOutdoors", lang)}
                      </span>
                    )}
                    {p.pregnant && (
                      <span className="badge badge-unsigned" style={{ fontSize: "0.7rem" }}>
                        {t("patientPregnant", lang)}
                      </span>
                    )}
                    {hasFlags && (
                      <span className="badge badge-verified" style={{ fontSize: "0.7rem" }}>
                        {p.chronicMedicines?.map((m) => m.brand).join(", ") || `${medCount} meds`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Risk Points Badge */}
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      background: item.risk.totalScore >= 6 ? "#fee2e2" : "#fef3c7",
                      color: item.risk.totalScore >= 6 ? "#991b1b" : "#92400e",
                      padding: "0.25rem 0.6rem",
                      borderRadius: 8,
                      fontWeight: 800,
                      fontSize: "1rem",
                      display: "inline-block",
                    }}
                  >
                    {t("riskScore", { score: formatNumber(item.risk.totalScore, lang) }, lang)}
                  </div>
                </div>
              </div>

              {/* Contact Tracker (Called / Not reached) */}
              <div
                style={{
                  marginTop: "0.75rem",
                  paddingTop: "0.6rem",
                  borderTop: "1px solid #f1f5f9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", gap: "0.3rem" }}>
                  <button
                    type="button"
                    onClick={() => handleToggleContact(p.token, "called")}
                    style={{
                      padding: "0.25rem 0.6rem",
                      borderRadius: 6,
                      border: "1px solid #16a34a",
                      background: item.contactStatus === "called" ? "#16a34a" : "transparent",
                      color: item.contactStatus === "called" ? "white" : "#16a34a",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ✓ {t("called", lang)}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleContact(p.token, "not_reached")}
                    style={{
                      padding: "0.25rem 0.6rem",
                      borderRadius: 6,
                      border: "1px solid #ea580c",
                      background: item.contactStatus === "not_reached" ? "#ea580c" : "transparent",
                      color: item.contactStatus === "not_reached" ? "white" : "#ea580c",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ✕ {t("notReached", lang)}
                  </button>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => toggleWhy(p.token)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-primary-light)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {isExpanded ? `▲ ${t("whyClose", lang)}` : `▼ ${t("whyThisRank", lang)}`}
                  </button>

                  <Link
                    href={`/check?token=${p.token}`}
                    style={{
                      padding: "0.25rem 0.6rem",
                      borderRadius: 6,
                      background: "var(--color-primary)",
                      color: "white",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    {t("navCheck", lang)} ➔
                  </Link>
                </div>
              </div>

              {/* Expanded Breakdown */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: "0.6rem",
                    padding: "0.6rem",
                    borderRadius: 8,
                    background: "#f8fafc",
                    fontSize: "0.75rem",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                    {t("whyThisRank", lang)}:
                  </div>
                  {item.risk.breakdown.map((b, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                      <span>• {b.description}:</span>
                      <span style={{ fontWeight: 700, color: "var(--color-primary-dark)" }}>+{formatNumber(b.points, lang)} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Safety Notice */}
      <div className="safety-disclaimer" style={{ marginTop: "1.5rem" }}>
        🔒 {t("safetyDisclaimer", lang)}
      </div>
    </div>
  );
}
