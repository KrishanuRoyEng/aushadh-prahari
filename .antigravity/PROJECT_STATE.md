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
