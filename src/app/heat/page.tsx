"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { t, getLanguage, type Lang } from "@/lib/i18n";
import { getAllPatients, getContactStatus, setContactStatus, savePatient } from "@/lib/db";
import { computeRiskScore, RISK_WEIGHTS } from "@/lib/risk";
import {
  fetchForecast,
  getStoredLocation,
  setStoredLocation,
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
      setWeatherError("আবহাওয়া সার্ভার অনুপলব্ধ। ম্যানুয়াল তাপমাত্রা লিখুন (Offline mode — enter manually).");
      // Fallback to manual
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

    // If local patient store is empty, load demo patients for CHO demonstration
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

    // Sort High to Low by risk points score
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
          🌡️ {t("homeHeatwave", lang)}
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
          তাপপ্রবাহের দিনে রোগীদের ঝুঁকিভিত্তিক অগ্রাধিকার তালিকা (Prioritisation aid for CHOs).
        </p>
      </div>

      {isDemoData && (
        <div className="synthetic-banner">
          ⚠️ SYNTHETIC DEMO DATA — কৃত্রিম নমুনা রোগীর তথ্য প্রদর্শন করা হচ্ছে
        </div>
      )}

      {/* 3-Day Forecast Section */}
      <div className="card" style={{ marginBottom: "1rem", background: "#f8fafc" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
            আবহাওয়া পূর্বাভাস (3-Day Weather Forecast):
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: "0.2rem 0.6rem", minHeight: 32, fontSize: "0.75rem" }}
            onClick={loadWeather}
            disabled={loadingWeather}
          >
            {loadingWeather ? "লোড হচ্ছে..." : "🔄 Refresh"}
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
                    {idx === 0 ? "আজ (Today)" : idx === 1 ? "কাল (Tomorrow)" : "পরশু (Day 3)"}
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
                      HEAT DAY
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
            ম্যানুয়াল তাপমাত্রা বা আর্দ্রতা পরিবর্তন করুন (Offline / Manual Entry)
          </summary>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.5rem", marginTop: "0.5rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>সর্বোচ্চ তাপমাত্রা (°C)</label>
              <input
                type="number"
                className="input"
                value={manualTemp}
                onChange={(e) => setManualTemp(e.target.value)}
                style={{ minHeight: 36, padding: "0.4rem" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>আপেক্ষিক আর্দ্রতা (%)</label>
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
                প্রয়োগ করুন
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
              {selectedDay.isHeatDay
                ? "তাপপ্রবাহ সতর্কতা দিন (Heatwave Day Declared)"
                : "স্বাভাবিক তাপমাত্রা (Normal Weather)"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
              তাপ সূচক (Heat Index): {selectedDay.heatIndex}°C · থ্রেশহোল্ড: {RISK_WEIGHTS.heatDayThresholdCelsius}°C (Unsigned placeholder).
            </div>
          </div>
        </div>
      )}

      {/* Caseload Risk Ranking List */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text)" }}>
          অগ্রাধিকার তালিকা (Priority Caseload Ranking) ({rankedList.length})
        </h2>
        {isDemoData && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: "0.2rem 0.5rem", minHeight: 28, fontSize: "0.75rem" }}
            onClick={handleSeedDemoPatients}
          >
            ডাটাবেসে সেভ করুন
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
                      {idx + 1}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--color-text)" }}>
                      {p.token}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                      ({p.ageBand})
                    </span>
                  </div>

                  {/* Badges / Factors */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "0.4rem" }}>
                    {(p.knownKidneyDisease || p.kidneyDisease) && (
                      <span className="badge badge-unsigned" style={{ fontSize: "0.7rem" }}>
                        Kidney Disease
                      </span>
                    )}
                    {p.livesAlone && (
                      <span className="badge badge-unsigned" style={{ fontSize: "0.7rem" }}>
                        Lives alone
                      </span>
                    )}
                    {p.worksOutdoors && (
                      <span className="badge badge-unsigned" style={{ fontSize: "0.7rem" }}>
                        Works outdoors
                      </span>
                    )}
                    {p.pregnant && (
                      <span className="badge badge-unsigned" style={{ fontSize: "0.7rem" }}>
                        Pregnant
                      </span>
                    )}
                    {hasFlags && (
                      <span className="badge badge-verified" style={{ fontSize: "0.7rem" }}>
                        {medCount} Chronic Meds
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
                    {item.risk.totalScore} pts
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    {item.risk.level.toUpperCase()} RISK
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
                    ✓ যোগাযোগ সম্পন্ন (Called)
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
                    ✕ পাওয়া যায়নি (Not Reached)
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
                    {isExpanded ? "▲ কেন এই স্কোর?" : "▼ কেন এই স্কোর? (Why?)"}
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
                    চেক শুরু ➔
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
                    স্কোর ব্রেকডাউন (Score Breakdown):
                  </div>
                  {item.risk.breakdown.map((b, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                      <span>• {b.description} ({b.factor}):</span>
                      <span style={{ fontWeight: 700, color: "var(--color-primary-dark)" }}>+{b.points} pts</span>
                    </div>
                  ))}
                  <div style={{ marginTop: "4px", fontSize: "0.7rem", color: "#6b7280", fontStyle: "italic" }}>
                    {RISK_WEIGHTS.source}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Safety Notice */}
      <div className="safety-disclaimer" style={{ marginTop: "1.5rem" }}>
        অগ্রাধিকার তালিকা কেবল মাত্র কাজের অগ্রাধিকার নির্ধারণের জন্য। এটি কোনো চিকিৎসাগত সিদ্ধান্ত নয়।
      </div>
    </div>
  );
}
