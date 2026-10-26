import { describe, it, expect, vi } from "vitest";
import {
  t,
  STRINGS,
  ALLOWLIST_IDENTICAL,
  getAllLanguageAuditItems,
  formatDate,
  formatNumber,
  formatTime,
  setLanguage,
  getLanguage,
  type Lang,
  type Strings,
} from "./i18n";

describe("i18n — Internationalisation Quality Gates", () => {
  const enKeys = Object.keys(STRINGS.en) as (keyof Strings)[];
  const bnKeys = Object.keys(STRINGS.bn) as (keyof Strings)[];
  const hiKeys = Object.keys(STRINGS.hi) as (keyof Strings)[];

  it("checks every key in English exists in Bengali and Hindi dictionaries", () => {
    expect(enKeys.length).toBeGreaterThan(100);
    expect(bnKeys.length).toBe(enKeys.length);
    expect(hiKeys.length).toBe(enKeys.length);

    for (const key of enKeys) {
      expect(STRINGS.bn[key], `Missing key "${key}" in Bengali dictionary`).toBeDefined();
      expect(STRINGS.hi[key], `Missing key "${key}" in Hindi dictionary`).toBeDefined();
    }
  });

  it("ensures no translation is empty", () => {
    for (const lang of ["en", "bn", "hi"] as Lang[]) {
      for (const key of enKeys) {
        const val = STRINGS[lang][key];
        expect(typeof val, `Key "${key}" in ${lang} must be string`).toBe("string");
        expect(val.trim().length, `Key "${key}" in ${lang} cannot be empty`).toBeGreaterThan(0);
      }
    }
  });

  it("ensures Bengali and Hindi values are not identical to English unless in explicit allowlist", () => {
    const identicalInBn: string[] = [];
    const identicalInHi: string[] = [];

    for (const key of enKeys) {
      const enVal = STRINGS.en[key];
      const bnVal = STRINGS.bn[key];
      const hiVal = STRINGS.hi[key];

      if (bnVal === enVal && !ALLOWLIST_IDENTICAL.has(enVal)) {
        identicalInBn.push(`${key}: "${enVal}"`);
      }
      if (hiVal === enVal && !ALLOWLIST_IDENTICAL.has(enVal)) {
        identicalInHi.push(`${key}: "${enVal}"`);
      }
    }

    expect(
      identicalInBn,
      `Bengali translations identical to English without allowlist:\n${identicalInBn.join("\n")}`
    ).toHaveLength(0);

    expect(
      identicalInHi,
      `Hindi translations identical to English without allowlist:\n${identicalInHi.join("\n")}`
    ).toHaveLength(0);
  });

  it("fails loudly when key is missing, logging error and returning [[key]]", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const missingKey = "non_existent_key_xyz";
    const rendered = t(missingKey);
    expect(rendered).toBe(`[[${missingKey}]]`);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("supports variable interpolation helper t('key', { name: value })", () => {
    const result = t("searchResultsCount", { count: 5 }, "en");
    expect(result).toBe("Found 5 matching brands:");

    const resultBn = t("searchResultsCount", { count: 3 }, "bn");
    expect(resultBn).toBe("3টি মিল পাওয়া ব্র্যান্ড:");
  });

  it("formats dates, times, and numbers with Intl per locale", () => {
    const testDate = new Date("2026-10-25T14:30:00Z");
    const formattedEn = formatDate(testDate, "en");
    expect(formattedEn).toContain("2026");

    const formattedBn = formatDate(testDate, "bn");
    expect(formattedBn).toBeDefined();

    const formattedNum = formatNumber(12500, "en");
    expect(formattedNum).toBe("12,500");
  });

  it("generates complete language audit entries with zero unreviewed items", () => {
    const auditItems = getAllLanguageAuditItems();
    expect(auditItems.length).toBe(enKeys.length);
    const unreviewed = auditItems.filter((i) => i.needsReview);
    expect(unreviewed).toHaveLength(0);
  });
});
