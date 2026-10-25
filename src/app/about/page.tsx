"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { t, getLanguage, type Lang } from "@/lib/i18n";
import { deleteAllData } from "@/lib/db";
import { SAFETY_DISCLAIMER } from "@/lib/rules";

export default function AboutPage() {
  const [lang, setLang] = useState<Lang>("bn");
  const [deletedSuccess, setDeletedSuccess] = useState(false);

  useEffect(() => {
    setLang(getLanguage());
  }, []);

  async function handleDeleteAllData() {
    if (
      confirm(
        "Are you sure you want to permanently delete all local patient and check data from this device? This action complies with DPDP Act 2023 and cannot be undone."
      )
    ) {
      await deleteAllData();
      setDeletedSuccess(true);
      setTimeout(() => setDeletedSuccess(false), 3000);
    }
  }

  return (
    <div className="page-content" style={{ paddingBottom: "5rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-primary-dark)" }}>
          ℹ️ {t("navAbout", lang)} — নিরাপত্তা ও তথ্যাবলী (Safety & Privacy)
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
          ঔষধ প্রহরী (Aushadh Prahari) এর নীতি, সীমাবদ্ধতা এবং সুরক্ষাবিধি।
        </p>
      </div>

      {/* Mandatory Safety Disclaimer */}
      <div className="safety-disclaimer" style={{ marginBottom: "1rem", fontSize: "0.95rem" }}>
        {SAFETY_DISCLAIMER}
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
          ✓ সমস্ত স্থানীয় ডেটা সফলভাবে মুছে ফেলা হয়েছে (All local data deleted).
        </div>
      )}

      {/* 1. NON-NEGOTIABLE CLINICAL SAFETY RULES */}
      <div className="card" style={{ marginBottom: "1rem", borderLeft: "4px solid var(--color-danger)" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-danger-dark)", marginBottom: "0.5rem" }}>
          ১. অহস্তান্তরযোগ্য ক্লিনিক্যাল সুরক্ষা নিয়ম (Clinical Safety Rules)
        </h2>
        <ul style={{ fontSize: "0.85rem", lineHeight: 1.7, paddingLeft: "1.2rem", color: "var(--color-text)" }}>
          <li>
            <strong>কৃত্রিম বুদ্ধিমত্তা (AI) কখনই ক্লিনিক্যাল ফ্ল্যাগ নির্ধারণ করে না:</strong> রোগ নির্ণয় বা ওষুধের ফ্ল্যাগ কেবলমাত্র ডিটারমিনিস্টিক রুল ইঞ্জিন (<code>rules.ts</code>) থেকে আসে।
          </li>
          <li>
            <strong>ওষুধ বন্ধ করার নির্দেশ কঠোরভাবে নিষিদ্ধ:</strong> এই অ্যাপ কখনই কোনো ওষুধ বন্ধ, বাদ বা কমাতে বলে না। সর্বদা বলা হয়: <em>"Ask the doctor today about: [ওষুধের নাম]"</em>।
          </li>
          <li>
            <strong>Fail-safe সুরক্ষা নীতি:</strong> যেকোনো অজানা ওষুধ, অস্পষ্ট লক্ষণ বা কম আস্থার ক্ষেত্রে স্বয়ংক্রিয়ভাবে <code>ASK_DOCTOR_TODAY</code> সক্রিয় হয়। লাল-পতাকা (Red-flag) লক্ষণ উপস্থিত থাকলে তাত্ক্ষণিকভাবে <code>GO_TO_HEALTH_FACILITY_NOW</code> জারি করা হয়।
          </li>
        </ul>
      </div>

      {/* 2. PLACEHOLDER CONTENT NOTICE */}
      <div className="card" style={{ marginBottom: "1rem", borderLeft: "4px solid #7c3aed" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#5b21b6", marginBottom: "0.5rem" }}>
          ২. ক্লিনিক্যাল বিষয়বস্তুর বৈধতা (Unsigned Placeholders Notice)
        </h2>
        <p style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--color-text)" }}>
          এই সফটওয়্যারটির <code>ruleTable.ts</code> এবং <code>brands.seed.json</code>-এ থাকা নিয়ম ও ব্র্যান্ড ম্যাপিংগুলি শুধুমাত্র <strong>স্থানধারক নমুনা (placeholders)</strong> হিসেবে অন্তর্ভুক্ত।
        </p>
        <p style={{ fontSize: "0.85rem", lineHeight: 1.7, marginTop: "0.5rem", color: "var(--color-text)" }}>
          এগুলি নিবন্ধিত চিকিৎসক বা ফার্মাসিস্ট দ্বারা ক্লিনিক্যালভাবে স্বাক্ষর (Signed-off) না হওয়া পর্যন্ত প্রতিটিতে দৃশ্যমান <strong>"UNSIGNED RULE — clinician review required"</strong> ব্যাজ প্রদর্শিত হয়।
        </p>
      </div>

      {/* 3. DPDP ACT 2023 PRIVACY ALIGNMENT */}
      <div className="card" style={{ marginBottom: "1rem", borderLeft: "4px solid var(--color-primary)" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-primary-dark)", marginBottom: "0.5rem" }}>
          ৩. ডেটা গোপনীয়তা (DPDP Act 2023 Aligned Privacy)
        </h2>
        <ul style={{ fontSize: "0.85rem", lineHeight: 1.7, paddingLeft: "1.2rem", color: "var(--color-text)" }}>
          <li>
            <strong>কোনো আসল নাম বা ফোন নম্বর নেই:</strong> প্রতিটি রোগীর জন্য শুধুমাত্র স্থানীয় ছদ্মনামযুক্ত টোকেন (যেমন <code>AP-98214</code>) ব্যবহৃত হয়।
          </li>
          <li>
            <strong>অন-ডিভাইস স্টোরেজ:</strong> সমস্ত চেক রেকর্ড ব্রাউজারের স্থানীয় IndexedDB-তে সুরক্ষিত থাকে। কোনো ক্লাউড সার্ভারে রোগীদের ডেটা পাঠানো হয় না।
          </li>
          <li>
            <strong>ভয়েস ট্রানস্ক্রিপ্ট সংরক্ষণ নিষিদ্ধ:</strong> ভয়েস ইনপুটের সময় spoken transcripts সার্ভারে লগ বা সংরক্ষিত হয় না।
          </li>
        </ul>

        <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed var(--color-border)" }}>
          <button className="btn btn-danger btn-full" onClick={handleDeleteAllData}>
            🗑️ আমার সমস্ত ডেটা মুছে ফেলুন (Delete All My Data)
          </button>
        </div>
      </div>

      {/* 4. ACCESSIBILITY COMPLIANCE (WCAG 2.2 AA) */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-text)", marginBottom: "0.5rem" }}>
          ৪. প্রবেশযোগ্যতা (Accessibility — WCAG 2.2 AA)
        </h2>
        <p style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--color-text)" }}>
          অ্যাপটি গ্রামীণ অঞ্চলে সূর্যের আলোতে সহজে পড়ার উপযোগী উচ্চ-কন্ট্রাস্ট থিম সহ নকশা করা হয়েছে।
        </p>
        <ul style={{ fontSize: "0.85rem", lineHeight: 1.7, paddingLeft: "1.2rem", marginTop: "0.3rem", color: "var(--color-text)" }}>
          <li>টাচ টার্গেট সর্বনিম্ন ৪৮ পিক্সেল (Touch targets ≥ 48px).</li>
          <li>হরফের মাপ পরিবর্তনযোগ্য: ১০০%, ১২৫%, ১৫০% (Font scale support).</li>
          <li>স্ক্রিন রিডার ও টেক্সট-টু-স্পিচ (TTS) অডিও সহায়তা (বাংলা, হিন্দি, ইংরেজি).</li>
          <li>
            <em>Documented Gaps:</em> কিছু ডিভাইসে বাংলা বা হিন্দি ভয়েস সিন্থেসিস উপলব্ধ নাও হতে পারে; সে ক্ষেত্রে স্বাভাবিক টেক্সট প্রদর্শন অব্যাহত থাকে।
          </li>
        </ul>
      </div>

      {/* 5. DATA SOURCES */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-text)", marginBottom: "0.5rem" }}>
          ৫. প্রযুক্তি ও ডেটা উৎস (Data Sources)
        </h2>
        <ul style={{ fontSize: "0.85rem", lineHeight: 1.7, paddingLeft: "1.2rem", color: "var(--color-text)" }}>
          <li><strong>আবহাওয়া পূর্বাভাস:</strong> Open-Meteo (মুক্ত এপিআই, কোনো এপিআই কী প্রয়োজন নেই).</li>
          <li><strong>ক্লিনিক্যাল সিদ্ধান্ত নিয়ম:</strong> ডিটারমিনিস্টিক TypeScript নিয়ম সারণী.</li>
          <li><strong>ভয়েস পার্সার:</strong> Gemini 2.5 Flash (ঐচ্ছিক, কী না থাকলে ম্যানুয়াল মোড).</li>
        </ul>
      </div>

      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <Link href="/" className="btn btn-secondary">
          ⬅ হোম পেজে ফিরুন (Back to Home)
        </Link>
      </div>
    </div>
  );
}
