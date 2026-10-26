# ঔষধ প্রহরী — Aushadh Prahari (औषध प्रहरी)

> **Voice-first, offline-capable clinical decision support PWA for Community Health Officers (CHOs) and ASHAs in rural West Bengal.**

When a patient on chronic medicines (for diabetes, hypertension, chronic kidney disease) develops an acute dehydrating illness (diarrhoea, vomiting, fever) or during high heatwave conditions, **Aushadh Prahari** identifies **which chronic medicines need a doctor's review today**, prepares a concise (≤ 300 character) Medical Officer (MO) referral message, and prioritises heatwave caseloads by transparent risk scoring.

---

## ⚠️ NON-NEGOTIABLE SAFETY & HONESTY RULES

1. **AI Never Decides Clinical Flags**: Clinical flags come **ONLY** from the pure, deterministic rule engine (`src/lib/rules.ts`). The Gemini AI model is restricted to:
   - Converting voice transcripts into structured symptom fields (`/api/parse-symptoms`).
   - Suggesting generic drug classes for unknown brands for pharmacist review (`/api/suggest-class`).
   All AI output requires human confirmation.
2. **Never Directs Medicine Changes**: The application **NEVER** directs anyone to stop, skip, reduce, or alter medicines. Wording is strictly framed as: *"Ask the doctor today about: <medicine>"*.
3. **Fail-Safe Design**: Unknown medicines, ambiguous symptoms, low AI confidence, or missing fields default to `ASK_DOCTOR_TODAY`. Red-flag symptoms (no urine for 8+ hours, confusion, dizziness, blood in stool, chest pain) trigger immediate `GO_TO_HEALTH_FACILITY_NOW`.
4. **Mandatory Disclaimer**: Every screen and message displays:  
   > *"Decision-support aid. Not a medical device. Do not change any medicine without a doctor."*
5. **No Invented Clinical Data**: All rules in `ruleTable.ts` and brand entries in `brands.seed.json` are marked `signedOff: false` with visible *"UNSIGNED RULE — clinician review required"* badges until signed off in the Review Queue.
6. **Synthetic Demo Data**: Demo metrics and dashboards are explicitly labeled `"⚠️ SYNTHETIC DEMO DATA"`. Evaluation metrics are strictly calculated from user-imported or demo benchmark vignettes.

---

## 🌐 Language Consistency & Browser Auto-Translate Prevention

- **Single Language Switcher**: The header dropdown controls the entire interface across Bengali (`bn`), Hindi (`hi`), and English (`en`), persisting in `localStorage` and synchronizing with Web Speech API recognition and synthesis (`bn-IN`, `hi-IN`, `en-IN`).
- **Browser Auto-Translate Prevention**: Enforces `<html lang={lang} translate="no">` and `<meta name="google" content="notranslate" />` to block unpredictable browser auto-translations.
- **Language Audit Tool**: Accessible at `/about/language-check`, providing a side-by-side verification table of all strings across languages with loud failures (`[[key]]`) for any untranslated token in development.

---

## 🔐 Review Queue PIN Authentication & Security

- **First-Time PIN Establishment**: On first access to `/review`, the reviewer establishes a personal 4–6 digit PIN with mandatory confirmation. There is **no default PIN** in the application.
- **Web Crypto PBKDF2 Hashing**: PINs are hashed client-side using Web Crypto PBKDF2 (HMAC-SHA-256, 100,000 iterations, unique device salt).
- **Lockout & Inactivity Protection**: Tracks failed attempts with a countdown, enforcing a 30-second lockout after 5 consecutive failures. Sessions automatically lock after 5 minutes of inactivity.
- **Clinical Governance**: Sign-offs record the physician's name, WBMC registration number, and timestamp.
> *Note: This client-side PIN protects against casual device-level snooping on shared community tablets; enterprise clinical deployment requires server-side authentication.*

---

## 🎯 Demo Mode & Guided Presentation Walkthrough

- **One-Tap Demo Switch**: Available in the top header and at `/demo` with a persistent yellow banner `"DEMO MODE — SYNTHETIC WALKTHROUGH DATA"`.
- **Complete Storage Isolation**: When Demo Mode is active, all queries and mutations are isolated to in-memory/demo state—**real local IndexedDB records are never modified**.
- **Preloaded Presentation Caseload**: Seeds 8 representative patients, 3 acute illness scenarios, 1 heatwave caseload, and 20 multi-rater benchmark vignettes.
- **6-Step Guided Checklist**: Pre-configured jump buttons at `/demo` for live demonstration of language switching, dehydration + ACEi + metformin checks, red-flag emergency overrides, unrecognized village brand escalation, PIN-gated sign-off, and validation metrics.
- **Single-Tap Reset**: Reset button immediately returns the demo environment to a clean baseline state.

---

## ⚠️ What is NOT Validated

> [!CAUTION]
> **Clinician Review Required Before Clinical Deployment:**
> - **Rules Table**: The sick-day medication rules in `src/lib/ruleTable.ts` are clinical placeholder examples based on typical guidelines (e.g. SICK rules for ACEi/ARB/diuretics/metformin/SGLT2i/NSAIDs) but **have NOT been certified or signed off by local health authorities**.
> - **Brand Dictionary**: The seed brand dictionary contains placeholder mappings for demonstration. All unapproved brands are treated as UNKNOWN and flagged for doctor consultation.
> - **Heat Risk Weights**: Risk scoring weights in `src/lib/risk.ts` are transparent heuristic placeholders, not derived from epidemiological models.
> - **AI Extraction Accuracy**: Voice recognition and transcript parsing accuracy depends on acoustic noise, dialect variations, and device microphones. Always verify parsed fields before confirming.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, Strict TypeScript)
- **Styling**: High-contrast outdoor-readable CSS theme + Tailwind CSS
- **Local Storage**: IndexedDB via `idb` + LocalStorage for offline persistence
- **PWA**: Service Worker (`public/sw.js`) + Web App Manifest (`public/manifest.json`)
- **Speech**: Web Speech API (`SpeechRecognition` for voice input, `SpeechSynthesis` for TTS in Bengali, Hindi, and English)
- **Weather**: Open-Meteo API (free, open, keyless) with offline manual override
- **Testing**: Vitest (110 tests covering rules, fail-safes, banned words, PIN PBKDF2, i18n completeness, and JSX lint) + Playwright (6 end-to-end browser tests)

---

## 🚀 Quick Start

### 1. Installation
```bash
git clone https://github.com/krish/sfic_project.git
cd sfic_project
npm install
```

### 2. Environment Setup
Copy the example environment configuration:
```bash
cp .env.example .env.local
```
Add your Gemini API key (optional — app degrades gracefully to manual entry without it):
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build & Start Production Server
```bash
npm run build
npm run start
```

---

## 🧪 Testing Quality Gates

### Run Vitest Unit Tests (110 Tests)
Includes rule evaluation, fail-safe paths, banned-wording lint, risk scoring, MO message builder, evaluation metrics, PBKDF2 PIN authentication, i18n completeness, and JSX unlocalized string scanner:
```bash
npm run test
```

### Run Playwright E2E Tests (6 Tests)
Validates browser auto-translate prevention, dynamic language switching across Bengali and Hindi without reloads, side-by-side language audits, first-time PBKDF2 PIN setup/lockout, and full check-flow execution:
```bash
npx playwright test
```

---

## 📂 Key Features & Routing

| Route | Feature | Description |
|---|---|---|
| `/` | **Home** | Primary navigation, font scaler (100/125/150%), MO phone config, sync status. |
| `/check` | **Illness Check** | Voice or manual symptom input, fuzzy brand search, deterministic rule evaluation, MO message generation, home care reminders. Supports `?demo=scenario1/2/3`. |
| `/heat` | **Heatwave List** | 3-day Open-Meteo forecast, heat index calculation, caseload risk ranking, "Called / Not reached" tracker. |
| `/patients` | **Patient Store** | Pseudonymous local patient tokens (DPDP Act aligned, no names/phone numbers). |
| `/review` | **Review Queue** | PBKDF2 PIN-gated review interface for pharmacists & physicians to approve brands and sign off rules. |
| `/evaluate` | **Evaluation Harness** | Benchmarking suite for clinical vignettes (sensitivity, specificity, kappa, missed urgent cases), brand mapping, and speech extraction. |
| `/demo` | **Demo Walkthrough** | 6-step guided checklist with 1-tap launchers for presentations and automated demo seeding/reset. |
| `/dashboard` | **Analytics Dashboard** | Case breakdown by illness, drug classes, and heat index with real vs synthetic data toggle. |
| `/about` | **About & Privacy** | Clinical limits, DPDP Act 2023 alignment, WCAG 2.2 AA accessibility documentation, data deletion tool. |
| `/about/language-check` | **Language Audit** | Comprehensive side-by-side string comparison and verification table across EN, BN, and HI. |

---

## 🔒 Privacy & DPDP Act 2023 Compliance

- **No Personal Identifiers**: Patient names, phone numbers, and Aadhaar numbers are never collected or stored.
- **Pseudonymous Tokens**: Patients are identified exclusively by locally generated tokens (e.g. `AP-98214`).
- **On-Device Storage**: Data is kept on the CHO's device in IndexedDB (`aushadh-prahari`).
- **Prompt Injection Hygiene**: Transcripts from users are treated strictly as data in system instructions.
- **Right to Erasure**: A prominent "Delete All My Data" button is available on the Home and About pages.
