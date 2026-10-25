# Aushadh Prahari — Design Decisions & Assumptions

> Maintained by the AI builder. All clinical content is placeholder; see Safety Rules.

---

## Architecture

**D-001**: App Router (Next.js 15) used. RSC for static pages; `"use client"` for interactive flows.  
**D-002**: IndexedDB via `idb` npm package. No SQLite/WASM to keep bundle small.  
**D-003**: Tailwind CSS kept (required by spec). Custom design tokens defined in `tailwind.config.ts` for the outdoor-readable high-contrast theme.  
**D-004**: Vitest chosen over Jest for unit tests (faster, ESM-native, works with Next.js).  
**D-005**: Playwright used for E2E smoke test. Only one flow tested per spec to keep CI fast.  

## Patient Privacy

**D-006**: Patient tokens are 8-character random hex strings generated client-side using `crypto.getRandomValues`. No names or phone numbers stored anywhere in the app unless the user explicitly types them in a free-text field that they control.  
**D-007**: Consent is shown on first launch and stored in localStorage (`ap_consent_v1`). The app does not start the main flow until consent is given or declined and the decision is recorded.  
**D-008**: "Delete all my data" button calls `idb.deleteDB('aushadh-prahari')` and clears `localStorage`. No server-side data is deleted (none is stored by default).  

## AI / Gemini Integration

**D-009**: Gemini API key is only used server-side in route handlers (`/api/parse-symptoms`, `/api/suggest-class`). It is never exposed to the client bundle.  
**D-010**: When `GEMINI_API_KEY` is absent, both API routes return HTTP 503 with `{error:"AI_UNAVAILABLE", fallback:true}`. The client gracefully shows a manual entry form.  
**D-011**: Model: `gemini-2.5-flash` (fast, low-latency for speech parsing). System instruction emphasises JSON-only output. User transcript is passed as data inside a structured JSON envelope, never as a bare instruction (prompt injection mitigation).  
**D-012**: AI output is never used directly for clinical flags. The deterministic rule engine (`rules.ts`) is the only source of flags.  

## Clinical Content

**D-013**: All rules in `ruleTable.ts` are `signedOff:false` with `source:"PLACEHOLDER - TO BE VERIFIED by physician/pharmacist"`. The UI shows a prominent red badge until a clinician signs off via the Review screen.  
**D-014**: All brand entries in `brands.seed.json` are `signedOff:false`. They are illustrative examples only.  
**D-015**: No rule text contains the words: stop, skip, reduce, hold, do not take, বন্ধ করুন, ছেড়ে দিন, কমিয়ে দিন, बंद करें, छोड़ें, कम करें. A build-time lint test enforces this.  
**D-016**: Red-flag symptoms trigger "GO_TO_HEALTH_FACILITY_NOW", not clinical advice. The message says to go now; it does not advise what to do at the facility.  

## Heatwave / Weather

**D-017**: Open-Meteo API used for weather forecasts (free, no API key required). Endpoint: `https://api.open-meteo.com/v1/forecast`.  
**D-018**: Heat index computed via NOAA simplified formula (Rothfusz equation). Threshold for "heat day" is configurable in `risk.ts` data (placeholder: 41°C heat index).  
**D-019**: Location stored as lat/lon pair in localStorage. CHO sets it once in Settings (not yet a named screen; accessed from the heatwave page).  

## Internationalisation

**D-020**: Bengali (bn) is default. Hindi (hi) and English (en) selectable. Language stored in localStorage. All user-facing strings go through `t()` from `i18n.ts`. No next-intl dependency to keep bundle minimal.  
**D-021**: `speechSynthesis` used for read-aloud. If no voice found for the language, a friendly notice is shown. Speech is opt-in per session (user taps a speaker icon).  

## Message Builder

**D-022**: MO message capped at 300 characters. If the message would exceed 300 chars, medicine list is truncated with "…+N more" and the full list is available on-screen.  
**D-023**: `sms:` link uses `sms:?body=` encoding (RFC 5724). `wa.me` link uses `https://wa.me/?text=` encoding. No phone number pre-filled (CHO enters their MO's number in Settings).  

## Authentication / PIN

**D-024**: The review queue uses a simple 4-digit PIN stored as a bcrypt hash in localStorage. This is documented as NOT strong authentication; it is only a deterrent against accidental access. A full deployment should use server-side auth.  

## Offline / PWA

**D-025**: Service worker uses a cache-first strategy for the app shell and a stale-while-revalidate strategy for Open-Meteo weather data.  
**D-026**: Outbox queue stores serialised check records in IndexedDB. On connectivity restoration, records are sent to `/api/sync` in batches of 10.  

## Demo Data

**D-027**: Synthetic demo data is generated deterministically from a seed in `seed.ts`. The "SYNTHETIC DEMO DATA" banner is rendered in red and cannot be dismissed.  
**D-028**: The dashboard allows toggling to real local data; that toggle reads from IndexedDB and performs no network request.  

## Evaluation Harness

**D-029**: CSV import uses the Papa Parse library (client-side). No server upload; files are read locally.  
**D-030**: Metrics (sensitivity, specificity, Cohen's kappa) are computed only from imported/entered data. The empty state says "No data yet — import a vignette CSV to begin."  

## Accessibility

**D-031**: Minimum touch target 48×48px enforced via CSS class `touch-target` (`min-h-[48px] min-w-[48px]`).  
**D-032**: Font-size scaler at 100/125/150% stored in localStorage. Applied via `data-font-scale` attribute on `<html>`.  
**D-033**: `prefers-reduced-motion` media query respected; animations disabled when set.  
**D-034**: WCAG 2.2 AA is the target. Gaps are documented on `/about`; AAA is not claimed.  

## What is NOT Validated (must be in README)

- All drug–illness interaction rules are placeholders. No physician has reviewed or approved them.  
- All brand-to-class mappings are illustrative examples only. A pharmacist must verify each entry.  
- Risk score weights are arbitrary placeholders. No epidemiological data underlies them.  
- AI (Gemini) accuracy for symptom parsing is unmeasured until the evaluation harness is run.  
- Speech recognition accuracy varies by device; Bengali voices may be unavailable on many devices.  
