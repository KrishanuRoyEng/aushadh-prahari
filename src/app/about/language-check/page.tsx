"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  t,
  getLanguage,
  getAllLanguageAuditItems,
  formatNumber,
  type Lang,
  type LanguageAuditItem,
} from "@/lib/i18n";

export default function LanguageCheckPage() {
  const [lang, setLang] = useState<Lang>("bn");
  const [items, setItems] = useState<LanguageAuditItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterNeedsReview, setFilterNeedsReview] = useState(false);

  useEffect(() => {
    setLang(getLanguage());
    setItems(getAllLanguageAuditItems());

    const handleLangChange = () => setLang(getLanguage());
    window.addEventListener("ap-lang-change", handleLangChange);
    return () => window.removeEventListener("ap-lang-change", handleLangChange);
  }, []);

  const filteredItems = items.filter((item) => {
    if (filterNeedsReview && !item.needsReview) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.key.toLowerCase().includes(q) ||
      item.en.toLowerCase().includes(q) ||
      item.bn.toLowerCase().includes(q) ||
      item.hi.toLowerCase().includes(q)
    );
  });

  const needsReviewCount = items.filter((i) => i.needsReview).length;

  return (
    <div className="page-content" style={{ paddingBottom: "5rem" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-primary-dark)" }}>
          🌐 {t("langCheckTitle", lang)}
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
          {t("langCheckSubtitle", lang)}
        </p>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="card" style={{ marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <input
          type="text"
          className="input"
          placeholder={t("langCheckSearchPlaceholder", lang)}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
            {t("langCheckTotalKeys", { count: formatNumber(items.length, lang) }, lang)}
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className={`btn ${!filterNeedsReview ? "btn-primary" : "btn-secondary"}`}
              style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", minHeight: 30 }}
              onClick={() => setFilterNeedsReview(false)}
            >
              {t("langCheckFilterAll", { count: formatNumber(items.length, lang) }, lang)}
            </button>
            <button
              type="button"
              className={`btn ${filterNeedsReview ? "btn-warning" : "btn-secondary"}`}
              style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", minHeight: 30 }}
              onClick={() => setFilterNeedsReview(true)}
            >
              ⚠️ {t("langCheckFilterNeedsReview", { count: formatNumber(needsReviewCount, lang) }, lang)}
            </button>
          </div>
        </div>
      </div>

      {/* Translations Audit Table */}
      <div className="card" style={{ padding: "0.5rem" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid var(--color-border)" }}>
                <th style={{ padding: "0.6rem 0.4rem", textAlign: "left", width: "18%" }}>
                  {t("langCheckColKey", lang)}
                </th>
                <th style={{ padding: "0.6rem 0.4rem", textAlign: "left", width: "26%" }}>
                  {t("langCheckColEn", lang)}
                </th>
                <th style={{ padding: "0.6rem 0.4rem", textAlign: "left", width: "26%" }}>
                  {t("langCheckColBn", lang)}
                </th>
                <th style={{ padding: "0.6rem 0.4rem", textAlign: "left", width: "26%" }}>
                  {t("langCheckColHi", lang)}
                </th>
                <th style={{ padding: "0.6rem 0.4rem", textAlign: "center", width: "4%" }}>
                  {t("langCheckColStatus", lang)}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr
                  key={item.key}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    background: item.needsReview ? "#fffbeb" : "transparent",
                  }}
                >
                  <td style={{ padding: "0.5rem 0.4rem", fontFamily: "monospace", fontSize: "0.75rem", color: "#475569" }}>
                    {item.key}
                  </td>
                  <td style={{ padding: "0.5rem 0.4rem", color: "#1e293b", lineHeight: 1.4 }}>
                    {item.en}
                  </td>
                  <td style={{ padding: "0.5rem 0.4rem", color: "#065f46", fontWeight: 500, lineHeight: 1.4 }}>
                    {item.bn}
                  </td>
                  <td style={{ padding: "0.5rem 0.4rem", color: "#1e3a8a", fontWeight: 500, lineHeight: 1.4 }}>
                    {item.hi}
                  </td>
                  <td style={{ padding: "0.5rem 0.4rem", textAlign: "center" }}>
                    {item.needsReview ? (
                      <span className="badge badge-unsigned" title={t("langCheckStatusNeedsReview", lang)}>
                        ⚠️
                      </span>
                    ) : (
                      <span className="badge badge-verified" title={t("langCheckStatusVerified", lang)}>
                        ✓
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <Link href="/about" className="btn btn-secondary">
          ⬅ {t("navAbout", lang)}
        </Link>
      </div>
    </div>
  );
}
