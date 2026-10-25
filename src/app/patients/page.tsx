"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { t, getLanguage, type Lang } from "@/lib/i18n";
import {
  getAllPatients,
  savePatient,
  deletePatient,
  getChecksByToken,
  type CheckRecord,
} from "@/lib/db";
import { generatePatientToken } from "@/lib/privacy";
import type { Patient, AgeBand, DrugClass } from "@/lib/schemas";
import { searchBrands, lookupBrand } from "@/lib/brands";
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
    if (confirm(`Are you sure you want to delete patient ${token}?`)) {
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

  // Filtered patients
  const filtered = patients.filter((p) => {
    const matchesSearch = p.token.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="page-content" style={{ paddingBottom: "5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-primary-dark)" }}>
            👥 {t("homePatients", lang)}
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            স্থানীয় সংরক্ষিত রোগীর তালিকা (Local Pseudonymous Patient Store).
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddForm} style={{ fontSize: "0.85rem" }}>
          ➕ নতুন রোগী (Add)
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          className="input"
          placeholder="রোগী টোকেন অনুসন্ধান করুন (Search by token)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Empty State */}
      {!loading && patients.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "2rem 1rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📋</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text)" }}>
            কোনো রোগী সংরক্ষিত নেই (No Patients Stored)
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: "0.5rem", marginBottom: "1.25rem" }}>
            নতুন রোগী যোগ করতে পারেন অথবা পরীক্ষার জন্য ডেমো ডেটা লোড করতে পারেন।
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
            <button className="btn btn-primary" onClick={handleOpenAddForm}>
              ➕ নতুন রোগী তৈরি করুন
            </button>
            <button className="btn btn-secondary" onClick={handleSeedDemo}>
              🧪 নমুনা ডেমো রোগী লোড করুন
            </button>
          </div>
        </div>
      )}

      {/* Add Patient Modal / Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: "1.5rem", border: "2px solid var(--color-primary)", background: "#f8fffb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>
              নতুন রোগী যোগ করুন (Add New Patient)
            </h3>
            <button
              className="btn btn-secondary"
              style={{ minHeight: 28, padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
              onClick={() => setShowAddForm(false)}
            >
              ✕ বাতিল (Cancel)
            </button>
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 700 }}>রোগী টোকেন (Patient Token)</label>
            <input
              type="text"
              className="input"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="e.g. AP-10294"
            />
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>
              বয়স গ্রুপ (Age Group)
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
                  {ab === "child" ? "শিশু (<18)" : ab === "adult" ? "প্রাপ্তবয়স্ক (18-60)" : "বয়স্ক (>60)"}
                </button>
              ))}
            </div>
          </div>

          {/* Condition Toggles */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
              <input type="checkbox" checked={pregnant} onChange={(e) => setPregnant(e.target.checked)} />
              গর্ভবতী (Pregnant)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
              <input type="checkbox" checked={kidneyDisease} onChange={(e) => setKidneyDisease(e.target.checked)} />
              কিডনি রোগ (Kidney Disease)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
              <input type="checkbox" checked={livesAlone} onChange={(e) => setLivesAlone(e.target.checked)} />
              একা থাকেন (Lives Alone)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
              <input type="checkbox" checked={worksOutdoors} onChange={(e) => setWorksOutdoors(e.target.checked)} />
              বাইরে কাজ করেন (Works Outdoors)
            </label>
          </div>

          {kidneyDisease && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>Creatinine (mg/dL)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={creatinine}
                  onChange={(e) => setCreatinine(e.target.value)}
                  placeholder="e.g. 1.8"
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>eGFR</label>
                <input
                  type="number"
                  className="input"
                  value={egfr}
                  onChange={(e) => setEgfr(e.target.value)}
                  placeholder="e.g. 40"
                />
              </div>
            </div>
          )}

          {/* Medicines Selection for profile */}
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>
              নিয়মিত ওষুধ যোগ করুন (Chronic Medicines)
            </label>
            <input
              type="text"
              className="input"
              value={medQuery}
              onChange={(e) => {
                setMedQuery(e.target.value);
                setMedSearchResults(e.target.value.trim() ? searchBrands(e.target.value) : []);
              }}
              placeholder="ওষুধের নাম লিখুন (Search brand)..."
            />

            {medSearchResults.length > 0 && (
              <div
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  maxHeight: 140,
                  overflowY: "auto",
                  background: "white",
                  marginTop: "0.25rem",
                }}
              >
                {medSearchResults.map((b) => (
                  <div
                    key={b.brand}
                    onClick={() => handleAddMed(b.brand, b.classes)}
                    style={{
                      padding: "0.4rem 0.6rem",
                      borderBottom: "1px solid #f1f5f9",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{b.brand} ({b.classes.join(", ")})</span>
                    <span style={{ color: "var(--color-primary-light)", fontWeight: 700 }}>+ Add</span>
                  </div>
                ))}
              </div>
            )}

            {selectedMeds.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.4rem" }}>
                {selectedMeds.map((m, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "#d1fae5",
                      border: "1px solid #6ee7b7",
                      padding: "0.2rem 0.5rem",
                      borderRadius: 6,
                      fontSize: "0.75rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {m.brand}
                    <button
                      type="button"
                      onClick={() => handleRemoveMed(idx)}
                      style={{ border: "none", background: "none", cursor: "pointer", fontWeight: 700 }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button className="btn btn-primary btn-full" onClick={handleSaveNewPatient}>
            সংরক্ষণ করুন (Save Patient) ✓
          </button>
        </div>
      )}

      {/* Patient List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {filtered.map((p) => (
          <div key={p.token} className="card" style={{ borderLeft: "4px solid var(--color-primary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-text)" }}>
                    {p.token}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                    ({p.ageBand === "child" ? "শিশু" : p.ageBand === "adult" ? "প্রাপ্তবয়স্ক" : "বয়স্ক"})
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "0.3rem" }}>
                  {(p.knownKidneyDisease || p.kidneyDisease) && <span className="badge badge-unsigned">Kidney Disease</span>}
                  {p.pregnant && <span className="badge badge-unsigned">Pregnant</span>}
                  {p.livesAlone && <span className="badge badge-unsigned">Lives alone</span>}
                  {p.worksOutdoors && <span className="badge badge-unsigned">Works outdoors</span>}
                </div>

                {p.chronicMedicines && p.chronicMedicines.length > 0 ? (
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.4rem" }}>
                    ওষুধ: {p.chronicMedicines.map((m: { brand: string }) => m.brand).join(", ")}
                  </div>
                ) : p.medicines && p.medicines.length > 0 ? (
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.4rem" }}>
                    ওষুধ: {p.medicines.join(", ")}
                  </div>
                ) : null}
              </div>

              <div style={{ display: "flex", gap: "0.4rem" }}>
                <Link
                  href={`/check?token=${p.token}`}
                  className="btn btn-primary"
                  style={{ minHeight: 32, padding: "0.2rem 0.6rem", fontSize: "0.75rem" }}
                >
                  🩺 চেক (Check)
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ minHeight: 32, padding: "0.2rem 0.6rem", fontSize: "0.75rem" }}
                  onClick={() => handleViewHistory(p)}
                >
                  📜 ইতিহাস (History)
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ minHeight: 32, padding: "0.2rem 0.4rem", fontSize: "0.75rem" }}
                  onClick={() => handleDelete(p.token)}
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Check history drawer for active patient */}
            {activePatient?.token === p.token && (
              <div
                style={{
                  marginTop: "0.75rem",
                  paddingTop: "0.75rem",
                  borderTop: "1px dashed var(--color-border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--color-primary-dark)" }}>
                    চেক ইতিহাস (Past Checks for {p.token}):
                  </span>
                  <button
                    onClick={() => setActivePatient(null)}
                    style={{ border: "none", background: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "0.75rem" }}
                  >
                    বন্ধ করুন ✕
                  </button>
                </div>

                {loadingChecks ? (
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>লোড হচ্ছে...</p>
                ) : patientChecks.length === 0 ? (
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                    এই রোগীর জন্য কোনো পূর্ববর্তী চেক রেকর্ড নেই।
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {patientChecks.map((chk) => (
                      <div
                        key={chk.id}
                        style={{
                          padding: "0.5rem",
                          borderRadius: 6,
                          background: chk.result.urgency === "GO_TO_HEALTH_FACILITY_NOW" ? "#fee2e2" : "#f0fdf4",
                          border: "1px solid #e2e8f0",
                          fontSize: "0.75rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontWeight: 700 }}>
                            {new Date(chk.createdAt).toLocaleDateString()} {new Date(chk.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span style={{ fontWeight: 700 }}>{chk.result.urgency}</span>
                        </div>
                        <div style={{ color: "var(--color-text-secondary)", marginTop: "2px" }}>
                          লক্ষণ: {chk.input.symptoms.symptoms.value.join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
