"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { t, getLanguage, formatDate, type Lang } from "@/lib/i18n";
import {
  getAllPatients,
  savePatient,
  deletePatient,
  getChecksByToken,
  type CheckRecord,
} from "@/lib/db";
import { generatePatientToken } from "@/lib/privacy";
import type { Patient, AgeBand, DrugClass } from "@/lib/schemas";
import { searchBrands, getBrandDisplayName } from "@/lib/brands";
import { DEMO_PATIENTS } from "@/lib/seed";

export default function PatientsPage() {
  const [lang, setLang] = useState<Lang>("bn");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // New Patient Modal / Form toggle
  const [showAddForm, setShowAddForm] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [ageBand, setAgeBand] = useState<AgeBand>("adult");
  const [pregnant, setPregnant] = useState(false);
  const [kidneyDisease, setKidneyDisease] = useState(false);
  const [creatinine, setCreatinine] = useState("");
  const [egfr, setEgfr] = useState("");
  const [livesAlone, setLivesAlone] = useState(false);
  const [worksOutdoors, setWorksOutdoors] = useState(false);

  // Medicines for new patient
  const [medQuery, setMedQuery] = useState("");
  const [medSearchResults, setMedSearchResults] = useState<ReturnType<typeof searchBrands>>([]);
  const [selectedMeds, setSelectedMeds] = useState<{ brand: string; classes: DrugClass[] }[]>([]);

  // Selected patient history view
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [patientChecks, setPatientChecks] = useState<CheckRecord[]>([]);
  const [loadingChecks, setLoadingChecks] = useState(false);

  useEffect(() => {
    setLang(getLanguage());
    loadPatients();

    const handleLangChange = () => setLang(getLanguage());
    window.addEventListener("ap-lang-change", handleLangChange);
    return () => window.removeEventListener("ap-lang-change", handleLangChange);
  }, []);

  async function loadPatients() {
    setLoading(true);
    try {
      const data = await getAllPatients();
      setPatients(data);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenAddForm() {
    setTokenInput(generatePatientToken());
    setAgeBand("adult");
    setPregnant(false);
    setKidneyDisease(false);
    setCreatinine("");
    setEgfr("");
    setLivesAlone(false);
    setWorksOutdoors(false);
    setSelectedMeds([]);
    setShowAddForm(true);
  }

  function handleAddMed(brandName: string, classes: DrugClass[]) {
    if (selectedMeds.some((m) => m.brand.toLowerCase() === brandName.toLowerCase())) return;
    setSelectedMeds([...selectedMeds, { brand: brandName, classes }]);
    setMedQuery("");
    setMedSearchResults([]);
  }

  function handleRemoveMed(idx: number) {
    setSelectedMeds(selectedMeds.filter((_, i) => i !== idx));
  }

  async function handleSaveNewPatient() {
    const finalToken = tokenInput.trim() || generatePatientToken();
    const newPt: Patient = {
      token: finalToken,
      ageBand,
      pregnant,
      knownKidneyDisease: kidneyDisease,
      latestCreatinine: creatinine ? parseFloat(creatinine) : undefined,
      latestEGFR: egfr ? parseFloat(egfr) : undefined,
      livesAlone,
      worksOutdoors,
      chronicMedicines: selectedMeds.map((m) => ({ brand: m.brand, classes: m.classes, dose: "" })),
      createdAt: new Date().toISOString(),
    };

    await savePatient(newPt);
    setShowAddForm(false);
    await loadPatients();
  }

  async function handleDelete(token: string) {
    if (confirm(t("deleteConfirm", lang))) {
      await deletePatient(token);
      if (activePatient?.token === token) {
        setActivePatient(null);
        setPatientChecks([]);
      }
      await loadPatients();
    }
  }

  async function handleViewHistory(p: Patient) {
    setActivePatient(p);
    setLoadingChecks(true);
    try {
      const checks = await getChecksByToken(p.token);
      setPatientChecks(checks);
    } finally {
      setLoadingChecks(false);
    }
  }

  async function handleSeedDemo() {
    for (const p of DEMO_PATIENTS) {
      await savePatient(p);
    }
    await loadPatients();
  }

  const filtered = patients.filter((p) => {
    return p.token.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="page-content" style={{ paddingBottom: "5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-primary-dark)" }}>
            👥 {t("homePatients", lang)}
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            {t("homePatientsSubtitle", lang)}
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddForm} style={{ fontSize: "0.85rem" }}>
          ➕ {t("patientAddTitle", lang)}
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          className="input"
          placeholder={t("search", lang)}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Empty State */}
      {!loading && patients.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "2rem 1rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📋</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text)" }}>
            {t("patientListEmpty", lang)}
          </h3>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "1rem" }}>
            <button className="btn btn-primary" onClick={handleOpenAddForm}>
              ➕ {t("patientAddTitle", lang)}
            </button>
            <button className="btn btn-secondary" onClick={handleSeedDemo}>
              🧪 {t("homeDemo", lang)}
            </button>
          </div>
        </div>
      )}

      {/* Add Patient Modal / Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: "1.5rem", border: "2px solid var(--color-primary)", background: "#f8fffb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>
              {t("patientAddTitle", lang)}
            </h3>
            <button
              className="btn btn-secondary"
              style={{ minHeight: 28, padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
              onClick={() => setShowAddForm(false)}
            >
              ✕ {t("cancel", lang)}
            </button>
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 700 }}>{t("patientToken", lang)}</label>
            <input
              type="text"
              className="input"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder={t("patientTokenPlaceholder", lang)}
            />
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>
              {t("patientAgeBand", lang)}
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
              {(["child", "adult", "elderly"] as AgeBand[]).map((ab) => (
                <button
                  key={ab}
                  type="button"
                  onClick={() => setAgeBand(ab)}
                  className={`btn ${ageBand === ab ? "btn-primary" : "btn-secondary"}`}
                  style={{ minHeight: 36, fontSize: "0.8rem" }}
                >
                  {ab === "child" && t("ageBandChild", lang)}
                  {ab === "adult" && t("ageBandAdult", lang)}
                  {ab === "elderly" && t("ageBandElderly", lang)}
                </button>
              ))}
            </div>
          </div>

          {/* Condition Toggles */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
              <input type="checkbox" checked={pregnant} onChange={(e) => setPregnant(e.target.checked)} />
              {t("patientPregnant", lang)}
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
              <input type="checkbox" checked={kidneyDisease} onChange={(e) => setKidneyDisease(e.target.checked)} />
              {t("patientKidneyDisease", lang)}
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
              <input type="checkbox" checked={livesAlone} onChange={(e) => setLivesAlone(e.target.checked)} />
              {t("patientLivesAlone", lang)}
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
              <input type="checkbox" checked={worksOutdoors} onChange={(e) => setWorksOutdoors(e.target.checked)} />
              {t("patientWorksOutdoors", lang)}
            </label>
          </div>

          {kidneyDisease && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
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
                  placeholder="40"
                />
              </div>
            </div>
          )}

          {/* Medicines Selection for profile */}
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>
              {t("patientMedicines", lang)}
            </label>
            <input
              type="text"
              className="input"
              value={medQuery}
              onChange={(e) => {
                setMedQuery(e.target.value);
                setMedSearchResults(e.target.value.trim() ? searchBrands(e.target.value) : []);
              }}
              placeholder={t("searchMedicinePlaceholder", lang)}
            />

            {medSearchResults.length > 0 && (
              <div
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  maxHeight: 140,
                  overflowY: "auto",
                  marginTop: "0.3rem",
                  background: "white",
                }}
              >
                {medSearchResults.map((b) => (
                  <div
                    key={b.brand}
                    onClick={() => handleAddMed(b.brand, b.classes)}
                    style={{
                      padding: "0.4rem 0.6rem",
                      borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    <strong>{getBrandDisplayName(b, lang)}</strong> · {b.classes.map((cls) => t(`drugClass_${cls}` as any, lang)).join(", ")}
                  </div>
                ))}
              </div>
            )}

            {/* Selected Meds badges */}
            {selectedMeds.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
                {selectedMeds.map((m, idx) => (
                  <span
                    key={`${m.brand}-${idx}`}
                    style={{
                      background: "#e0f2fe",
                      color: "#0369a1",
                      borderRadius: 6,
                      padding: "0.2rem 0.5rem",
                      fontSize: "0.8rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    {getBrandDisplayName(m.brand, lang)}
                    <button
                      type="button"
                      onClick={() => handleRemoveMed(idx)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#0369a1", fontWeight: 700 }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button className="btn btn-primary btn-full" onClick={handleSaveNewPatient}>
            {t("save", lang)}
          </button>
        </div>
      )}

      {/* Patient List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {filtered.map((p) => {
          const medCount = p.chronicMedicines?.length ?? 0;
          return (
            <div
              key={p.token}
              className="card"
              style={{
                border: "1.5px solid var(--color-border)",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--color-primary-dark)" }}>
                      {p.token}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                      ({t(`ageBand${p.ageBand.charAt(0).toUpperCase() + p.ageBand.slice(1)}` as any, lang)})
                    </span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "0.3rem" }}>
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
                    {medCount > 0 && (
                      <span className="badge badge-verified" style={{ fontSize: "0.7rem" }}>
                        {p.chronicMedicines?.map((m) => m.brand).join(", ")}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    className="btn btn-secondary"
                    style={{ minHeight: 32, padding: "0.2rem 0.6rem", fontSize: "0.75rem" }}
                    onClick={() => handleViewHistory(p)}
                  >
                    📋 {t("patientHistory", lang)}
                  </button>
                  <Link
                    href={`/check?token=${p.token}`}
                    className="btn btn-primary"
                    style={{ minHeight: 32, padding: "0.2rem 0.6rem", fontSize: "0.75rem", textDecoration: "none" }}
                  >
                    🩺 {t("navCheck", lang)}
                  </Link>
                  <button
                    className="btn btn-danger"
                    style={{ minHeight: 32, padding: "0.2rem 0.4rem", fontSize: "0.75rem" }}
                    onClick={() => handleDelete(p.token)}
                    title={t("delete", lang)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Patient Past Checks History Drawer/Modal */}
      {activePatient && (
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
          <div className="card" style={{ maxWidth: 500, width: "100%", maxHeight: "80vh", overflowY: "auto", background: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-primary-dark)" }}>
                {activePatient.token} — {t("patientHistory", lang)}
              </h3>
              <button
                className="btn btn-secondary"
                style={{ minHeight: 28, padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                onClick={() => setActivePatient(null)}
              >
                ✕ {t("close", lang)}
              </button>
            </div>

            {loadingChecks ? (
              <p>{t("loading", lang)}</p>
            ) : patientChecks.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>
                {t("none", lang)}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {patientChecks.map((chk) => (
                  <div key={chk.id} style={{ padding: "0.75rem", borderRadius: 8, border: "1px solid var(--color-border)", background: "#f8fafc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {formatDate(chk.createdAt, lang)}
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: chk.result.urgency === "GO_TO_HEALTH_FACILITY_NOW" ? "#fee2e2" : chk.result.urgency === "ASK_DOCTOR_TODAY" ? "#fef3c7" : "#d1fae5",
                          color: chk.result.urgency === "GO_TO_HEALTH_FACILITY_NOW" ? "#991b1b" : chk.result.urgency === "ASK_DOCTOR_TODAY" ? "#92400e" : "#065f46",
                        }}
                      >
                        {chk.result.urgency}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      {chk.input.brands?.join(", ") || t("none", lang)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
