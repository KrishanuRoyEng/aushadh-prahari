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

**D-024**: The review queue uses PBKDF2 Web Crypto authentication (HMAC-SHA-256, 100,000 iterations, unique device salt). Users establish their own 4–6 digit PIN on first run. No default PIN exists. Tracks failed attempts and enforces a 30-second lockout after 5 failures, plus a 5-minute inactivity auto-lock. This is documented as a device-level deterrent for shared tablets; clinical enterprise deployment requires server-side authentication.

## Internationalisation & Language Consistency

**D-035**: Single language switch controls the entire app across Bengali (`bn`), Hindi (`hi`), and English (`en`). Persistent in `localStorage` and synchronizes with Web Speech API recognition and synthesis. HTML is configured with `<html lang={lang} translate="no">` and `<meta name="google" content="notranslate" />` to prevent browser auto-translation interference. A dedicated audit page (`/about/language-check`) provides side-by-side verification, with loud failures (`[[key]]`) in development for missing keys.

## Demo Mode & Walkthrough Engine

**D-036**: Demo mode toggle in the header and `/demo` page provides a completely isolated in-memory/localStorage store. Reads and writes in demo mode never modify real IndexedDB patient or check records. Provides a guided 6-step checklist with 1-tap launchers for presentations (language switch, illness check prefill, red-flag override, unknown brand escalation, PIN review, heat caseload metrics) and a 1-tap reset to clean state.

## Quality Assurance & Testing

**D-037**: 110 Vitest tests (covering deterministic rules, banned wording lints, risk scoring, metrics, i18n dictionary completeness, JSX raw string scanner, and PBKDF2 PIN authentication) and 6 Playwright E2E browser tests (browser auto-translate prevention, dynamic language switches, language audit tables, PBKDF2 PIN setup/lockout, and full check-flow smoke test) pass with zero errors.

## What is NOT Validated (must be in README)

- All drug–illness interaction rules are placeholders. No physician has reviewed or approved them.  
- All brand-to-class mappings are illustrative examples only. A pharmacist must verify each entry.  
- Risk score weights are arbitrary placeholders. No epidemiological data underlies them.  
- AI (Gemini) accuracy for symptom parsing is unmeasured until the evaluation harness is run.  
- Speech recognition accuracy varies by device; Bengali voices may be unavailable on many devices.  

