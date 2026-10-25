/**
 * brands.ts — Brand → Drug Class Dictionary
 *
 * ⚠️  All entries are unsigned placeholders. Pharmacist review required.
 * Supports:
 *  - Exact match (case-insensitive)
 *  - Fuzzy match (Levenshtein distance ≤ 2)
 *  - CSV import
 *  - LocalStorage override for reviewer-approved entries
 */

import type { BrandEntry, DrugClass } from "./schemas";
import SEED_DATA from "../data/brands.seed.json";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BrandDict = Record<string, BrandEntry>;

// ─── Build initial dictionary from seed ──────────────────────────────────────

function buildDict(entries: BrandEntry[]): BrandDict {
  const dict: BrandDict = {};
  for (const entry of entries) {
    dict[entry.brand.toLowerCase()] = entry;
    if (entry.brandBn) {
      dict[entry.brandBn.toLowerCase()] = entry;
    }
  }
  return dict;
}

// Exported mutable dict (updated at runtime when reviewer approves entries)
export let BRANDS_DICT: BrandDict = buildDict(SEED_DATA as BrandEntry[]);

// ─── Reset / merge from approved entries ─────────────────────────────────────

export function mergeBrandEntries(entries: BrandEntry[]): void {
  BRANDS_DICT = { ...BRANDS_DICT, ...buildDict(entries) };
}

export function resetToSeed(): void {
  BRANDS_DICT = buildDict(SEED_DATA as BrandEntry[]);
}

// ─── Lookup ───────────────────────────────────────────────────────────────────

export function lookupBrand(name: string): BrandEntry | null {
  const key = name.toLowerCase().trim();
  return BRANDS_DICT[key] ?? null;
}

// ─── Levenshtein distance (simple, ≤ 200 chars for safety) ───────────────────

export function levenshtein(a: string, b: string): number {
  if (a.length > 200 || b.length > 200) return 999;
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

// ─── Fuzzy search ─────────────────────────────────────────────────────────────

export interface FuzzyResult {
  brand: string;
  entry: BrandEntry;
  distance: number;
}

export function fuzzySearch(query: string, maxDistance = 2): FuzzyResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: FuzzyResult[] = [];
  const seen = new Set<string>();

  for (const [key, entry] of Object.entries(BRANDS_DICT)) {
    const uniqueKey = entry.brand.toLowerCase();
    if (seen.has(uniqueKey)) continue;
    seen.add(uniqueKey);

    // Check if query is substring (distance 0 effectively)
    if (key.includes(q) || entry.salt.toLowerCase().includes(q)) {
      results.push({ brand: entry.brand, entry, distance: 0 });
      continue;
    }

    const dist = levenshtein(q, key);
    if (dist <= maxDistance) {
      results.push({ brand: entry.brand, entry, distance: dist });
    }
  }

  return results.sort((a, b) => a.distance - b.distance).slice(0, 10);
}

export function searchBrands(query: string): BrandEntry[] {
  return fuzzySearch(query).map((r) => r.entry);
}

// ─── CSV Import ───────────────────────────────────────────────────────────────

/**
 * Parse a CSV string of brand entries.
 * Expected columns: brand, brandBn (optional), salt, classes (comma-sep in quotes), signedOff, source
 */
export function parseBrandsCSV(csvText: string): BrandEntry[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const entries: BrandEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    if (cols.length < 3) continue;

    const get = (field: string): string =>
      (cols[header.indexOf(field)] ?? "").trim().replace(/^"|"$/g, "");

    try {
      const rawClasses = get("classes").split(";").map((c) => c.trim()) as DrugClass[];
      const entry: BrandEntry = {
        brand: get("brand"),
        brandBn: get("brandbn") || undefined,
        salt: get("salt"),
        classes: rawClasses.length ? rawClasses : ["unknown"],
        signedOff: get("signedoff") === "true",
        source: get("source") || "CSV import",
        reviewerName: get("reviewername") || undefined,
        reviewedAt: get("reviewedat") || undefined,
      };
      if (entry.brand && entry.salt) {
        entries.push(entry);
      }
    } catch {
      // skip malformed rows
    }
  }
  return entries;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let inQuote = false;
  let current = "";
  for (const ch of line) {
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── Export as CSV ────────────────────────────────────────────────────────────

export function exportBrandsCSV(entries: BrandEntry[]): string {
  const header =
    "brand,brandBn,salt,classes,signedOff,source,reviewerName,reviewedAt\n";
  const rows = entries.map((e) =>
    [
      q(e.brand),
      q(e.brandBn ?? ""),
      q(e.salt),
      q(e.classes.join(";")),
      e.signedOff,
      q(e.source),
      q(e.reviewerName ?? ""),
      q(e.reviewedAt ?? ""),
    ].join(",")
  );
  return header + rows.join("\n");
}

function q(s: string | boolean): string {
  return typeof s === "boolean" ? String(s) : `"${String(s).replace(/"/g, '""')}"`;
}

// ─── Get all brand entries ─────────────────────────────────────────────────────

export function getAllBrandEntries(): BrandEntry[] {
  const seen = new Set<string>();
  const result: BrandEntry[] = [];
  for (const entry of Object.values(BRANDS_DICT)) {
    if (!seen.has(entry.brand)) {
      seen.add(entry.brand);
      result.push(entry);
    }
  }
  return result;
}
