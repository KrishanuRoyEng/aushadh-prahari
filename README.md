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
6. **Synthetic Demo Data**: Demo metrics and dashboards are explicitly labeled `"⚠️ SYNTHETIC DEMO DATA"`. Evaluation metrics are strictly calculated from user-imported ground truth data.

---

## ⚠️ What is NOT Validated

> [!CAUTION]
> **Clinician Review Required Before Clinical Deployment:**
> - **Rules Table**: The sick-day medication rules in `src/lib/ruleTable.ts` are clinical placeholder examples based on typical guidelines (e.g. SICK rules for ACEi/ARB/diuretics/metformin/SGLT2i/NSAIDs) but **have NOT been certified or signed off by local health authorities**.
> - **Brand Dictionary**: The seed brand dictionary contains ~20 placeholder mappings for demonstration. All unapproved brands are treated as UNKNOWN and flagged for doctor consultation.
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
- **Testing**: Vitest (pure logic, rule engine, banned wording lint, risk scoring, metrics) + Playwright (browser smoke testing)

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

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 🧪 Testing

### Run Vitest Unit Tests
Includes 95 tests covering rule evaluation, fail-safe paths, banned-wording lint, risk scoring, MO message builder, and evaluation metrics:
```bash
npm run test
```

### Lint for Banned Wording
Our build includes a test (`src/lib/bannedWords.test.ts`) that asserts no rule text in English, Bengali, or Hindi contains imperative directives like "stop", "skip", "reduce", "hold", or "do not take".

### Run Playwright E2E Smoke Test
```bash
npx playwright test
```

---

## 📂 Key Features & Routing

| Route | Feature | Description |
|---|---|---|
| `/` | **Home** | Primary navigation, font scaler (100/125/150%), MO phone config, sync status. |
| `/check` | **Illness Check** | Voice or manual symptom input, fuzzy brand search, deterministic rule evaluation, MO message generation, home care reminders. |
| `/heat` | **Heatwave List** | 3-day Open-Meteo forecast, heat index calculation, caseload risk ranking, "Called / Not reached" tracker. |
| `/patients` | **Patient Store** | Pseudonymous local patient tokens (DPDP Act aligned, no names/phone numbers). |
| `/review` | **Review Queue** | PIN-gated review interface for pharmacists & physicians to approve brands and sign off rules. |
| `/evaluate` | **Evaluation Harness** | Benchmarking suite for clinical vignettes (sensitivity, specificity, kappa, missed urgent cases), brand mapping, and speech extraction. |
| `/dashboard` | **Demo Dashboard** | Synthetic demo dataset (30 checks across 3 fictional PHCs) with toggle to view real local data. |
| `/about` | **About & Privacy** | Clinical limits, DPDP Act 2023 alignment, WCAG 2.2 AA accessibility documentation, data deletion tool. |

---

## 📥 How to Import Data

### Importing Brand Dictionaries (CSV)
Navigate to `/review` (Default PIN: `1234`), click **CSV Import**, and provide a file with columns:
```csv
brand,brandBn,salt,classes,signedOff,source
Envas,এনভাস,Enalapril,ace_inhibitor,true,WB Essential Drug List 2024
Glycomet,গ্লাইকোমেট,Metformin,metformin,true,WB Essential Drug List 2024
```

### Importing Clinical Vignettes (CSV)
Navigate to `/evaluate`, click **CSV ফাইল আপলোড** or paste into the textarea:
```csv
case_id,age_band,pregnant,kidney_disease,symptoms,medicines,reviewer_1,reviewer_2,reviewer_3
VIG-01,elderly,no,yes,loose_motions;fever,Envas (ace_inhibitor);Glycomet (metformin),yes,yes,yes
VIG-02,adult,no,no,none,Amlodipine (other),no,no,no
```

---

## 🔒 Privacy & DPDP Act 2023 Compliance

- **No Personal Identifiers**: Patient names, phone numbers, and Aadhaar numbers are never collected or stored.
- **Pseudonymous Tokens**: Patients are identified exclusively by locally generated tokens (e.g. `AP-98214`).
- **On-Device Storage**: Data is kept on the CHO's device in IndexedDB (`aushadh-prahari`).
- **Prompt Injection Hygiene**: Transcripts from users are treated strictly as data in system instructions.
- **Right to Erasure**: A prominent "Delete All My Data" button is available on the Home and About pages.
