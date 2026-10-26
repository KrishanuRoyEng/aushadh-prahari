# Aushadh Prahari — Project State Ledger

> Last updated: 2026-10-25

## Step 1 — Scaffold & Ledger
- [DONE] Create Next.js app (App Router, TypeScript strict, Tailwind, ESLint)
- [DONE] Create `.antigravity/PROJECT_STATE.md`
- [DONE] Create `.antigravity/CODE_MAP.json`
- [DONE] Create `.antigravity/DECISIONS.md`
- [DONE] Create `.env.example`

## Step 2 — Core Logic (schemas, rules, brands)
- [DONE] `src/lib/schemas.ts` — Zod schemas
- [DONE] `src/lib/ruleTable.ts` — sick-day / heat rules data (all signedOff:false)
- [DONE] `src/lib/rules.ts` — deterministic engine + evaluate()
- [DONE] `src/data/brands.seed.json` — ~20 placeholder brand entries
- [DONE] `src/lib/brands.ts` — brand dictionary + fuzzy search + CSV import
- [DONE] `src/lib/bannedWords.test.ts` — lint test for banned wording in rules
- [DONE] `src/lib/rules.test.ts` — Vitest unit tests for rule engine

## Step 3 — Supporting Logic
- [DONE] `src/lib/risk.ts` — caseload points score
- [DONE] `src/lib/weather.ts` — Open-Meteo forecast + cache + manual heat index
- [DONE] `src/lib/message.ts` — MO message builder (<= 300 chars) + share links
- [DONE] `src/lib/metrics.ts` — sensitivity/specificity/kappa
- [DONE] `src/lib/risk.test.ts`
- [DONE] `src/lib/message.test.ts`
- [DONE] `src/lib/metrics.test.ts`

## Step 4 — Utilities
- [DONE] `src/lib/i18n.ts` — Bengali/Hindi/English string dictionaries
- [DONE] `src/lib/speech.ts` — speechSynthesis wrapper
- [DONE] `src/lib/db.ts` — IndexedDB via `idb`
- [DONE] `src/lib/privacy.ts` — consent, token generation, data deletion
- [DONE] `src/lib/seed.ts` — synthetic demo data

## Step 5 — API Routes
- [DONE] `src/app/api/parse-symptoms/route.ts` — POST transcript -> structured symptoms
- [DONE] `src/app/api/suggest-class/route.ts` — POST brand -> drug class + confidence
- [DONE] `src/app/api/sync/route.ts` — stub: validate + acknowledge queued records

## Step 6 — UI Pages
- [DONE] `src/app/page.tsx` — Home
- [DONE] `src/app/check/page.tsx` — Illness check flow
- [DONE] `src/app/heat/page.tsx` — Heatwave caseload ranking
- [DONE] `src/app/patients/page.tsx` — Patient list
- [DONE] `src/app/review/page.tsx` — Review queue
- [DONE] `src/app/evaluate/page.tsx` — Evaluation harness
- [DONE] `src/app/about/page.tsx` — Limits, safety, privacy
- [DONE] `src/app/dashboard/page.tsx` — Synthetic demo dashboard

## Step 7 — PWA, Accessibility, README
- [DONE] Service worker + manifest
- [DONE] Accessibility pass (WCAG 2.2 AA)
- [DONE] README.md

## Step 8 — Build & Test
- [DONE] `npm run build` passes (0 errors)
- [DONE] `npm run test` passes (95/95 tests passing)
- [DONE] Playwright smoke test (`tests/smoke.spec.ts`)
- [DONE] Mark all [DONE], launch summary

## Step 9 — Language Consistency, PBKDF2 PIN Authentication & Demo Engine
- [DONE] Language Consistency: `<html lang={lang} translate="no">`, `<meta name="google" content="notranslate" />`
- [DONE] Dictionary Audit: all strings across `src/app` and `src/components` moved into `src/lib/i18n.ts` with `t(key, params)` interpolation and loud dev failure (`[[key]]`)
- [DONE] Indic numerals formatting and `formatDate`, `formatTime`, `formatNumber`
- [DONE] Language Audit Page: `/about/language-check` side-by-side string comparison table
- [DONE] Vitest `src/lib/i18n.test.ts` (7 tests) and `tests/jsxStringsLint.test.ts` (2 tests)
- [DONE] PIN Authentication: PBKDF2 Web Crypto (`src/lib/pinAuth.ts`), first-time setup, 30s lockout after 5 failures, 5-min inactivity lock, reviewer profile sign-offs
- [DONE] Vitest `src/lib/pinAuth.test.ts` (6 tests)
- [DONE] Demo Engine: `src/lib/demo.ts` with complete IndexedDB isolation, 8 patients, 3 illness scenarios, 20 vignettes, and 6-step guided walkthrough at `/demo`
- [DONE] Playwright Tests: `tests/i18n.spec.ts` (4 tests), `tests/pinAuth.spec.ts` (1 test), `tests/smoke.spec.ts` (1 test) -> 6/6 passing
- [DONE] Build Verification: `npm run build` compiles 0 errors, `npm run test` passes (110/110 tests passing)
