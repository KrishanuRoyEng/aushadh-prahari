/**
 * i18n.ts — Complete Internationalisation Engine
 *
 * Languages: Bengali (bn, default), Hindi (hi), English (en).
 *
 * Strict Rules:
 *  1. One language switch controls the entire app, HTML lang, and speech APIs.
 *  2. Missing keys fail loudly in development: console.error + render [[key]].
 *  3. Interpolation helper t(key, { name: value }) supported.
 *  4. Reactive language updates without page reload.
 *  5. Intl date, time, and number formatting with Indic numeral toggle.
 *  6. All drug classes, symptoms, rule texts, and UI messages localized in all 3 languages.
 */

export type Lang = "bn" | "hi" | "en";

export const LANG_LABELS: Record<Lang, string> = {
  bn: "বাংলা",
  hi: "हिंदी",
  en: "English",
};

export const SPEECH_LANG: Record<Lang, string> = {
  bn: "bn-IN",
  hi: "hi-IN",
  en: "en-IN",
};

// ─── Canonical English Strings ───────────────────────────────────────────────

const STRINGS_EN = {
  // App branding
  appName: "Aushadh Prahari",
  appTagline: "Medicine Guardian for CHOs & ASHAs",
  appSubtitle: "Rural Health Decision Support System",
  appRole: "For Community Health Officers & ASHA workers",

  // Navigation
  navHome: "Home",
  navCheck: "Illness Check",
  navHeat: "Heatwave List",
  navPatients: "Patients",
  navReview: "Review Queue",
  navEvaluate: "Evaluate",
  navAbout: "About",
  navDashboard: "Dashboard",
  navDemo: "Demo Walkthrough",

  // Disclaimer & System Banners
  safetyDisclaimer: "Decision-support aid. Not a medical device. Do not change any medicine without a doctor.",
  unsignedBadge: "UNSIGNED RULE — clinician review required",
  syntheticDataBanner: "⚠️ SYNTHETIC DEMO DATA — not real patient data",
  demoModeBanner: "DEMO MODE — SYNTHETIC WALKTHROUGH DATA (Real store untouched)",
  demoWalkthroughBadge: "DEMO SCENARIO",

  // Common UI words
  loading: "Loading…",
  save: "Save",
  saved: "Saved",
  cancel: "Cancel",
  back: "Back",
  next: "Next",
  confirm: "Confirm",
  edit: "Edit",
  delete: "Delete",
  deleteAll: "Delete all my data",
  deleteConfirm: "Are you sure? This cannot be undone.",
  close: "Close",
  done: "Done",
  copy: "Copy",
  copied: "Copied!",
  share: "Share",
  filter: "Filter",
  search: "Search",
  all: "All",
  actions: "Actions",
  status: "Status",
  date: "Date",
  time: "Time",
  total: "Total",
  notes: "Notes",
  yes: "Yes",
  no: "No",
  unknown: "Unknown",
  notSure: "Not sure",
  none: "None",
  goBack: "Go back",
  selectLanguage: "Select language",

  // Connectivity & Sync
  online: "Online",
  offline: "Offline",
  offlineMode: "Offline mode — AI features require internet connection.",
  syncPending: "Sync pending",
  syncNow: "Sync Now",
  syncUpToDate: "✓ Everything up to date",
  syncSuccess: "✓ Sync completed successfully",
  syncFailed: "✗ Sync failed — please retry",
  syncOffline: "✗ Offline — will retry when connected",
  aiUnavailable: "AI unavailable — please enter manually.",
  aiManualFallback: "AI assistant offline. You can proceed with manual entry.",
  noVoice: "No speech synthesizer found for this language on this device.",

  // Home Page
  homeNewCheck: "New Illness Check",
  homeNewCheckSubtitle: "Check medicine safety for an acutely ill patient",
  homeHeatwave: "Heatwave Patient List",
  homeHeatwaveSubtitle: "Rank and prioritize vulnerable patients on heat days",
  homePatients: "My Patient List",
  homePatientsSubtitle: "Browse, search, or enroll community patients",
  homeReview: "Pharmacist / Physician Review",
  homeReviewSubtitle: "Approve medicine brands and rule recommendations",
  homeDashboard: "Metrics & Statistics",
  homeDashboardSubtitle: "View caseload stats and clinical activity",
  homeAbout: "About & Safety Information",
  homeAboutSubtitle: "Limitations, privacy notices, and methodology",
  homeDemo: "Interactive Demo Walkthrough",
  homeDemoSubtitle: "Guided 6-step presentation tour with synthetic cases",
  homeStatsTotalChecks: "Total Checks",
  homeStatsPendingSync: "Pending Sync",
  homeStatsSyncNow: "Sync Now",

  // Settings
  settingsTitle: "⚙️ Settings & Device Configuration",
  settingsFontScale: "Text Display Size",
  settingsMOPhone: "Medical Officer (MO) Contact Number",
  settingsMOPhonePlaceholder: "+91 98765 43210",
  settingsMOPhoneHelp: "Pre-configures SMS and WhatsApp links for instant case escalation",
  settingsDeleteData: "Danger Zone: Clear Local Device Records",
  settingsIndicNumerals: "Use Indic Numerals (Bengali / Devanagari digits)",

  // First-time Consent Modal
  consentTitle: "Welcome to Aushadh Prahari",
  consentBody: "This application stores patient check data strictly on this local device. No names or phone numbers are required. Under DPDP Act 2023, you can erase all data at any time from Settings.",
  consentAlert: "Decision-support aid. Not a medical device. Never change or discontinue any prescription without a physician.",
  consentAccept: "I Understand & Agree — Continue ✓",
  consentDecline: "Do Not Store Any Data (Ephemeral Mode)",

  // Patient Registration & Profile
  patientToken: "Patient Token",
  patientSelectExisting: "Or select from registered patients:",
  patientCreateNew: "Create New Anonymous Token",
  patientTokenPlaceholder: "e.g. P-8492 or tap Generate",
  patientAgeBand: "Age Group",
  ageBandChild: "Child (< 18 years)",
  ageBandAdult: "Adult (18–60 years)",
  ageBandElderly: "Elderly (> 60 years)",
  patientPregnant: "Currently Pregnant?",
  patientKidneyDisease: "Known Chronic Kidney Disease?",
  patientKnownKidney: "Chronic Kidney Disease (CKD)",
  patientLivesAlone: "Lives Alone without Family?",
  patientWorksOutdoors: "Works Outdoors in the Sun?",
  patientCreatinine: "Latest Serum Creatinine (mg/dL)",
  patientCreatinineHelp: "Optional: measured in last 3 months",
  patientEGFR: "Latest eGFR (mL/min/1.73m²)",
  patientEGFRHelp: "Optional: estimated glomerular filtration rate",
  patientMedicines: "Chronic Prescription Medicines",
  patientChronicMeds: "Regular Daily Medicines",
  patientFilterAll: "All Patients",
  patientFilterElderly: "Elderly (>60)",
  patientFilterKidney: "Kidney Disease",
  patientFilterOutdoor: "Outdoor Workers",
  patientAddTitle: "Enroll New Patient",
  patientListEmpty: "No patients registered yet. Tap 'Enroll New Patient' to begin.",
  patientDetailTitle: "Patient Profile & Illness History",
  patientHistory: "Past Illness Checks",

  // Symptoms & Acute Illness Assessment
  step1Title: "Step 1: Patient Profile",
  step1Subtitle: "Confirm baseline vulnerability indicators",
  step2Title: "Step 2: Acute Symptoms",
  step2Subtitle: "Select symptoms or dictate in voice",
  step3Title: "Step 3: Medicines",
  step3Subtitle: "Search brand names or select classes",
  step4Title: "Step 4: Clinical Guidance",
  step4Subtitle: "Review deterministic flags and message the MO",

  stepSymptomsPrompt: "What symptoms does the patient have today?",
  stepSymptomsMicPrompt: "Speak symptoms in your own words (Voice)",
  stepSymptomsListening: "Listening… Speak now in Bengali, Hindi, or English",
  stepSymptomsStopListening: "Stop Recording",
  stepSymptomsParseSuccess: "✓ Voice recognized and symptoms extracted",
  stepSymptomsParseFailed: "Could not parse voice recording. Please select manually.",
  durationQuestion: "How many days has the patient had these symptoms?",
  durationDaysLabel: "Duration (Days)",
  ableToDrink: "Can the patient drink liquids and retain fluids?",
  urineQuestion: "Did the patient pass urine in the last 8 hours?",
  dizzinessQuestion: "Is the patient experiencing severe dizziness or fainting?",
  confusionQuestion: "Any confusion, drowsiness, or altered mental state?",
  bloodInStool: "Any visible blood or black tarry stools?",
  chestPain: "Any chest pain or difficulty breathing?",
  cannotKeepFluids: "Unable to keep fluids down for more than 24 hours?",

  symptomLooseMotions: "Loose Motions / Diarrhoea",
  symptomVomiting: "Vomiting",
  symptomFever: "Fever",
  symptomNotEating: "Not Eating or Drinking",
  symptomHotWeather: "Severe Hot Weather",
  symptomNone: "None of these acute symptoms",

  // Medicine Selection & Brand Search
  stepMedicinesPrompt: "Which chronic medicines does the patient take?",
  searchMedicinePlaceholder: "Type medicine brand (e.g. Glycomet, Cardace, Lasix)…",
  searchResultsCount: "Found {count} matching brands:",
  noMedicineFound: "No exact brand found in database.",
  brandStatusVerified: "Verified",
  brandStatusUnsigned: "Unsigned Placeholder",
  brandStatusUnknown: "Unknown Brand",
  brandStatusPendingReview: "Pending Review",
  selectedMedicinesTitle: "Selected Medicines for Evaluation ({count})",
  selectedMedicinesEmpty: "No medicines selected yet. Search above to add.",
  removeMedicine: "Remove",

  customBrandTitle: "Medicine Not in List? Add Custom Entry",
  customBrandPlaceholder: "Enter brand or commercial name…",
  customClassLabel: "Select Pharmacological Drug Class:",
  askAISuggest: "Ask AI to suggest drug class",
  askAILoading: "Analyzing drug formulation with AI…",
  addManualClass: "Set class manually",
  submitToReview: "Submit unknown brand to Medical Officer review queue",

  // Clinical Result Screen
  resultUrgentBanner: "🚨 GO TO HEALTH FACILITY NOW",
  resultAskDoctorBanner: "⚠️ ASK THE DOCTOR TODAY",
  resultNoFlag: "✓ NO MEDICINE SAFETY FLAGS AT THIS TIME",
  resultInfoBanner: "ℹ️ CLINICAL INFORMATION NOTE",

  resultUrgentDesc: "Patient exhibits red-flag emergency symptoms requiring immediate medical evaluation. Do not delay transfer.",
  resultAskDoctorDesc: "One or more chronic medicines require a physician decision today due to acute dehydration or illness risks.",
  resultNoFlagDesc: "None of the patient's recorded medicines meet sick-day hold criteria under current symptom inputs.",

  flaggedMedicinesTitle: "Medicines Requiring Doctor Decision Today ({count})",
  unflaggedMedicinesTitle: "Medicines with No Urgent Flags ({count})",
  whyToggle: "Why this guidance? (Clinical Rationale)",
  whyTitle: "Deterministic Rule Rationale",
  whyClose: "Close Rationale",

  ruleId: "Rule Identifier",
  ruleText: "Clinical Guidance Rule",
  ruleStatus: "Validation Status",
  ruleSource: "Clinical Evidence Source",

  // Medical Officer Message & Sharing
  moMessageTitle: "Summary Message for Medical Officer (MO)",
  moMessageCount: "Character Count: {count} / 300 maximum",
  copyMessage: "Copy Message Text",
  messageCopied: "✓ Copied to clipboard!",
  shareViaSMS: "Send via SMS",
  shareViaWhatsApp: "Send via WhatsApp",

  homeCareTitle: "Supportive Home Care Reminders",
  homeCareReminder: "Encourage frequent sips of Oral Rehydration Solution (ORS) or coconut water. Monitor urination. Transfer immediately if vomiting persists or urine stops.",
  saveCheckRecord: "Save Check to Patient Record",
  checkSavedSuccess: "✓ Check saved to local device successfully",

  // Heatwave Screen
  heatPageTitle: "Heatwave Patient Vulnerability Ranking",
  heatPageSubtitle: "Prioritizes community patients by thermal and pharmacological risk score",
  heatIndex: "Current Heat Index",
  heatDay: "HEAT DAY ALERT — Take precautionary outreach",
  notHeatDay: "Normal Temperature — Standard monitoring",
  heatThresholdNote: "Threshold: Heat Index ≥ 41°C warrants targeted vulnerable patient outreach.",
  heatForecast: "3-Day Weather Forecast",
  heatForecastToday: "Today",
  heatForecastTomorrow: "Tomorrow",
  heatForecastDayAfter: "Day After Tomorrow",
  heatManualEntryTitle: "Manual Temperature & Humidity Input",
  heatManualTempLabel: "Ambient Temperature (°C)",
  heatManualHumidityLabel: "Relative Humidity (%)",
  heatManualComputeBtn: "Calculate Heat Index",
  heatCaseloadTitle: "Ranked Patient Caseload ({count})",
  heatCaseloadEmpty: "No enrolled patients found. Add patients to view heat vulnerability rankings.",
  heatRank: "Rank #{rank}",
  riskScore: "Risk Score: {score} pts",
  whyThisRank: "Why this ranking?",
  contactStatus: "Outreach Contact Status",
  contactStatusNone: "Not contacted today",
  called: "Contacted / Advised",
  notReached: "Phone Unreachable / Absent",
  markCalled: "Mark Contacted",
  markNotReached: "Mark Unreachable",
  heatOutdoorRisk: "Outdoor worker in direct sunlight (+3 pts)",
  heatElderlyRisk: "Elderly individual aged > 60 (+2 pts)",
  heatDiureticRisk: "Prescribed diuretic or SGLT2 inhibitor (+4 pts)",
  heatLivingAloneRisk: "Lives alone without caregiver (+2 pts)",

  // PIN Authentication & Review Screen
  reviewPageTitle: "Medical Officer / Pharmacist Review Queue",
  reviewPageSubtitle: "Verify pending drug classes, endorse rules, and export audited clinical logs",
  pinTitleSetup: "Create Reviewer Security PIN",
  pinDescSetup: "Set a 4 to 6 digit security PIN to protect clinical review actions on this shared device.",
  pinInputSetup: "Enter New 4-6 Digit PIN",
  pinConfirmSetup: "Confirm New PIN",
  pinBtnSet: "Establish PIN & Open Queue",
  pinTitleLogin: "Reviewer PIN Verification",
  pinDescLogin: "Enter your reviewer PIN to unlock clinical governance controls.",
  pinInputLogin: "Enter PIN",
  pinBtnLogin: "Unlock Queue",
  pinErrorWrong: "Incorrect PIN entered.",
  pinAttemptsRemaining: "{remaining} attempts remaining before temporary lockout.",
  pinLockedOut: "Account temporarily locked due to excessive failed attempts.",
  pinLockedOutWait: "Please wait {seconds} seconds before retrying.",
  pinTitleChange: "Change Security PIN",
  pinOldInput: "Current PIN",
  pinNewInput: "New 4-6 Digit PIN",
  pinBtnChange: "Update PIN",
  pinChangeSuccess: "✓ Security PIN updated successfully",
  pinBtnLogout: "Lock & Logout",
  pinAutoLockNotice: "Session auto-locks after 5 minutes of inactivity for privacy protection.",

  reviewTabBrands: "Pending Brand Suggestions ({count})",
  reviewTabRules: "Clinical Rule Endorsements ({count})",
  reviewPendingBrands: "Unknown Brands Awaiting Pharmacist Classification",
  reviewUnsignedRules: "Clinical Decision Rules Pending Physician Endorsement",
  reviewNoPendingBrands: "✓ No pending brands in review queue.",
  reviewNoUnsignedRules: "All clinical rules have been reviewed and endorsed.",
  reviewApprove: "Approve Classification",
  reviewEdit: "Change Class",
  reviewReject: "Reject / Discard",
  reviewSave: "Save Decision",
  reviewerNameLabel: "Reviewer Full Name & Title",
  reviewerRegLabel: "Medical / Pharmacy Registration Number",
  reviewerProfileSave: "Update Reviewer Credentials",
  reviewedByPrefix: "Reviewed by: {name}",
  reviewedAtPrefix: "Reviewed on: {date}",
  exportJSON: "Export Audited JSON",
  exportCSV: "Export Audited CSV",
  importCSV: "Import Approved CSV",
  importSuccess: "✓ Imported and merged {count} brand records successfully",
  importError: "✗ Failed to parse imported CSV file. Please verify schema.",
  ruleSignOffBtn: "Sign Off & Endorse Rule",
  ruleSignedOffBadge: "✓ Clinician Endorsed",
  ruleUnsignedBadge: "⚠️ Unsigned Rule (Placeholder)",

  // Evaluation Screen
  evaluatePageTitle: "Clinical Evaluation & Validation Harness",
  evaluatePageSubtitle: "Benchmarking deterministic rule engine and AI parsing against clinical gold standards",
  importVignettes: "Import Vignette Benchmark CSV",
  runEvaluation: "Run Evaluation Pipeline",
  noDataYet: "No evaluation data loaded yet. Tap 'Load Demo Walkthrough Data' or import a vignette CSV to run benchmarks.",
  demoVignettesComputed: "Computed from synthetic demo vignettes (20 clinical test cases, 3 raters)",
  sensitivityLabel: "Sensitivity (Recall on Urgent/Flagged Cases)",
  specificityLabel: "Specificity (Avoidance of False Alarms)",
  ppvLabel: "Positive Predictive Value (PPV)",
  kappaLabel: "Inter-Rater Reliability (Cohen's Kappa)",
  missedUrgent: "Missed Urgent Cases: {count} of {total}",
  evaluationResultsTitle: "Evaluation Vignette Audit Table ({count})",
  evalTableVignetteId: "ID",
  evalTableScenario: "Clinical Vignette Scenario",
  evalTableGold: "Physician Gold Standard",
  evalTableEngine: "Engine Result",
  evalTableMatch: "Concordance",
  exportResults: "Export Validation Results CSV",
  loadDemoVignettesBtn: "Load Demo Vignette Dataset (20 Cases)",

  // Demo Page & Walkthrough Checklist (/demo)
  demoPageTitle: "Interactive Demo & Presentation Walkthrough",
  demoPageSubtitle: "Guided 6-step walkthrough demonstrating all core clinical, safety, and offline capabilities",
  demoModeActive: "DEMO MODE ACTIVE",
  demoModeDisabled: "Demo Mode Inactive",
  demoToggleOn: "Switch Demo Mode ON",
  demoToggleOff: "Switch Demo Mode OFF",
  demoLoadDataBtn: "Load Walkthrough Demo Data",
  demoResetBtn: "Reset Demo to Clean State",
  demoResetSuccess: "✓ Demo environment reset to clean baseline",

  demoStep1Title: "Step 1: Language Switch to Bengali",
  demoStep1Desc: "Demonstrate one-tap complete localization: header, forms, clinical terms, and speech engine seamlessly switch to Bengali without browser reloads.",
  demoStep1Btn: "Set Language to Bengali & Go to Home",

  demoStep2Title: "Step 2: Illness Check Flow (Dehydration + ACEi + Metformin)",
  demoStep2Desc: "Load patient on Cardace (ACE inhibitor) and Glycomet (Metformin) suffering from loose motions. Demonstrate deterministic 'Ask Doctor Today' flags and 'Why?' rationale.",
  demoStep2Btn: "Launch Scenario 1 in Illness Check",

  demoStep3Title: "Step 3: Red-Flag Emergency Screening (No Urine 8h)",
  demoStep3Desc: "Examine acute dehydration with anuria ('no urine for 8 hours'). Observe the instant high-priority 'GO TO HEALTH FACILITY NOW' safety override.",
  demoStep3Btn: "Launch Red-Flag Emergency Scenario",

  demoStep4Title: "Step 4: Unrecognized Brand Submission",
  demoStep4Desc: "Test an unmapped village brand ('AyurDiab-Plus'). Shows graceful manual/AI fallback, conservative safety flagging, and automatic escalation to review queue.",
  demoStep4Btn: "Launch Unknown Brand Scenario",

  demoStep5Title: "Step 5: Review Queue & Secure PIN Workflow",
  demoStep5Desc: "Access the Medical Officer review queue. Test first-time PIN establishment, PBKDF2 authentication, wrong-PIN lockout, and brand approval.",
  demoStep5Btn: "Open Review Queue with PIN",

  demoStep6Title: "Step 6: Heatwave Caseload & Evaluation Metrics",
  demoStep6Desc: "Review vulnerable patient prioritization on forecast heatwave days and examine sensitivity, specificity, and Cohen's kappa computed from 20 benchmark vignettes.",
  demoStep6Btn: "View Heat Caseload & Validation Metrics",

  // Language Audit / Language Check Page (/about/language-check)
  langCheckTitle: "Comprehensive Language Consistency Audit",
  langCheckSubtitle: "Side-by-side verification of all translation strings across Bengali, Hindi, and English",
  langCheckSearchPlaceholder: "Search translation key or phrase…",
  langCheckTotalKeys: "Total Cataloged Phrases: {count}",
  langCheckColKey: "Identifier Key",
  langCheckColEn: "English",
  langCheckColBn: "Bengali (বাংলা)",
  langCheckColHi: "Hindi (हिंदी)",
  langCheckColStatus: "Audit Status",
  langCheckStatusVerified: "Verified",
  langCheckStatusNeedsReview: "Needs Review",
  langCheckFilterAll: "Show All ({count})",
  langCheckFilterNeedsReview: "Show Needs Review ({count})",

  // About Page & Limitations
  aboutTitle: "About Aushadh Prahari & Clinical Governance",
  aboutSubtitle: "Safety guidelines, architectural boundaries, privacy safeguards, and validation limits",
  aboutSafetySection: "1. Core Clinical Safety Principles",
  aboutLimitsSection: "2. What is Explicitly NOT Validated",
  aboutPrivacySection: "3. Privacy & DPDP Act 2023 Compliance",
  aboutSourcesSection: "4. Pharmacological & Clinical Guidelines Sources",
  aboutUnvalidatedWarning: "⚠️ MANDATORY DISCLAIMER: All drug interaction rules, brand mappings, and risk weights in this demonstration build are placeholder configurations. They must be validated by licensed physicians and pharmacists before clinical deployment.",
  aboutLanguageCheckLink: "Open Full Language Consistency Checker",
  aboutDeleteAllBtn: "Delete All Local Application Records",

  // Pharmacological Drug Classes
  drugClass_ace_inhibitor: "ACE Inhibitor (e.g. Enalapril, Ramipril)",
  drugClass_arb: "ARB (e.g. Losartan, Telmisartan)",
  drugClass_diuretic_loop: "Loop Diuretic (e.g. Furosemide)",
  drugClass_diuretic_thiazide: "Thiazide Diuretic (e.g. Hydrochlorothiazide)",
  drugClass_sglt2_inhibitor: "SGLT2 Inhibitor (e.g. Dapagliflozin, Empagliflozin)",
  drugClass_metformin: "Metformin",
  drugClass_sulfonylurea: "Sulfonylurea (e.g. Glimepiride, Gliclazide)",
  drugClass_nsaid: "NSAID (e.g. Ibuprofen, Diclofenac)",
  drugClass_other: "Other / Unflagged Chronic Medicine",
  drugClass_unknown: "Unknown Class (Requires Verification)",

  // Deterministic Rule Guidance Texts
  rule_RF001: "Child patient — go to health facility now.",
  rule_RF002: "Pregnant patient with illness — go to health facility now.",
  rule_RF003: "No urine for 8+ hours — urgent dehydration danger sign, go to health facility now.",
  rule_RF004: "Severe dizziness or fainting — go to health facility now.",
  rule_RF005: "Confusion or drowsiness — go to health facility now.",
  rule_RF006: "Blood in stool — go to health facility now.",
  rule_RF007: "Chest pain or breathlessness — go to health facility now.",
  rule_RF008: "Unable to keep fluids down for over 24 hours — go to health facility now.",
  rule_SD001: "Acute illness with diarrhoea/vomiting on ACE inhibitor — consult doctor today for dose decision.",
  rule_SD002: "Acute illness with diarrhoea/vomiting on ARB — consult doctor today for dose decision.",
  rule_SD003: "Acute illness with diarrhoea/vomiting on Diuretic — consult doctor today for dose decision.",
  rule_SD004: "Acute illness with diarrhoea/vomiting on Metformin — consult doctor today for dose decision.",
  rule_SD005: "Acute illness with diarrhoea/vomiting on SGLT2 inhibitor — consult doctor today for dose decision.",
  rule_SD006: "Acute illness with fever/poor intake on Sulfonylurea — consult doctor today for dose decision.",
  rule_SD007: "Acute illness with dehydration taking NSAID — consult doctor today for dose decision.",
  rule_HW001: "Severe heatwave day for patient on Diuretic — consult doctor today regarding hydration and dosing.",
  rule_HW002: "Severe heatwave day for patient on SGLT2 inhibitor — consult doctor today regarding hydration and dosing.",
  rule_HW003: "Severe heatwave day for patient on ACE inhibitor / ARB — consult doctor today regarding hydration and dosing.",

  // Dashboard & Analytics
  dashboardSubtitle: "Analytics dashboard for CHO/ASHA health wellness center.",
  dashboardExportCSV: "Export CSV",
  syntheticDemoBanner: "⚠️ SYNTHETIC DEMO DATA — 30 synthetic checks across 3 imaginary PHC clusters",
  viewingRealData: "Viewing Real Local Data",
  viewingDemoData: "Viewing Synthetic Demo Data",
  switchToDemoData: "Switch to Demo Data",
  switchToRealData: "Switch to My Local Data",
  noLocalChecksFound: "No local check records found.",
  startFirstCheck: "Start First Check",
  totalChecks: "Total Checks",
  urgentReferrals: "Urgent Referrals",
  medicineFlags: "Doctor Decisions",
  casesByIllness: "Cases by Acute Illness",
  casesByDrugClass: "Flagged Drug Classes",
  heatwaveDayCases: "Heatwave Day Cases",
  heatwaveDayCasesDesc: "Checks completed when heat index was in danger category",
  timesFlagged: "times flagged",
  checksCount: "{count} checks",

  // About Section Detailed Labels
  aboutRuleEngineLabel: "Deterministic Rules Engine:",
  aboutAskDoctorLabel: "Ask Doctor Today:",
  aboutUrgentLabel: "Emergency Override:",
  aboutSourceOpenMeteo: "Open-Meteo Weather API",
  aboutSourceRules: "Deterministic Clinical Sick-Day Guidance Engine",
  aboutSourceDPDP: "DPDP Act 2023 Compliant Local Storage",

  // Evaluate Tab Detailed Labels
  audioTranscriptLabel: "Audio Transcript:",
  groundTruthJsonLabel: "Ground Truth JSON:",
};

export type Strings = typeof STRINGS_EN;

// ─── Bengali Strings ─────────────────────────────────────────────────────────

const STRINGS_BN: Strings = {
  // App branding
  appName: "ঔষধ প্রহরী",
  appTagline: "CHO ও ASHA-দের জন্য ওষুধ রক্ষক",
  appSubtitle: "গ্রামীণ স্বাস্থ্য সিদ্ধান্ত সহায়তা ব্যবস্থা",
  appRole: "কমিউনিটি হেলথ অফিসার ও আশা কর্মীদের জন্য",

  // Navigation
  navHome: "হোম",
  navCheck: "অসুস্থতা পরীক্ষা",
  navHeat: "তাপপ্রবাহ তালিকা",
  navPatients: "রোগীর তালিকা",
  navReview: "পর্যালোচনা সারি",
  navEvaluate: "মূল্যায়ন",
  navAbout: "সম্পর্কে",
  navDashboard: "ড্যাশবোর্ড",
  navDemo: "ডেমো ওয়াকথ্রু",

  // Disclaimer & System Banners
  safetyDisclaimer: "সিদ্ধান্ত সহায়তা সরঞ্জাম। চিকিৎসা যন্ত্র নয়। ডাক্তার ছাড়া কোনো ওষুধ পরিবর্তন করবেন না।",
  unsignedBadge: "অস্বাক্ষরিত নিয়ম — চিকিৎসক পর্যালোচনা প্রয়োজন",
  syntheticDataBanner: "⚠️ কৃত্রিম ডেমো ডেটা — বাস্তব রোগীর ডেটা নয়",
  demoModeBanner: "ডেমো মোড — সিন্থেটিক ওয়াকথ্রু ডেটা (বাস্তব স্টোর অপরিবর্তিত)",
  demoWalkthroughBadge: "ডেমো পরিস্থিতি",

  // Common UI words
  loading: "লোড হচ্ছে…",
  save: "সংরক্ষণ করুন",
  saved: "সংরক্ষিত",
  cancel: "বাতিল করুন",
  back: "পিছনে",
  next: "পরবর্তী",
  confirm: "নিশ্চিত করুন",
  edit: "সম্পাদনা",
  delete: "মুছুন",
  deleteAll: "আমার সমস্ত ডেটা মুছুন",
  deleteConfirm: "আপনি কি নিশ্চিত? এটি ফেরানো যাবে না।",
  close: "বন্ধ করুন",
  done: "সম্পন্ন",
  copy: "কপি",
  copied: "কপি হয়েছে!",
  share: "শেয়ার",
  filter: "ফিল্টার",
  search: "অনুসন্ধান",
  all: "সব",
  actions: "পদক্ষেপ",
  status: "অবস্থা",
  date: "তারিখ",
  time: "সময়",
  total: "মোট",
  notes: "নোট",
  yes: "হ্যাঁ",
  no: "না",
  unknown: "অজানা",
  notSure: "নিশ্চিত নই",
  none: "কোনোটি নয়",
  goBack: "ফিরে যান",
  selectLanguage: "ভাষা নির্বাচন করুন",

  // Connectivity & Sync
  online: "অনলাইন",
  offline: "অফলাইন",
  offlineMode: "অফলাইন মোড — AI ফিচারের জন্য ইন্টারনেট সংযোগ প্রয়োজন।",
  syncPending: "সিঙ্ক বাকি",
  syncNow: "এখন সিঙ্ক করুন",
  syncUpToDate: "✓ সবকিছু আপ টু ডেট",
  syncSuccess: "✓ সিঙ্ক সফলভাবে সম্পন্ন হয়েছে",
  syncFailed: "✗ সিঙ্ক ব্যর্থ — অনুগ্রহ করে পুনরায় চেষ্টা করুন",
  syncOffline: "✗ অফলাইন — সংযোগ এলে স্বয়ংক্রিয় চেষ্টা হবে",
  aiUnavailable: "AI উপলব্ধ নয় — অনুগ্রহ করে ম্যানুয়ালি লিখুন।",
  aiManualFallback: "AI সহায়ক অফলাইন। আপনি ম্যানুয়াল এন্ট্রি দিয়ে কাজ চালাতে পারেন।",
  noVoice: "এই ডিভাইসে এই ভাষার জন্য কোনো কণ্ঠস্বর পাওয়া যায়নি।",

  // Home Page
  homeNewCheck: "নতুন অসুস্থতা পরীক্ষা",
  homeNewCheckSubtitle: "তীব্র অসুস্থ রোগীর ওষুধের নিরাপত্তা পরীক্ষা করুন",
  homeHeatwave: "তাপপ্রবাহ রোগী তালিকা",
  homeHeatwaveSubtitle: "তীব্র গরমের দিনে ঝুঁকিপূর্ণ রোগীদের অগ্রাধিকার দিন",
  homePatients: "আমার রোগীর তালিকা",
  homePatientsSubtitle: "গ্রামের রোগীদের দেখুন, খুঁজুন বা নতুন রোগী যুক্ত করুন",
  homeReview: "ফার্মাসিস্ট / চিকিৎসক পর্যালোচনা",
  homeReviewSubtitle: "ওষুধের ব্র্যান্ড ও নিয়মের সুপারিশ অনুমোদন করুন",
  homeDashboard: "পরিসংখ্যান ও মেট্রিক্স",
  homeDashboardSubtitle: "কেসলোড পরিসংখ্যান ও ক্লিনিকাল কার্যকলাপ দেখুন",
  homeAbout: "সম্পর্কে ও সুরক্ষা তথ্য",
  homeAboutSubtitle: "সীমাবদ্ধতা, গোপনীয়তা নোটিশ এবং পদ্ধতি",
  homeDemo: "ইন্টারেক্টিভ ডেমো ওয়াকথ্রু",
  homeDemoSubtitle: "কৃত্রিম কেস সহ ৬-ধাপের নির্দেশিত উপস্থাপনা সফর",
  homeStatsTotalChecks: "মোট চেক",
  homeStatsPendingSync: "সিঙ্ক বাকি",
  homeStatsSyncNow: "সিঙ্ক করুন",

  // Settings
  settingsTitle: "⚙️ সেটিংস ও ডিভাইস কনফিগারেশন",
  settingsFontScale: "টেক্সট প্রদর্শনের আকার",
  settingsMOPhone: "মেডিকেল অফিসার (MO) ফোন নম্বর",
  settingsMOPhonePlaceholder: "+৯১ ৯৮৭৬৫ ৪৩২১০",
  settingsMOPhoneHelp: "তাৎক্ষণিক কেস জানানোর জন্য SMS ও WhatsApp লিঙ্ক আগে থেকে প্রস্তুত রাখে",
  settingsDeleteData: "বিপদ অঞ্চল: ডিভাইসের স্থানীয় সমস্ত ডেটা মুছুন",
  settingsIndicNumerals: "বাংলা সংখ্যা ব্যবহার করুন (১২৩৪৫)",

  // First-time Consent Modal
  consentTitle: "ঔষধ প্রহরীতে স্বাগতম",
  consentBody: "এই অ্যাপ্লিকেশনটি রোগীর চেক সংক্রান্ত ডেটা শুধুমাত্র এই স্থানীয় ডিভাইসে সংরক্ষণ করে। কোনো নাম বা ফোন নম্বর প্রয়োজন নেই। DPDP আইন ২০২৩ অনুযায়ী আপনি যেকোনো সময় সেটিংস থেকে সমস্ত ডেটা মুছে ফেলতে পারবেন।",
  consentAlert: "সিদ্ধান্ত সহায়তা সরঞ্জাম। চিকিৎসা যন্ত্র নয়। ডাক্তার ছাড়া কোনো ওষুধ পরিবর্তন করবেন না।",
  consentAccept: "আমি বুঝেছি ও সম্মত — চালিয়ে যান ✓",
  consentDecline: "কোনো ডেটা সংরক্ষণ করবেন না (ক্ষণস্থায়ী মোড)",

  // Patient Registration & Profile
  patientToken: "রোগী টোকেন",
  patientSelectExisting: "অথবা নিবন্ধিত রোগীদের মধ্য থেকে বেছে নিন:",
  patientCreateNew: "নতুন বেনামী টোকেন তৈরি করুন",
  patientTokenPlaceholder: "যেমন P-8492 অথবা জেনারেট চাপুন",
  patientAgeBand: "বয়সের দল",
  ageBandChild: "শিশু (১৮ বছরের নিচে)",
  ageBandAdult: "প্রাপ্তবয়স্ক (১৮–৬০ বছর)",
  ageBandElderly: "বৃদ্ধ (৬০ বছরের বেশি)",
  patientPregnant: "বর্তমানে গর্ভবতী?",
  patientKidneyDisease: "দীর্ঘস্থায়ী কিডনি রোগ আছে?",
  patientKnownKidney: "কিডনি রোগ (CKD)",
  patientLivesAlone: "পরিবার ছাড়া একা বাস করেন?",
  patientWorksOutdoors: "রোদে বাইরে কাজ করেন?",
  patientCreatinine: "সর্বশেষ ক্রিয়েটিনিন (mg/dL)",
  patientCreatinineHelp: "ঐচ্ছিক: বিগত ৩ মাসে মাপা মান",
  patientEGFR: "সর্বশেষ eGFR (mL/min/1.73m²)",
  patientEGFRHelp: "ঐচ্ছিক: আনুমানিক গ্লোমেরুলার পরিস্রাবণ হার",
  patientMedicines: "দীর্ঘস্থায়ী প্রেসক্রিপশনের ওষুধ",
  patientChronicMeds: "নিয়মিত খাওয়ার ওষুধ",
  patientFilterAll: "সকল রোগী",
  patientFilterElderly: "বয়স্ক রোগী (>৬০)",
  patientFilterKidney: "কিডনি রোগী",
  patientFilterOutdoor: "বাইরে কর্মী",
  patientAddTitle: "নতুন রোগী নথিভুক্ত করুন",
  patientListEmpty: "এখনো কোনো রোগী নথিভুক্ত করা হয়নি। শুরু করতে 'নতুন রোগী নথিভুক্ত করুন' চাপুন।",
  patientDetailTitle: "রোগীর প্রোফাইল ও অসুস্থতার ইতিহাস",
  patientHistory: "অতীতের অসুস্থতা পরীক্ষা",

  // Symptoms & Acute Illness Assessment
  step1Title: "ধাপ ১: রোগীর প্রোফাইল",
  step1Subtitle: "ঝুঁকির প্রাথমিক সূচক নিশ্চিত করুন",
  step2Title: "ধাপ ২: তীব্র লক্ষণ",
  step2Subtitle: "লক্ষণ নির্বাচন করুন বা মুখে বলুন",
  step3Title: "ধাপ ৩: ওষুধপত্র",
  step3Subtitle: "ব্র্যান্ডের নাম খুঁজুন বা ক্লাস বেছে নিন",
  step4Title: "ধাপ ৪: ক্লিনিকাল নির্দেশিকা",
  step4Subtitle: "সতর্কতা পর্যালোচনা করুন ও ডাক্তারকে বার্তা পাঠান",

  stepSymptomsPrompt: "রোগীর আজ কী কী লক্ষণ দেখা যাচ্ছে?",
  stepSymptomsMicPrompt: "নিজের ভাষায় লক্ষণ বলুন (ভয়েস)",
  stepSymptomsListening: "শুনছি… এখন বাংলা, হিন্দি বা ইংরেজিতে বলুন",
  stepSymptomsStopListening: "রেকর্ডিং থামান",
  stepSymptomsParseSuccess: "✓ ভয়েস শনাক্ত হয়েছে এবং লক্ষণ বের করা হয়েছে",
  stepSymptomsParseFailed: "ভয়েস বুঝতে পারা যায়নি। অনুগ্রহ করে হাত দিয়ে বেছে নিন।",
  durationQuestion: "রোগীর কত দিন ধরে এই লক্ষণগুলি আছে?",
  durationDaysLabel: "সময়কাল (দিন)",
  ableToDrink: "রোগী কি তরল পান করতে ও পেটে রাখতে পারছেন?",
  urineQuestion: "গত ৮ ঘণ্টায় রোগীর প্রস্রাব হয়েছে কি?",
  dizzinessQuestion: "রোগীর কি অতিরিক্ত মাথা ঘোরা বা জ্ঞান হারানোর ভাব আছে?",
  confusionQuestion: "বিভ্রান্তি, তন্দ্রাচ্ছন্নতা বা আচরণে কোনো পরিবর্তন আছে?",
  bloodInStool: "পায়খানার সাথে কোনো রক্ত বা কালো মল দেখা গেছে?",
  chestPain: "বুকে ব্যথা বা শ্বাসকষ্ট হচ্ছে কি?",
  cannotKeepFluids: "এক দিনের বেশি সময় ধরে কোনো তরল পেটে রাখতে পারছেন না?",

  symptomLooseMotions: "পাতলা পায়খানা / ডায়রিয়া",
  symptomVomiting: "বমি",
  symptomFever: "জ্বর",
  symptomNotEating: "খাচ্ছেন না বা পানি পান করছেন না",
  symptomHotWeather: "অত্যন্ত গরম আবহাওয়া",
  symptomNone: "এর কোনো তীব্র লক্ষণ নেই",

  // Medicine Selection & Brand Search
  stepMedicinesPrompt: "রোগী নিয়মিত কোন কোন ওষুধ খান?",
  searchMedicinePlaceholder: "ওষুধের ব্র্যান্ড লিখুন (যেমন Glycomet, Cardace, Lasix)…",
  searchResultsCount: "{count}টি মিল পাওয়া ব্র্যান্ড:",
  noMedicineFound: "ডাটাবেসে কোনো ব্র্যান্ডের মিল পাওয়া যায়নি।",
  brandStatusVerified: "যাচাই করা হয়েছে",
  brandStatusUnsigned: "অস্বাক্ষরিত প্লেসহোল্ডার",
  brandStatusUnknown: "অজানা ব্র্যান্ড",
  brandStatusPendingReview: "পর্যালোচনা মুলতুবি",
  selectedMedicinesTitle: "মূল্যায়নের জন্য নির্বাচিত ওষুধ ({count})",
  selectedMedicinesEmpty: "এখনো কোনো ওষুধ নির্বাচন করা হয়নি। যোগ করতে উপরে খুঁজুন।",
  removeMedicine: "মুছে দিন",

  customBrandTitle: "ওষুধ তালিকায় নেই? কাস্টম ওষুধ যোগ করুন",
  customBrandPlaceholder: "ব্র্যান্ড বা বাণিজ্যিক নাম লিখুন…",
  customClassLabel: "ওষুধের ফার্মাকোলজিক্যাল ক্লাস নির্বাচন করুন:",
  askAISuggest: "AI-কে ড্রাগ ক্লাস সাজেস্ট করতে বলুন",
  askAILoading: "AI দিয়ে ওষুধের উপাদান বিশ্লেষণ করা হচ্ছে…",
  addManualClass: "ম্যানুয়ালি ক্লাস নির্ধারণ করুন",
  submitToReview: "অজানা ব্র্যান্ডটি মেডিকেল অফিসারের পর্যালোচনা সারিতে পাঠান",

  // Clinical Result Screen
  resultUrgentBanner: "🚨 এখনই স্বাস্থ্যকেন্দ্রে যান",
  resultAskDoctorBanner: "⚠️ আজই ডাক্তারকে জিজ্ঞেস করুন",
  resultNoFlag: "✓ এখন কোনো ওষুধ সতর্কতা নেই",
  resultInfoBanner: "ℹ️ ক্লিনিকাল তথ্য সংক্রান্ত নোট",

  resultUrgentDesc: "রোগীর জরুরি বিপজ্জনক লক্ষণ দেখা যাচ্ছে যার জন্য অবিলম্বে চিকিৎসা মূল্যায়ন প্রয়োজন। দেরি করবেন না।",
  resultAskDoctorDesc: "তীব্র পানিশূন্যতা বা অসুস্থতার কারণে এক বা একাধিক দীর্ঘস্থায়ী ওষুধের ব্যাপারে আজই ডাক্তারের সিদ্ধান্ত প্রয়োজন।",
  resultNoFlagDesc: "বর্তমান লক্ষণ অনুযায়ী রোগীর কোনো নিয়মিত ওষুধ বন্ধ বা পরিবর্তন করার প্রয়োজন নেই।",

  flaggedMedicinesTitle: "যেসব ওষুধের ব্যাপারে আজই ডাক্তারের সিদ্ধান্ত দরকার ({count})",
  unflaggedMedicinesTitle: "যেসব ওষুধে জরুরি কোনো পতাকা নেই ({count})",
  whyToggle: "এই পরামর্শ কেন? (ক্লিনিকাল যুক্তি)",
  whyTitle: "নিয়ম প্রয়োগের কারণ ও যুক্তি",
  whyClose: "যুক্তি প্যানেল বন্ধ করুন",

  ruleId: "নিয়ম আইডি",
  ruleText: "ক্লিনিকাল নির্দেশিকা নিয়ম",
  ruleStatus: "অনুমোদনের অবস্থা",
  ruleSource: "ক্লিনিকাল প্রমাণের উৎস",

  // Medical Officer Message & Sharing
  moMessageTitle: "মেডিকেল অফিসারের (MO) জন্য সংক্ষিপ্ত বার্তা",
  moMessageCount: "অক্ষর সংখ্যা: {count} / সর্বোচ্চ ৩০০",
  copyMessage: "বার্তা কপি করুন",
  messageCopied: "✓ ক্লিপবোর্ডে কপি হয়েছে!",
  shareViaSMS: "SMS দিয়ে পাঠান",
  shareViaWhatsApp: "WhatsApp দিয়ে পাঠান",

  homeCareTitle: "বাড়িতে সহায়ক যত্নের পরামর্শ",
  homeCareReminder: "ঘন ঘন খাবার স্যালাইন (ORS) বা ডাবের পানি পান করতে দিন। প্রস্রাবের দিকে খেয়াল রাখুন। বমি বন্ধ না হলে বা প্রস্রাব বন্ধ হলে দ্রুত হাসপাতালে নিন।",
  saveCheckRecord: "রোগীর রেকর্ডে চেক সংরক্ষণ করুন",
  checkSavedSuccess: "✓ রোগীর চেক স্থানীয় ডিভাইসে সফলভাবে সংরক্ষিত হয়েছে",

  // Heatwave Screen
  heatPageTitle: "তাপপ্রবাহ রোগী ঝুঁকি র‍্যাংকিং",
  heatPageSubtitle: "তাপমাত্রা ও ওষুধের ঝুঁকির ভিত্তিতে এলাকার রোগীদের অগ্রাধিকার তালিকা",
  heatIndex: "বর্তমান তাপ সূচক (Heat Index)",
  heatDay: "তাপ দিন সতর্কতা — সক্রিয় যোগাযোগ ও পরামর্শ দিন",
  notHeatDay: "স্বাভাবিক তাপমাত্রা — নিয়মিত পর্যবেক্ষণ",
  heatThresholdNote: "সীমা: তাপ সূচক ৪১°C বা তার বেশি হলে ঝুঁকিপূর্ণ রোগীদের অগ্রাধিকার যোগাযোগ প্রয়োজন।",
  heatForecast: "৩-দিনের আবহাওয়ার পূর্বাভাস",
  heatForecastToday: "আজ",
  heatForecastTomorrow: "আগামীকাল",
  heatForecastDayAfter: "পরশু",
  heatManualEntryTitle: "ম্যানুয়াল তাপমাত্রা ও আর্দ্রতা এন্ট্রি",
  heatManualTempLabel: "পরিবেশের তাপমাত্রা (°C)",
  heatManualHumidityLabel: "আপেক্ষিক আর্দ্রতা (%)",
  heatManualComputeBtn: "তাপ সূচক হিসাব করুন",
  heatCaseloadTitle: "র‍্যাংক করা রোগীর তালিকা ({count})",
  heatCaseloadEmpty: "কোনো নথিভুক্ত রোগী নেই। তাপের ঝুঁকি দেখতে রোগী যুক্ত করুন।",
  heatRank: "র‍্যাংক #{rank}",
  riskScore: "ঝুঁকি স্কোর: {score} পয়েন্ট",
  whyThisRank: "এই র‍্যাংক কেন দেওয়া হলো?",
  contactStatus: "যোগাযোগের অবস্থা",
  contactStatusNone: "আজ যোগাযোগ করা হয়নি",
  called: "যোগাযোগ হয়েছে / পরামর্শ দেওয়া হয়েছে",
  notReached: "ফোন বাজেনি / উপস্থিত নেই",
  markCalled: "যোগাযোগ সম্পন্ন হিসেবে চিহ্নিত করুন",
  markNotReached: "যোগাযোগ হয়নি হিসেবে চিহ্নিত করুন",
  heatOutdoorRisk: "সরাসরি রোদে বাইরে কাজ করেন (+৩ পয়েন্ট)",
  heatElderlyRisk: "৬০ বছরের বেশি বয়স্ক ব্যক্তি (+২ পয়েন্ট)",
  heatDiureticRisk: "ডাইইউরেটিক বা SGLT2 ইনহিবিটার ওষুধ খান (+৪ পয়েন্ট)",
  heatLivingAloneRisk: "পরিচর্যাকারী ছাড়া একা বাস করেন (+২ পয়েন্ট)",

  // PIN Authentication & Review Screen
  reviewPageTitle: "মেডিকেল অফিসার / ফার্মাসিস্ট পর্যালোচনা সারি",
  reviewPageSubtitle: "মুলতুবি ওষুধের ক্লাস যাচাই করুন, নিয়ম অনুমোদন করুন ও অডিট লগ রপ্তানি করুন",
  pinTitleSetup: "পর্যালোচক নিরাপত্তা PIN তৈরি করুন",
  pinDescSetup: "এই ডিভাইসে ক্লিনিকাল পর্যালোচনা সুরক্ষিত রাখতে একটি ৪ থেকে ৬ সংখ্যার PIN সেট করুন।",
  pinInputSetup: "নতুন ৪-৬ সংখ্যার PIN লিখুন",
  pinConfirmSetup: "নতুন PIN নিশ্চিত করুন",
  pinBtnSet: "PIN সেট করুন ও সারি খুলুন",
  pinTitleLogin: "পর্যালোচক PIN যাচাইকরণ",
  pinDescLogin: "ক্লিনিকাল গভর্নেন্স ফিচার আনলক করতে আপনার পর্যালোচক PIN লিখুন।",
  pinInputLogin: "PIN লিখুন",
  pinBtnLogin: "সারি আনলক করুন",
  pinErrorWrong: "ভুল PIN দেওয়া হয়েছে।",
  pinAttemptsRemaining: "সাময়িক লক হওয়ার আগে আর {remaining} বার চেষ্টা করতে পারবেন।",
  pinLockedOut: "বারবার ভুল PIN দেওয়ার কারণে অ্যাকাউন্ট সাময়িকভাবে লক করা হয়েছে।",
  pinLockedOutWait: "পুনরায় চেষ্টা করার আগে অনুগ্রহ করে {seconds} সেকেন্ড অপেক্ষা করুন।",
  pinTitleChange: "নিরাপত্তা PIN পরিবর্তন করুন",
  pinOldInput: "বর্তমান PIN",
  pinNewInput: "নতুন ৪-৬ সংখ্যার PIN",
  pinBtnChange: "PIN আপডেট করুন",
  pinChangeSuccess: "✓ নিরাপত্তা PIN সফলভাবে আপডেট করা হয়েছে",
  pinBtnLogout: "লক ও লগআউট",
  pinAutoLockNotice: "গোপনীয়তা রক্ষার্থে ৫ মিনিট নিষ্ক্রিয় থাকলে সেশনটি স্বয়ংক্রিয় লক হয়ে যায়।",

  reviewTabBrands: "মুলতুবি ব্র্যান্ড সাজেশন ({count})",
  reviewTabRules: "ক্লিনিকাল নিয়ম অনুমোদন ({count})",
  reviewPendingBrands: "ফার্মাসিস্টের শ্রেণিবিন্যাসের অপেক্ষায় থাকা অজানা ব্র্যান্ড",
  reviewUnsignedRules: "চিকিৎসকের অনুমোদনের অপেক্ষায় থাকা ক্লিনিকাল নিয়মসমূহ",
  reviewNoPendingBrands: "✓ পর্যালোচনা সারিতে কোনো মুলতুবি ব্র্যান্ড নেই।",
  reviewNoUnsignedRules: "সকল ক্লিনিকাল নিয়ম পর্যালোচনা ও অনুমোদন করা হয়েছে।",
  reviewApprove: "শ্রেণিবিন্যাস অনুমোদন করুন",
  reviewEdit: "ক্লাস পরিবর্তন করুন",
  reviewReject: "প্রত্যাখ্যান / বাতিল",
  reviewSave: "সিদ্ধান্ত সংরক্ষণ করুন",
  reviewerNameLabel: "পর্যালোচকের পুরো নাম ও পদবি",
  reviewerRegLabel: "মেডিকেল / ফার্মেসি রেজিস্ট্রেশন নম্বর",
  reviewerProfileSave: "পর্যালোচকের পরিচয় আপডেট করুন",
  reviewedByPrefix: "পর্যালোচনা করেছেন: {name}",
  reviewedAtPrefix: "পর্যালোচনার তারিখ: {date}",
  exportJSON: "অডিট করা JSON রপ্তানি",
  exportCSV: "অডিট করা CSV রপ্তানি",
  importCSV: "অনুমোদিত CSV আমদানি",
  importSuccess: "✓ সফলভাবে {count}টি ব্র্যান্ড রেকর্ড আমদানি ও সমন্বয় করা হয়েছে",
  importError: "✗ আমদানিকৃত CSV ফাইল পড়তে ব্যর্থ হয়েছে। ফাইল কাঠামো পরীক্ষা করুন।",
  ruleSignOffBtn: "স্বাক্ষর ও অনুমোদন করুন",
  ruleSignedOffBadge: "✓ চিকিৎসক দ্বারা অনুমোদিত",
  ruleUnsignedBadge: "⚠️ অস্বাক্ষরিত নিয়ম (প্লেসহোল্ডার)",

  // Evaluation Screen
  evaluatePageTitle: "ক্লিনিকাল মূল্যায়ন ও ভ্যালিডেশন হার্নেস",
  evaluatePageSubtitle: "চিকিৎসকের মানদণ্ডের সাথে নিয়ম ইঞ্জিন ও AI বিশ্লেষণের নির্ভুলতা যাচাই",
  importVignettes: "ভিনেট বেঞ্চমার্ক CSV আমদানি",
  runEvaluation: "মূল্যায়ন পাইপলাইন চালান",
  noDataYet: "কোনো মূল্যায়নের ডেটা এখনো লোড করা হয়নি। বেঞ্চমার্ক চালাতে 'ডেমো ওয়াকথ্রু ডেটা লোড করুন' চাপুন বা CSV ফাইল আনুন।",
  demoVignettesComputed: "কৃত্রিম ডেমো ভিনেট থেকে গণনাকৃত (২০টি ক্লিনিকাল কেস, ৩ জন চিকিৎসক)",
  sensitivityLabel: "সংবেদনশীলতা (জরুরি কেস শনাক্তের ক্ষমতা)",
  specificityLabel: "নির্দিষ্টতা (অহেতুক মিথ্যা সতর্কতা এড়ানোর ক্ষমতা)",
  ppvLabel: "পজিটিভ প্রেডিক্টিভ ভ্যালু (PPV)",
  kappaLabel: "পর্যালোচকদের মধ্যে সামঞ্জস্য (কোহেন কাপ্পা)",
  missedUrgent: "মিস হওয়া জরুরি কেস: {total}টির মধ্যে {count}টি",
  evaluationResultsTitle: "মূল্যায়ন ভিনেট অডিট সারণী ({count})",
  evalTableVignetteId: "আইডি",
  evalTableScenario: "ক্লিনিকাল ভিনেট দৃশ্যপট",
  evalTableGold: "চিকিৎসকের মানদণ্ড",
  evalTableEngine: "ইঞ্জিনের ফলাফল",
  evalTableMatch: "সামঞ্জস্য",
  exportResults: "মূল্যায়ন ফলাফল CSV রপ্তানি",
  loadDemoVignettesBtn: "ডেমো ভিনেট ডেটাসেট লোড করুন (২০ কেস)",

  // Demo Page & Walkthrough Checklist (/demo)
  demoPageTitle: "ইন্টারেক্টিভ ডেমো ও উপস্থাপনা ওয়াকথ্রু",
  demoPageSubtitle: "সকল মূল ক্লিনিকাল, সুরক্ষা ও অফলাইন সক্ষমতা প্রদর্শনের জন্য ৬-ধাপের নির্দেশিকা",
  demoModeActive: "ডেমো মোড সক্রিয়",
  demoModeDisabled: "ডেমো মোড নিষ্ক্রিয়",
  demoToggleOn: "ডেমো মোড চালু করুন",
  demoToggleOff: "ডেমো মোড বন্ধ করুন",
  demoLoadDataBtn: "ওয়াকথ্রু ডেমো ডেটা লোড করুন",
  demoResetBtn: "ডেমো রিসেট করে পরিষ্কার অবস্থায় ফিরুন",
  demoResetSuccess: "✓ ডেমো পরিবেশ রিসেট করে স্বাভাবিক অবস্থায় আনা হয়েছে",

  demoStep1Title: "ধাপ ১: বাংলায় ভাষা পরিবর্তন",
  demoStep1Desc: "এক ট্যাপে সম্পূর্ণ রূপান্তর প্রদর্শন: হেডার, ফর্ম, ক্লিনিকাল পদ এবং ভয়েস ইঞ্জিন কোনো রিলোড ছাড়াই নির্বিঘ্নে বাংলায় চলে আসে।",
  demoStep1Btn: "বাংলা নির্বাচন করুন ও হোমে যান",

  demoStep2Title: "ধাপ ২: অসুস্থতা পরীক্ষা (পানিশূন্যতা + ACEi + মেটফর্মিন)",
  demoStep2Desc: "Cardace (ACE inhibitor) এবং Glycomet (Metformin) খাওয়া ডায়রিয়ায় আক্রান্ত রোগী লোড করুন। 'আজই ডাক্তারকে জিজ্ঞেস করুন' এবং 'কেন?' ব্যাখ্যা দেখুন।",
  demoStep2Btn: "অসুস্থতা পরীক্ষায় পরিস্থিতি ১ শুরু করুন",

  demoStep3Title: "ধাপ ৩: বিপজ্জনক জরুরি অবস্থা (৮ ঘণ্টা প্রস্রাব নেই)",
  demoStep3Desc: "৮ ঘণ্টার বেশি প্রস্রাব না হওয়ার মারাত্মক পানিশূন্যতা পরীক্ষা করুন। তাৎক্ষণিক লাল সতর্কতা '🚨 এখনই স্বাস্থ্যকেন্দ্রে যান' প্রদর্শন লক্ষ্য করুন।",
  demoStep3Btn: "বিপজ্জনক জরুরি পরিস্থিতি শুরু করুন",

  demoStep4Title: "ধাপ ৪: অজানা ওষুধের ব্র্যান্ড এন্ট্রি",
  demoStep4Desc: "তালিকাবহির্ভূত গ্রামীণ ব্র্যান্ড ('AyurDiab-Plus') পরীক্ষা করুন। নিরাপদ ম্যানুয়াল ফলব্যাক ও স্বয়ংক্রিয়ভাবে ডাক্তারের রিভিউ সারিতে পাঠানো দেখুন।",
  demoStep4Btn: "অজানা ব্র্যান্ড পরিস্থিতি শুরু করুন",

  demoStep5Title: "ধাপ ৫: রিভিউ সারি ও নিরাপদ PIN প্রক্রিয়া",
  demoStep5Desc: "মেডিকেল অফিসারের রিভিউ সারিতে প্রবেশ করুন। প্রথমবারের PIN সেট, PBKDF2 নিরাপত্তা, ভুল PIN লকআউট এবং ব্র্যান্ড অনুমোদন দেখুন।",
  demoStep5Btn: "PIN দিয়ে রিভিউ সারি খুলুন",

  demoStep6Title: "ধাপ ৬: তাপপ্রবাহ তালিকা ও মূল্যায়ন মেট্রিক্স",
  demoStep6Desc: "তীব্র গরমের দিনে ঝুঁকিপূর্ণ রোগীর অগ্রাধিকার দেখুন এবং ২০টি ক্লিনিকাল টেস্ট কেসের ভিত্তিতে তৈরি সংবেদনশীলতা, নির্দিষ্টতা ও কোহেন কাপ্পা যাচাই করুন।",
  demoStep6Btn: "তাপ তালিকা ও মূল্যায়ন মেট্রিক্স দেখুন",

  // Language Audit / Language Check Page (/about/language-check)
  langCheckTitle: "ভাষা সঙ্গতি ও নির্ভুলতা অডিট",
  langCheckSubtitle: "বাংলা, হিন্দি এবং ইংরেজি অনুবাদের পাশাপাশি পূর্ণাঙ্গ যাচাইকরণ তালিকা",
  langCheckSearchPlaceholder: "অনুবাদ কীওয়ার্ড বা বাক্য খুঁজুন…",
  langCheckTotalKeys: "মোট ক্যাটালগকৃত বাক্যাংশ: {count}",
  langCheckColKey: "শনাক্তকারী কী",
  langCheckColEn: "ইংরেজি (English)",
  langCheckColBn: "বাংলা",
  langCheckColHi: "হিন্দি",
  langCheckColStatus: "অডিট অবস্থা",
  langCheckStatusVerified: "যাচাইকৃত",
  langCheckStatusNeedsReview: "পর্যালোচনা দরকার",
  langCheckFilterAll: "সকল বাক্যাংশ ({count})",
  langCheckFilterNeedsReview: "পর্যালোচনা দরকার এমন ({count})",

  // About Page & Limitations
  aboutTitle: "ঔষধ প্রহরী সম্পর্কে ও ক্লিনিকাল পরিচালনা",
  aboutSubtitle: "সুরক্ষা নির্দেশিকা, কাঠামোগত সীমানা, গোপনীয়তা সুরক্ষা ও ভ্যালিডেশনের সীমাবদ্ধতা",
  aboutSafetySection: "১. মূল ক্লিনিকাল সুরক্ষা নীতি",
  aboutLimitsSection: "২. যে বিষয়গুলি স্পষ্টভাবে অপ্রমাণিত",
  aboutPrivacySection: "৩. গোপনীয়তা ও DPDP আইন ২০২৩ পরিপালন",
  aboutSourcesSection: "৪. ফার্মাকোলজিক্যাল ও ক্লিনিকাল নির্দেশিকার উৎস",
  aboutUnvalidatedWarning: "⚠️ আবশ্যিক সতর্কতা: এই ডেমো অ্যাপ্লিকেশনের সকল ওষুধের নিয়ম, ব্র্যান্ডের তালিকা এবং ঝুঁকির মান প্লেসহোল্ডার হিসেবে রাখা হয়েছে। বাস্তব চিকিৎসা সেবায় ব্যবহারের আগে অনুমোদিত চিকিৎসক ও ফার্মাসিস্ট দ্বারা এগুলো যাচাই করতে হবে।",
  aboutLanguageCheckLink: "সম্পূর্ণ ভাষা নিরীক্ষণ পৃষ্ঠা খুলুন",
  aboutDeleteAllBtn: "ডিভাইসের সমস্ত স্থানীয় রেকর্ড মুছে ফেলুন",

  // Pharmacological Drug Classes
  drugClass_ace_inhibitor: "ACE ইনহিবিটার (যেমন Enalapril, Ramipril)",
  drugClass_arb: "ARB (যেমন Losartan, Telmisartan)",
  drugClass_diuretic_loop: "লুপ ডাইইউরেটিক (যেমন Furosemide)",
  drugClass_diuretic_thiazide: "থায়াজাইড ডাইইউরেটিক (যেমন Hydrochlorothiazide)",
  drugClass_sglt2_inhibitor: "SGLT2 ইনহিবিটার (যেমন Dapagliflozin, Empagliflozin)",
  drugClass_metformin: "মেটফর্মিন",
  drugClass_sulfonylurea: "সালফোনাইলইউরিয়া (যেমন Glimepiride, Gliclazide)",
  drugClass_nsaid: "NSAID ব্যথানাশক (যেমন Ibuprofen, Diclofenac)",
  drugClass_other: "অন্যান্য / সতর্কতাবিহীন নিয়মিত ওষুধ",
  drugClass_unknown: "অজানা ক্লাস (যাচাই প্রয়োজন)",

  // Deterministic Rule Guidance Texts
  rule_RF001: "শিশু রোগী — এখনই স্বাস্থ্যকেন্দ্রে যান।",
  rule_RF002: "গর্ভবতী রোগী, অসুস্থতা — এখনই স্বাস্থ্যকেন্দ্রে যান।",
  rule_RF003: "৮ ঘণ্টার বেশি সময় ধরে প্রস্রাব বন্ধ — তীব্র পানিশূন্যতার লক্ষণ, এখনই স্বাস্থ্যকেন্দ্রে যান।",
  rule_RF004: "মারাত্মক মাথা ঘোরা বা জ্ঞান হারানোর ভাব — এখনই স্বাস্থ্যকেন্দ্রে যান।",
  rule_RF005: "বিভ্রান্তি বা তন্দ্রাচ্ছন্নতা — এখনই স্বাস্থ্যকেন্দ্রে যান।",
  rule_RF006: "মলের সাথে রক্ত — এখনই স্বাস্থ্যকেন্দ্রে যান।",
  rule_RF007: "বুকে ব্যথা বা শ্বাসকষ্ট — এখনই স্বাস্থ্যকেন্দ্রে যান।",
  rule_RF008: "২৪ ঘণ্টার বেশি সময় কোনো তরল পেটে থাকছে না — এখনই স্বাস্থ্যকেন্দ্রে যান।",
  rule_SD001: "ডায়রিয়া/বমিতে আক্রান্ত রোগী ACE ইনহিবিটার খাচ্ছেন — আজই ডাক্তারের সাথে ডোজের সিদ্ধান্ত নিন।",
  rule_SD002: "ডায়রিয়া/বমিতে আক্রান্ত রোগী ARB খাচ্ছেন — আজই ডাক্তারের সাথে ডোজের সিদ্ধান্ত নিন।",
  rule_SD003: "ডায়রিয়া/বমিতে আক্রান্ত রোগী ডাইইউরেটিক খাচ্ছেন — আজই ডাক্তারের সাথে ডোজের সিদ্ধান্ত নিন।",
  rule_SD004: "ডায়রিয়া/বমিতে আক্রান্ত রোগী মেটফর্মিন খাচ্ছেন — আজই ডাক্তারের সাথে ডোজের সিদ্ধান্ত নিন।",
  rule_SD005: "ডায়রিয়া/বমিতে আক্রান্ত রোগী SGLT2 ইনহিবিটার খাচ্ছেন — আজই ডাক্তারের সাথে ডোজের সিদ্ধান্ত নিন।",
  rule_SD006: "জ্বর বা খেতে না পারা রোগী সালফোনাইলইউরিয়া খাচ্ছেন — আজই ডাক্তারের সাথে ডোজের সিদ্ধান্ত নিন।",
  rule_SD007: "পানিশূন্যতায় আক্রান্ত রোগী NSAID খাচ্ছেন — আজই ডাক্তারের সাথে ডোজের সিদ্ধান্ত নিন।",
  rule_HW001: "তীব্র তাপপ্রবাহে ডাইইউরেটিক গ্রহণকারী রোগী — পানিপান ও ওষুধ সম্পর্কে আজই ডাক্তারের পরামর্শ নিন।",
  rule_HW002: "তীব্র তাপপ্রবাহে SGLT2 ইনহিবিটার গ্রহণকারী রোগী — পানিপান ও ওষুধ সম্পর্কে আজই ডাক্তারের পরামর্শ নিন।",
  rule_HW003: "তীব্র তাপপ্রবাহে ACE ইনহিবিটার / ARB গ্রহণকারী রোগী — পানিপান ও ওষুধ সম্পর্কে আজই ডাক্তারের পরামর্শ নিন।",

  // Dashboard & Analytics
  dashboardSubtitle: "সিএইচও/আশা স্বাস্থ্য কেন্দ্রের চেক ডেটা ড্যাশবোর্ড (Analytics)।",
  dashboardExportCSV: "CSV এক্সপোর্ট",
  syntheticDemoBanner: "⚠️ SYNTHETIC DEMO DATA — ৩টি কাল্পনিক PHC এলাকার ৩০টি কৃত্রিম চেক ডেটা",
  viewingRealData: "প্রকৃত স্থানীয় ডেটা দেখা হচ্ছে",
  viewingDemoData: "নমুনা ডেমো ডেটা দেখা হচ্ছে",
  switchToDemoData: "🔄 ডেমো ডেটায় পরিবর্তন করুন",
  switchToRealData: "📱 আমার স্থানীয় ডেটা দেখুন",
  noLocalChecksFound: "কোনো স্থানীয় চেক ডেটা নেই।",
  startFirstCheck: "প্রথম চেক শুরু করুন",
  totalChecks: "মোট চেক",
  urgentReferrals: "জরুরি রেফার",
  medicineFlags: "ডাক্তারের সিদ্ধান্ত",
  casesByIllness: "লক্ষণ অনুযায়ী কেস সংখ্যা",
  casesByDrugClass: "ওষুধ শ্রেণী অনুযায়ী ফ্ল্যাগ",
  heatwaveDayCases: "তাপপ্রবাহ দিনের চেক",
  heatwaveDayCasesDesc: "তাপ সূচক অতিরিক্ত থাকা অবস্থায় সম্পন্ন চেক সংখ্যা",
  timesFlagged: "বার ফ্ল্যাগ করা হয়েছে",
  checksCount: "{count}টি চেক",

  // About Section Detailed Labels
  aboutRuleEngineLabel: "নির্দিষ্ট নিয়ম ইঞ্জিন:",
  aboutAskDoctorLabel: "আজ ডাক্তারকে জানান:",
  aboutUrgentLabel: "জরুরি রেফার ওভাররাইড:",
  aboutSourceOpenMeteo: "Open-Meteo আবহাওয়া API",
  aboutSourceRules: "ক্লিনিক্যাল সিক-ডে গাইডেন্স রুলস ইঞ্জিন",
  aboutSourceDPDP: "DPDP Act ২০২৩ সংগতিপূর্ণ স্থানীয় স্টোরেজ",

  // Evaluate Tab Detailed Labels
  audioTranscriptLabel: "অডিও প্রতিলিপি:",
  groundTruthJsonLabel: "গ্রাউন্ড ট্রুথ JSON:",
};

// ─── Hindi Strings ───────────────────────────────────────────────────────────

const STRINGS_HI: Strings = {
  // App branding
  appName: "औषध प्रहरी",
  appTagline: "CHO और ASHA के लिए दवा रक्षक",
  appSubtitle: "ग्रामीण स्वास्थ्य निर्णय सहायता प्रणाली",
  appRole: "कम्युनिटी हेल्थ ऑफिसर और आशा कार्यकर्ताओं के लिए",

  // Navigation
  navHome: "होम",
  navCheck: "बीमारी जांच",
  navHeat: "लू की सूची",
  navPatients: "मरीज़ सूची",
  navReview: "समीक्षा कतार",
  navEvaluate: "मूल्यांकन",
  navAbout: "परिचय",
  navDashboard: "डैशबोर्ड",
  navDemo: "डेमो वॉकथ्रू",

  // Disclaimer & System Banners
  safetyDisclaimer: "निर्णय सहायता उपकरण। चिकित्सा उपकरण नहीं। डॉक्टर के बिना कोई दवा न बदलें।",
  unsignedBadge: "अहस्ताक्षरित नियम — चिकित्सक समीक्षा आवश्यक",
  syntheticDataBanner: "⚠️ कृत्रिम डेमो डेटा — वास्तविक रोगी डेटा नहीं",
  demoModeBanner: "डेमो मोड — सिंथेटिक वॉकथ्रू डेटा (वास्तविक स्टोर अप्रभावित)",
  demoWalkthroughBadge: "डेमो परिदृश्य",

  // Common UI words
  loading: "लोड हो रहा है…",
  save: "सहेजें",
  saved: "सहेजा गया",
  cancel: "रद्द करें",
  back: "पीछे",
  next: "अगला",
  confirm: "पुष्टि करें",
  edit: "संपादित करें",
  delete: "हटाएं",
  deleteAll: "मेरा सारा डेटा हटाएं",
  deleteConfirm: "क्या आप सुनिश्चित हैं? यह पूर्ववत नहीं किया जा सकता।",
  close: "बंद करें",
  done: "पूर्ण",
  copy: "कॉपी करें",
  copied: "कॉपी हो गया!",
  share: "साझा करें",
  filter: "फ़िल्टर",
  search: "खोजें",
  all: "सभी",
  actions: "कार्रवाई",
  status: "स्थिति",
  date: "तारीख",
  time: "समय",
  total: "कुल",
  notes: "टिप्पणियाँ",
  yes: "हाँ",
  no: "नहीं",
  unknown: "अज्ञात",
  notSure: "निश्चित नहीं",
  none: "कोई नहीं",
  goBack: "वापस जाएँ",
  selectLanguage: "भाषा चुनें",

  // Connectivity & Sync
  online: "ऑनलाइन",
  offline: "ऑफ़लाइन",
  offlineMode: "ऑफ़लाइन मोड — AI सुविधाओं के लिए इंटरनेट चाहिए।",
  syncPending: "सिंक लंबित",
  syncNow: "अभी सिंक करें",
  syncUpToDate: "✓ सब कुछ अद्यतित है",
  syncSuccess: "✓ सिंक सफलतापूर्वक पूरा हुआ",
  syncFailed: "✗ सिंक विफल — कृपया पुन: प्रयास करें",
  syncOffline: "✗ ऑफ़लाइन — इंटरनेट मिलने पर स्वतः प्रयास होगा",
  aiUnavailable: "AI उपलब्ध नहीं — कृपया मैन्युअल रूप से दर्ज करें।",
  aiManualFallback: "AI सहायक ऑफ़लाइन है। आप मैन्युअल रूप से जारी रख सकते हैं।",
  noVoice: "इस डिवाइस पर इस भाषा के लिए कोई आवाज़ उपलब्ध नहीं।",

  // Home Page
  homeNewCheck: "नई बीमारी जांच",
  homeNewCheckSubtitle: "बीमार मरीज़ की दवाओं की सुरक्षा जांचें",
  homeHeatwave: "लू मरीज़ सूची",
  homeHeatwaveSubtitle: "गर्म दिनों में उच्च जोखिम वाले मरीज़ों को प्राथमिकता दें",
  homePatients: "मेरी मरीज़ सूची",
  homePatientsSubtitle: "समुदाय के मरीज़ों को देखें, खोजें या नया जोड़ें",
  homeReview: "फार्मासिस्ट / चिकित्सक समीक्षा",
  homeReviewSubtitle: "दवा ब्रांड और नियमों की सिफारिशों को अनुमोदित करें",
  homeDashboard: "आंकड़े और मेट्रिक्स",
  homeDashboardSubtitle: "केसलोड आंकड़े और क्लिनिकल गतिविधियाँ देखें",
  homeAbout: "परिचय और सुरक्षा जानकारी",
  homeAboutSubtitle: "सीमाएं, गोपनीयता सूचनाएं और कार्यप्रणाली",
  homeDemo: "इंटरएक्टिव डेमो वॉकथ्रू",
  homeDemoSubtitle: "सिंथेटिक केस के साथ 6-चरणीय निर्देशित प्रस्तुति",
  homeStatsTotalChecks: "कुल जांच",
  homeStatsPendingSync: "सिंक बाकी",
  homeStatsSyncNow: "सिंक करें",

  // Settings
  settingsTitle: "⚙️ सेटिंग्स और डिवाइस कॉन्फ़िगरेशन",
  settingsFontScale: "टेक्स्ट का आकार",
  settingsMOPhone: "मेडिकल ऑफिसर (MO) फ़ोन नंबर",
  settingsMOPhonePlaceholder: "+९१ ९८७६५ ४३२१०",
  settingsMOPhoneHelp: "त्वरित जानकारी देने के लिए SMS और WhatsApp लिंक पहले से तैयार रखता है",
  settingsDeleteData: "खतरा क्षेत्र: डिवाइस का सारा डेटा हटाएं",
  settingsIndicNumerals: "देवनागरी अंकों का उपयोग करें (१२३४५)",

  // First-time Consent Modal
  consentTitle: "औषध प्रहरी में आपका स्वागत है",
  consentBody: "यह एप्लिकेशन मरीज़ जांच डेटा केवल इसी डिवाइस पर संग्रहीत करता है। किसी नाम या फोन नंबर की आवश्यकता नहीं है। DPDP अधिनियम 2023 के तहत आप Settings से कभी भी सभी डेटा हटा सकते हैं।",
  consentAlert: "निर्णय सहायता उपकरण। चिकित्सा उपकरण नहीं। डॉक्टर के बिना कोई दवा न बदलें।",
  consentAccept: "मैं समझता/समझती हूँ — जारी रखें ✓",
  consentDecline: "कोई डेटा संग्रहीत न करें (अस्थायी मोड)",

  // Patient Registration & Profile
  patientToken: "मरीज़ टोकन",
  patientSelectExisting: "या पंजीकृत मरीज़ों में से चुनें:",
  patientCreateNew: "नया अनाम टोकन बनाएं",
  patientTokenPlaceholder: "उदा. P-8492 या जेनरेट दबाएं",
  patientAgeBand: "आयु वर्ग",
  ageBandChild: "बच्चा (18 वर्ष से कम)",
  ageBandAdult: "वयस्क (18–60 वर्ष)",
  ageBandElderly: "बुजुर्ग (60 वर्ष से अधिक)",
  patientPregnant: "वर्तमान में गर्भवती?",
  patientKidneyDisease: "गुर्दे (किडनी) की बीमारी?",
  patientKnownKidney: "किडनी रोग (CKD)",
  patientLivesAlone: "परिवार के बिना अकेले रहते हैं?",
  patientWorksOutdoors: "धूप में बाहर काम करते हैं?",
  patientCreatinine: "नवीनतम क्रिएटिनिन (mg/dL)",
  patientCreatinineHelp: "वैकल्पिक: पिछले 3 महीनों में मापा गया मान",
  patientEGFR: "नवीनतम eGFR (mL/min/1.73m²)",
  patientEGFRHelp: "वैकल्पिक: अनुमानित ग्लोमेरुलर निस्पंदन दर",
  patientMedicines: "नियमित पर्चे की दवाएं",
  patientChronicMeds: "नियमित सेवन की दवाएं",
  patientFilterAll: "सभी मरीज़",
  patientFilterElderly: "बुजुर्ग मरीज़ (>60)",
  patientFilterKidney: "किडनी मरीज़",
  patientFilterOutdoor: "बाहरी कार्यकर्ता",
  patientAddTitle: "नया मरीज़ पंजीकृत करें",
  patientListEmpty: "अभी तक कोई मरीज़ पंजीकृत नहीं है। शुरू करने के लिए 'नया मरीज़ पंजीकृत करें' दबाएं।",
  patientDetailTitle: "मरीज़ प्रोफ़ाइल और बीमारी का इतिहास",
  patientHistory: "पिछली बीमारी जांचें",

  // Symptoms & Acute Illness Assessment
  step1Title: "चरण 1: मरीज़ प्रोफ़ाइल",
  step1Subtitle: "जोखिम के आधारभूत संकेतकों की पुष्टि करें",
  step2Title: "चरण 2: गंभीर लक्षण",
  step2Subtitle: "लक्षण चुनें या बोलकर बताएं",
  step3Title: "चरण 3: दवाइयाँ",
  step3Subtitle: "ब्रांड का नाम खोजें या वर्ग चुनें",
  step4Title: "चरण 4: क्लिनिकल मार्गदर्शन",
  step4Subtitle: "चेतावनियों की समीक्षा करें और डॉक्टर को संदेश भेजें",

  stepSymptomsPrompt: "मरीज़ को आज क्या-क्या लक्षण हैं?",
  stepSymptomsMicPrompt: "अपनी भाषा में लक्षण बताएं (आवाज़)",
  stepSymptomsListening: "सुन रहे हैं… अब बांग्ला, हिंदी या अंग्रेजी में बोलें",
  stepSymptomsStopListening: "रिकॉर्डिंग बंद करें",
  stepSymptomsParseSuccess: "✓ आवाज़ पहचानी गई और लक्षण निकाले गए",
  stepSymptomsParseFailed: "आवाज़ समझ नहीं आई। कृपया सूची से हाथ से चुनें।",
  durationQuestion: "मरीज़ को कितने दिनों से यह लक्षण हैं?",
  durationDaysLabel: "अवधि (दिन)",
  ableToDrink: "क्या मरीज़ पानी या तरल पदार्थ पी और रख पा रहे हैं?",
  urineQuestion: "क्या मरीज़ को पिछले 8 घंटों में पेशाब हुआ है?",
  dizzinessQuestion: "क्या मरीज़ को बहुत चक्कर या बेहोशी जैसा लग रहा है?",
  confusionQuestion: "क्या कोई भ्रम, उनींदापन या व्यवहार में बदलाव है?",
  bloodInStool: "क्या मल में कोई खून या काला मल देखा गया है?",
  chestPain: "क्या सीने में दर्द या सांस लेने में तकलीफ है?",
  cannotKeepFluids: "क्या 24 घंटे से अधिक समय से कोई तरल नहीं रख पा रहे हैं?",

  symptomLooseMotions: "दस्त / दस्त लगना",
  symptomVomiting: "उल्टी",
  symptomFever: "बुखार",
  symptomNotEating: "खाना या पानी नहीं ले रहे",
  symptomHotWeather: "बहुत गर्म मौसम",
  symptomNone: "इनमें से कोई गंभीर लक्षण नहीं",

  // Medicine Selection & Brand Search
  stepMedicinesPrompt: "मरीज़ नियमित रूप से कौन सी दवाइयाँ लेते हैं?",
  searchMedicinePlaceholder: "दवा का ब्रांड नाम लिखें (उदा. Glycomet, Cardace, Lasix)…",
  searchResultsCount: "{count} मिलते-जुलते ब्रांड मिले:",
  noMedicineFound: "डेटाबेस में कोई मिलता-जुलता ब्रांड नहीं मिला।",
  brandStatusVerified: "सत्यापित",
  brandStatusUnsigned: "अहस्ताक्षरित प्लेसहोल्डर",
  brandStatusUnknown: "अज्ञात ब्रांड",
  brandStatusPendingReview: "समीक्षा लंबित",
  selectedMedicinesTitle: "मूल्यांकन के लिए चुनी गई दवाएं ({count})",
  selectedMedicinesEmpty: "अभी तक कोई दवा नहीं चुनी गई। जोड़ने के लिए ऊपर खोजें।",
  removeMedicine: "हटाएं",

  customBrandTitle: "दवा सूची में नहीं है? कस्टम दवा जोड़ें",
  customBrandPlaceholder: "ब्रांड या व्यावसायिक नाम दर्ज करें…",
  customClassLabel: "दवा का फार्माकोलॉजिकल वर्ग चुनें:",
  askAISuggest: "AI से दवा वर्ग सुझाव मांगें",
  askAILoading: "AI द्वारा दवा संरचना का विश्लेषण किया जा रहा है…",
  addManualClass: "मैन्युअल रूप से वर्ग सेट करें",
  submitToReview: "अज्ञात ब्रांड को मेडिकल ऑफिसर समीक्षा कतार में भेजें",

  // Clinical Result Screen
  resultUrgentBanner: "🚨 अभी स्वास्थ्य केंद्र जाएँ",
  resultAskDoctorBanner: "⚠️ आज ही डॉक्टर से पूछें",
  resultNoFlag: "✓ अभी कोई दवा चेतावनी नहीं",
  resultInfoBanner: "ℹ️ क्लिनिकल जानकारी नोट",

  resultUrgentDesc: "मरीज़ में आपातकालीन खतरनाक लक्षण दिख रहे हैं जिनके लिए तुरंत चिकित्सा मूल्यांकन जरूरी है। देर न करें।",
  resultAskDoctorDesc: "गंभीर निर्जलीकरण या बीमारी के कारण एक या अधिक नियमित दवाओं पर आज ही डॉक्टर के निर्णय की आवश्यकता है।",
  resultNoFlagDesc: "वर्तमान लक्षणों के अनुसार मरीज़ की किसी भी नियमित दवा को रोकने या बदलने की आवश्यकता नहीं है।",

  flaggedMedicinesTitle: "जिन दवाओं के लिए आज ही डॉक्टर का निर्णय चाहिए ({count})",
  unflaggedMedicinesTitle: "जिन दवाओं पर कोई तत्काल चेतावनी नहीं है ({count})",
  whyToggle: "यह सलाह क्यों? (क्लिनिकल कारण)",
  whyTitle: "लागू नियम का क्लिनिकल आधार",
  whyClose: "विवरण बंद करें",

  ruleId: "नियम आईडी",
  ruleText: "क्लिनिकल मार्गदर्शन नियम",
  ruleStatus: "सत्यापन स्थिति",
  ruleSource: "क्लिनिकल साक्ष्य का स्रोत",

  // Medical Officer Message & Sharing
  moMessageTitle: "मेडिकल ऑफिसर (MO) के लिए संक्षिप्त संदेश",
  moMessageCount: "अक्षर संख्या: {count} / अधिकतम 300",
  copyMessage: "संदेश कॉपी करें",
  messageCopied: "✓ क्लिपबोर्ड पर कॉपी किया गया!",
  shareViaSMS: "SMS से भेजें",
  shareViaWhatsApp: "WhatsApp से भेजें",

  homeCareTitle: "घरेलू देखभाल और सावधानी",
  homeCareReminder: "मरीज़ को बार-बार ORS घोल या नारियल पानी पिलाएं। पेशाब पर नज़र रखें। उल्टी बंद न होने या पेशाब रुकने पर तुरंत अस्पताल ले जाएं।",
  saveCheckRecord: "मरीज़ रिकॉर्ड में जांच सहेजें",
  checkSavedSuccess: "✓ मरीज़ की जांच स्थानीय डिवाइस पर सफलतापूर्वक सहेज ली गई",

  // Heatwave Screen
  heatPageTitle: "लू मरीज़ जोखिम रैंकिंग",
  heatPageSubtitle: "तापमान और दवा जोखिम के आधार पर उच्च जोखिम वाले मरीज़ों की प्राथमिकता सूची",
  heatIndex: "वर्तमान ताप सूचकांक (Heat Index)",
  heatDay: "लू चेतावनी — सक्रिय संपर्क और सावधानी परामर्श दें",
  notHeatDay: "सामान्य तापमान — नियमित निगरानी",
  heatThresholdNote: "सीमा: 41°C या अधिक ताप सूचकांक होने पर संवेदनशील मरीज़ों से प्राथमिकता संपर्क आवश्यक है।",
  heatForecast: "3-दिन का मौसम पूर्वानुमान",
  heatForecastToday: "आज",
  heatForecastTomorrow: "कल",
  heatForecastDayAfter: "परसों",
  heatManualEntryTitle: "मैन्युअल तापमान और आर्द्रता प्रविष्टि",
  heatManualTempLabel: "वातावरण का तापमान (°C)",
  heatManualHumidityLabel: "सापेक्ष आर्द्रता (%)",
  heatManualComputeBtn: "ताप सूचकांक की गणना करें",
  heatCaseloadTitle: "वरीयता प्राप्त मरीज़ सूची ({count})",
  heatCaseloadEmpty: "कोई पंजीकृत मरीज़ नहीं मिला। गर्मी का जोखिम देखने के लिए मरीज़ जोड़ें।",
  heatRank: "रैंक #{rank}",
  riskScore: "जोखिम स्कोर: {score} अंक",
  whyThisRank: "यह रैंक क्यों दी गई?",
  contactStatus: "संपर्क स्थिति",
  contactStatusNone: "आज संपर्क नहीं हुआ",
  called: "संपर्क हुआ / सलाह दी गई",
  notReached: "फ़ोन नहीं लगा / उपलब्ध नहीं",
  markCalled: "संपर्क संपन्न चिह्नित करें",
  markNotReached: "संपर्क नहीं हुआ चिह्नित करें",
  heatOutdoorRisk: "सीधे धूप में बाहर काम करते हैं (+3 अंक)",
  heatElderlyRisk: "60 वर्ष से अधिक आयु के बुजुर्ग (+2 अंक)",
  heatDiureticRisk: "डाइयूरेटिक या SGLT2 इनहिबिटर दवा लेते हैं (+4 अंक)",
  heatLivingAloneRisk: "देखभालकर्ता के बिना अकेले रहते हैं (+2 अंक)",

  // PIN Authentication & Review Screen
  reviewPageTitle: "फार्मासिस्ट / चिकित्सक समीक्षा कतार",
  reviewPageSubtitle: "लंबित दवा वर्गों को सत्यापित करें, नियमों को अनुमोदित करें और ऑडिट लॉग निर्यात करें",
  pinTitleSetup: "समीक्षक सुरक्षा PIN बनाएं",
  pinDescSetup: "इस साझा डिवाइस पर क्लिनिकल समीक्षा सुरक्षित रखने के लिए 4 से 6 अंकों का PIN सेट करें।",
  pinInputSetup: "नया 4-6 अंकों का PIN दर्ज करें",
  pinConfirmSetup: "नए PIN की पुष्टि करें",
  pinBtnSet: "PIN सेट करें और कतार खोलें",
  pinTitleLogin: "समीक्षक PIN सत्यापन",
  pinDescLogin: "क्लिनिकल नियंत्रण अनलॉक करने के लिए अपना समीक्षक PIN दर्ज करें।",
  pinInputLogin: "PIN दर्ज करें",
  pinBtnLogin: "कतार अनलॉक करें",
  pinErrorWrong: "गलत PIN दर्ज किया गया।",
  pinAttemptsRemaining: "अस्थायी रूप से लॉक होने से पहले {remaining} प्रयास शेष हैं।",
  pinLockedOut: "लगातार गलत PIN के कारण खाता अस्थायी रूप से लॉक कर दिया गया है।",
  pinLockedOutWait: "पुनः प्रयास करने से पहले कृपया {seconds} सेकंड प्रतीक्षा करें।",
  pinTitleChange: "सुरक्षा PIN बदलें",
  pinOldInput: "वर्तमान PIN",
  pinNewInput: "नया 4-6 अंकों का PIN",
  pinBtnChange: "PIN अपडेट करें",
  pinChangeSuccess: "✓ सुरक्षा PIN सफलतापूर्वक अपडेट किया गया",
  pinBtnLogout: "लॉक और लॉगआउट",
  pinAutoLockNotice: "गोपनीयता के लिए 5 मिनट तक निष्क्रिय रहने पर सत्र अपने आप लॉक हो जाता है।",

  reviewTabBrands: "लंबित ब्रांड सुझाव ({count})",
  reviewTabRules: "क्लिनिकल नियम अनुमोदन ({count})",
  reviewPendingBrands: "फार्मासिस्ट वर्गीकरण की प्रतीक्षा कर रहे अज्ञात ब्रांड",
  reviewUnsignedRules: "चिकित्सक अनुमोदन की प्रतीक्षा कर रहे क्लिनिकल नियम",
  reviewNoPendingBrands: "✓ समीक्षा कतार में कोई लंबित ब्रांड नहीं है।",
  reviewNoUnsignedRules: "सभी क्लिनिकल नियमों की समीक्षा और अनुमोदन पूरा हो चुका है।",
  reviewApprove: "वर्गीकरण स्वीकृत करें",
  reviewEdit: "वर्ग बदलें",
  reviewReject: "अस्वीकार / हटाएं",
  reviewSave: "निर्णय सहेजें",
  reviewerNameLabel: "समीक्षक का पूरा नाम और पद",
  reviewerRegLabel: "मेडिकल / फार्मेसी पंजीकरण संख्या",
  reviewerProfileSave: "समीक्षक विवरण अपडेट करें",
  reviewedByPrefix: "समीक्षक: {name}",
  reviewedAtPrefix: "समीक्षा तारीख: {date}",
  exportJSON: "ऑडिटेड JSON निर्यात",
  exportCSV: "ऑडिटेड CSV निर्यात",
  importCSV: "स्वीकृत CSV आयात",
  importSuccess: "✓ {count} ब्रांड रिकॉर्ड सफलतापूर्वक आयात और संयोजित किए गए",
  importError: "✗ आयातित CSV फ़ाइल पढ़ने में विफल। प्रारूप की जांच करें।",
  ruleSignOffBtn: "हस्ताक्षर और अनुमोदन करें",
  ruleSignedOffBadge: "✓ चिकित्सक द्वारा अनुमोदित",
  ruleUnsignedBadge: "⚠️ अहस्ताक्षरित नियम (प्लेसहोल्डर)",

  // Evaluation Screen
  evaluatePageTitle: "क्लिनिकल मूल्यांकन और सत्यापन हार्नेस",
  evaluatePageSubtitle: "चिकित्सक स्वर्ण मानक के मुकाबले नियम इंजन और AI विश्लेषण की सटीकता का परीक्षण",
  importVignettes: "विगनेट बेंचमार्क CSV आयात",
  runEvaluation: "मूल्यांकन पाइपलाइन चलाएं",
  noDataYet: "अभी तक कोई मूल्यांकन डेटा लोड नहीं किया गया है। परीक्षण चलाने के लिए 'डेमो डेटा लोड करें' दबाएं या CSV फ़ाइल लाएं।",
  demoVignettesComputed: "सिंथेटिक डेमो विगनेट्स से परिकलित (20 क्लिनिकल मामले, 3 चिकित्सक)",
  sensitivityLabel: "संवेदनशीलता (गंभीर मामलों की सही पहचान)",
  specificityLabel: "विशिष्टता (झूठे अलार्म से बचाव)",
  ppvLabel: "पॉजिटिव प्रेडिक्टिव वैल्यू (PPV)",
  kappaLabel: "समीक्षकों में सहमति (कोहेन कप्पा)",
  missedUrgent: "चूके हुए जरूरी मामले: {total} में से {count}",
  evaluationResultsTitle: "मूल्यांकन विगनेट तालिका ({count})",
  evalTableVignetteId: "आईडी",
  evalTableScenario: "क्लिनिकल परिदृश्य",
  evalTableGold: "चिकित्सक स्वर्ण मानक",
  evalTableEngine: "इंजन का परिणाम",
  evalTableMatch: "सहमति",
  exportResults: "मूल्यांकन परिणाम CSV निर्यात",
  loadDemoVignettesBtn: "डेमो विगनेट डेटा लोड करें (20 मामले)",

  // Demo Page & Walkthrough Checklist (/demo)
  demoPageTitle: "इंटरएक्टिव डेमो और प्रस्तुति वॉकथ्रू",
  demoPageSubtitle: "सभी मुख्य क्लिनिकल, सुरक्षा और ऑफ़लाइन क्षमताओं को प्रदर्शित करने वाला 6-चरणीय मार्गदर्शक",
  demoModeActive: "डेमो मोड सक्रिय",
  demoModeDisabled: "डेमो मोड निष्क्रिय",
  demoToggleOn: "डेमो मोड चालू करें",
  demoToggleOff: "डेमो मोड बंद करें",
  demoLoadDataBtn: "वॉकथ्रू डेमो डेटा लोड करें",
  demoResetBtn: "डेमो रीसेट कर मूल स्थिति में लाएं",
  demoResetSuccess: "✓ डेमो वातावरण रीसेट कर प्रारंभिक स्थिति में लाया गया",

  demoStep1Title: "चरण 1: बांग्ला में भाषा परिवर्तन",
  demoStep1Desc: "एक टैप में पूर्ण स्थानीयकरण दिखाएं: हेडर, फॉर्म, क्लिनिकल शब्द और आवाज़ इंजन बिना रीलोड के तुरंत बांग्ला में बदल जाते हैं।",
  demoStep1Btn: "बांग्ला चुनें और होम पर जाएँ",

  demoStep2Title: "चरण 2: बीमारी जांच (निर्जलीकरण + ACEi + मेटफॉर्मिन)",
  demoStep2Desc: "Cardace (ACE inhibitor) और Glycomet (Metformin) लेने वाले दस्त से पीड़ित मरीज़ को लोड करें। 'आज ही डॉक्टर से पूछें' और 'कारण' देखें।",
  demoStep2Btn: "बीमारी जांच में परिदृश्य 1 शुरू करें",

  demoStep3Title: "चरण 3: खतरनाक आपातकालीन स्थिति (8 घंटे से पेशाब नहीं)",
  demoStep3Desc: "8 घंटे से पेशाब न होने के गंभीर निर्जलीकरण की जांच करें। तत्काल लाल चेतावनी '🚨 अभी स्वास्थ्य केंद्र जाएँ' देखें।",
  demoStep3Btn: "खतरनाक आपातकालीन परिदृश्य शुरू करें",

  demoStep4Title: "चरण 4: अज्ञात दवा ब्रांड प्रविष्टि",
  demoStep4Desc: "अनजान ग्रामीण ब्रांड ('AyurDiab-Plus') का परीक्षण करें। सुरक्षित मैन्युअल विकल्प और स्वतः डॉक्टर समीक्षा कतार में जाना देखें।",
  demoStep4Btn: "अज्ञात ब्रांड परिदृश्य शुरू करें",

  demoStep5Title: "चरण 5: समीक्षा कतार और सुरक्षित PIN प्रक्रिया",
  demoStep5Desc: "मेडिकल ऑफिसर समीक्षा कतार खोलें। पहली बार PIN सेट करना, PBKDF2 सुरक्षा, गलत PIN लॉकआउट और ब्रांड अनुमोदन देखें।",
  demoStep5Btn: "PIN से समीक्षा कतार खोलें",

  demoStep6Title: "चरण 6: लू की सूची और मूल्यांकन मेट्रिक्स",
  demoStep6Desc: "लू के दिनों में संवेदनशील मरीज़ों की प्राथमिकता देखें और 20 क्लिनिकल मामलों के आधार पर संवेदनशीलता, विशिष्टता और कोहेन कप्पा जांचें।",
  demoStep6Btn: "लू सूची और मूल्यांकन आंकड़े देखें",

  // Language Audit / Language Check Page (/about/language-check)
  langCheckTitle: "भाषा एकरूपता और सटीकता ऑडिट",
  langCheckSubtitle: "बांग्ला, हिंदी और अंग्रेजी अनुवादों का एक साथ संपूर्ण सत्यापन पृष्ठ",
  langCheckSearchPlaceholder: "अनुवाद कुंजी या वाक्यांश खोजें…",
  langCheckTotalKeys: "कुल कैटलॉग किए गए वाक्यांश: {count}",
  langCheckColKey: "पहचानकर्ता कुंजी",
  langCheckColEn: "अंग्रेजी (English)",
  langCheckColBn: "बांग्ला",
  langCheckColHi: "हिंदी",
  langCheckColStatus: "ऑडिट स्थिति",
  langCheckStatusVerified: "सत्यापित",
  langCheckStatusNeedsReview: "समीक्षा आवश्यक",
  langCheckFilterAll: "सभी वाक्यांश ({count})",
  langCheckFilterNeedsReview: "समीक्षा आवश्यक वाले ({count})",

  // About Page & Limitations
  aboutTitle: "औषध प्रहरी परिचय और क्लिनिकल प्रशासन",
  aboutSubtitle: "सुरक्षा दिशानिर्देश, ढांचागत सीमाएं, गोपनीयता संरक्षण और सत्यापन की सीमाएं",
  aboutSafetySection: "1. मुख्य क्लिनिकल सुरक्षा सिद्धांत",
  aboutLimitsSection: "2. क्या स्पष्ट रूप से सत्यापित नहीं है",
  aboutPrivacySection: "3. गोपनीयता और DPDP अधिनियम 2023 का पालन",
  aboutSourcesSection: "4. औषधीय और क्लिनिकल दिशानिर्देशों के स्रोत",
  aboutUnvalidatedWarning: "⚠️ अनिवार्य चेतावनी: इस डेमो एप्लीकेशन के सभी दवा नियम, ब्रांड मैपिंग और जोखिम भार प्लेसहोल्डर हैं। क्लिनिकल उपयोग से पहले लाइसेंस प्राप्त चिकित्सकों और फार्मासिस्टों द्वारा इनका सत्यापन अनिवार्य है।",
  aboutLanguageCheckLink: "संपूर्ण भाषा सत्यापन पृष्ठ खोलें",
  aboutDeleteAllBtn: "डिवाइस के सभी स्थानीय रिकॉर्ड हटाएं",

  // Pharmacological Drug Classes
  drugClass_ace_inhibitor: "ACE इनहिबिटर (उदा. Enalapril, Ramipril)",
  drugClass_arb: "ARB (उदा. Losartan, Telmisartan)",
  drugClass_diuretic_loop: "लूप डाइयूरेटिक (उदा. Furosemide)",
  drugClass_diuretic_thiazide: "थायजाइड डाइयूरेटिक (उदा. Hydrochlorothiazide)",
  drugClass_sglt2_inhibitor: "SGLT2 इनहिबिटर (उदा. Dapagliflozin, Empagliflozin)",
  drugClass_metformin: "मेटफॉर्मिन",
  drugClass_sulfonylurea: "सल्फोनील्यूरिया (उदा. Glimepiride, Gliclazide)",
  drugClass_nsaid: "NSAID दर्द निवारक (उदा. Ibuprofen, Diclofenac)",
  drugClass_other: "अन्य / चेतावनी रहित नियमित दवा",
  drugClass_unknown: "अज्ञात वर्ग (सत्यापन आवश्यक)",

  // Deterministic Rule Guidance Texts
  rule_RF001: "बच्चा रोगी — अभी स्वास्थ्य केंद्र जाएँ।",
  rule_RF002: "गर्भवती रोगी, बीमारी — अभी स्वास्थ्य केंद्र जाएँ।",
  rule_RF003: "8+ घंटे से पेशाब बंद — गंभीर निर्जलीकरण का लक्षण, अभी स्वास्थ्य केंद्र जाएँ।",
  rule_RF004: "बहुत चक्कर या बेहोशी — अभी स्वास्थ्य केंद्र जाएँ।",
  rule_RF005: "भ्रम या उनींदापन — अभी स्वास्थ्य केंद्र जाएँ।",
  rule_RF006: "मल में खून — अभी स्वास्थ्य केंद्र जाएँ।",
  rule_RF007: "सीने में दर्द या सांस फूलना — अभी स्वास्थ्य केंद्र जाएँ।",
  rule_RF008: "24 घंटे से अधिक समय से कोई तरल नहीं रुक रहा — अभी स्वास्थ्य केंद्र जाएँ।",
  rule_SD001: "दस्त/उल्टी से पीड़ित मरीज़ ACE इनहिबिटर ले रहे हैं — खुराक के निर्णय के लिए आज ही डॉक्टर से मिलें।",
  rule_SD002: "दस्त/उल्टी से पीड़ित मरीज़ ARB ले रहे हैं — खुराक के निर्णय के लिए आज ही डॉक्टर से मिलें।",
  rule_SD003: "दस्त/उल्टी से पीड़ित मरीज़ डाइयूरेटिक ले रहे हैं — खुराक के निर्णय के लिए आज ही डॉक्टर से मिलें।",
  rule_SD004: "दस्त/उल्टी से पीड़ित मरीज़ मेटफॉर्मिन ले रहे हैं — खुराक के निर्णय के लिए आज ही डॉक्टर से मिलें।",
  rule_SD005: "दस्त/उल्टी से पीड़ित मरीज़ SGLT2 इनहिबिटर ले रहे हैं — खुराक के निर्णय के लिए आज ही डॉक्टर से मिलें।",
  rule_SD006: "बुखार या न खा पा रहे मरीज़ सल्फोनील्यूरिया ले रहे हैं — खुराक के निर्णय के लिए आज ही डॉक्टर से मिलें।",
  rule_SD007: "निर्जलीकरण से पीड़ित मरीज़ NSAID ले रहे हैं — खुराक के निर्णय के लिए आज ही डॉक्टर से मिलें।",
  rule_HW001: "गंभीर लू के दिन डाइयूरेटिक लेने वाले मरीज़ — पानी पीने और दवा के बारे में आज ही डॉक्टर से सलाह लें।",
  rule_HW002: "गंभीर लू के दिन SGLT2 इनहिबिटर लेने वाले मरीज़ — पानी पीने और दवा के बारे में आज ही डॉक्टर से सलाह लें।",
  rule_HW003: "गंभीर लू के दिन ACE इनहिबिटर / ARB लेने वाले मरीज़ — पानी पीने और दवा के बारे में आज ही डॉक्टर से सलाह लें।",

  // Dashboard & Analytics
  dashboardSubtitle: "सीएचओ/आशा स्वास्थ्य केंद्र का एनालिटिक्स डैशबोर्ड।",
  dashboardExportCSV: "CSV एक्सपोर्ट",
  syntheticDemoBanner: "⚠️ SYNTHETIC DEMO DATA — ३ काल्पनिक PHC क्षेत्रों के ३० सिंथेटिक चेक डेटा",
  viewingRealData: "वास्तविक स्थानीय डेटा देखा जा रहा है",
  viewingDemoData: "सिंथेटिक डेमो डेटा देखा जा रहा है",
  switchToDemoData: "🔄 डेमो डेटा पर बदलें",
  switchToRealData: "📱 मेरा स्थानीय डेटा देखें",
  noLocalChecksFound: "कोई स्थानीय चेक डेटा नहीं मिला।",
  startFirstCheck: "पहला चेक शुरू करें",
  totalChecks: "कुल चेक",
  urgentReferrals: "आपातकालीन रेफर",
  medicineFlags: "डॉक्टर निर्णय",
  casesByIllness: "तीव्र लक्षण अनुसार केस संख्या",
  casesByDrugClass: "फ्लैग की गई दवा श्रेणियां",
  heatwaveDayCases: "लू के दिनों के चेक",
  heatwaveDayCasesDesc: "खतरनाक ताप सूचकांक के दौरान किए गए चेक की संख्या",
  timesFlagged: "बार फ्लैग किया गया",
  checksCount: "{count} चेक",

  // About Section Detailed Labels
  aboutRuleEngineLabel: "निश्चित नियम इंजन:",
  aboutAskDoctorLabel: "आज डॉक्टर से पूछें:",
  aboutUrgentLabel: "आपातकालीन ओवरराइड:",
  aboutSourceOpenMeteo: "Open-Meteo मौसम API",
  aboutSourceRules: "क्लिनिकल सिक-डे मार्गदर्शन नियम इंजन",
  aboutSourceDPDP: "DPDP Act २०२३ अनुपालन स्थानीय स्टोरेज",

  // Evaluate Tab Detailed Labels
  audioTranscriptLabel: "ऑडियो प्रतिलेख:",
  groundTruthJsonLabel: "ग्राउंड ट्रुथ JSON:",
};

// ─── Dictionaries Registry ───────────────────────────────────────────────────

export const STRINGS: Record<Lang, Strings> = {
  en: STRINGS_EN,
  bn: STRINGS_BN,
  hi: STRINGS_HI,
};

const LANG_KEY = "ap_lang";
const INDIC_NUM_KEY = "ap_indic_numerals";

let currentLang: Lang = "bn";

export function getLanguage(): Lang {
  return currentLang;
}

export function setLanguage(lang: Lang): void {
  currentLang = lang;
  if (typeof window !== "undefined") {
    localStorage.setItem(LANG_KEY, lang);
    if (document.documentElement) {
      document.documentElement.lang = lang;
      document.documentElement.setAttribute("lang", lang);
    }
    window.dispatchEvent(new CustomEvent("ap-lang-change", { detail: { lang } }));
  }
}

export function initLanguage(): void {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(LANG_KEY) as Lang | null;
  if (stored && STRINGS[stored]) {
    currentLang = stored;
  }
  if (document.documentElement) {
    document.documentElement.lang = currentLang;
    document.documentElement.setAttribute("lang", currentLang);
  }
}

// ─── Translation Function with Interpolation & Loud Failures ─────────────────

export function t(
  key: keyof Strings | string,
  paramsOrLang?: Record<string, string | number> | Lang,
  langOverride?: Lang
): string {
  let params: Record<string, string | number> | undefined;
  let l: Lang;

  if (typeof paramsOrLang === "string" && (paramsOrLang === "bn" || paramsOrLang === "hi" || paramsOrLang === "en")) {
    l = paramsOrLang;
  } else {
    params = paramsOrLang as Record<string, string | number> | undefined;
    l = langOverride || currentLang;
  }

  const dict = STRINGS[l];
  const str = dict ? (dict as Record<string, string>)[key] : undefined;

  if (str === undefined) {
    // Missing key in requested language! Log loud console error in dev/test
    console.error(`[i18n] Missing translation for key: "${String(key)}" in language: "${l}"`);
    return `[[${String(key)}]]`;
  }

  if (params) {
    return str.replace(/\{(\w+)\}/g, (_, varName) => {
      return params && params[varName] !== undefined ? String(params[varName]) : `{${varName}}`;
    });
  }

  return str;
}

// ─── Indic Numerals & Intl Formatting ────────────────────────────────────────

export function isIndicNumeralsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(INDIC_NUM_KEY) === "true";
}

export function setIndicNumeralsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(INDIC_NUM_KEY, enabled ? "true" : "false");
  window.dispatchEvent(new CustomEvent("ap-lang-change", { detail: { lang: currentLang } }));
}

function getIntlLocale(lang?: Lang): string {
  const l = lang || currentLang;
  const useIndic = isIndicNumeralsEnabled();
  if (l === "bn") {
    return useIndic ? "bn-IN-u-nu-beng" : "bn-IN";
  }
  if (l === "hi") {
    return useIndic ? "hi-IN-u-nu-deva" : "hi-IN";
  }
  return "en-IN";
}

export function formatDate(
  date: string | Date | number,
  lang?: Lang,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const locale = getIntlLocale(lang);
  const defaultOpts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  };
  return new Intl.DateTimeFormat(locale, defaultOpts).format(d);
}

export function formatTime(
  date: string | Date | number,
  lang?: Lang
): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const locale = getIntlLocale(lang);
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatNumber(
  num: number,
  lang?: Lang,
  options?: Intl.NumberFormatOptions
): string {
  const locale = getIntlLocale(lang);
  return new Intl.NumberFormat(locale, options).format(num);
}

// ─── Language Audit Helper for /about/language-check ─────────────────────────

export interface LanguageAuditItem {
  key: string;
  en: string;
  bn: string;
  hi: string;
  needsReview: boolean;
}

// Allowlist of tokens allowed to be identical across EN/BN/HI (technical terms, acronyms)
export const ALLOWLIST_IDENTICAL = new Set([
  "SMS",
  "WhatsApp",
  "AI",
  "CSV",
  "JSON",
  "PPV",
  "eGFR",
  "mg/dL",
  "mL/min/1.73m²",
  "PIN",
  "ID",
  "ORS",
  "UI",
  "AA",
  "AAA",
  "PWA",
  "HTML",
  "API",
  "NOAA",
  "DPDP",
  "RFC 5724",
  "WBMC-58291",
  "Dr. Ananya Roy, MO",
  "Basirhat PHC",
  "Sandeshkhali PHC",
  "Minakhan PHC",
  "Envas",
  "Cardace",
  "Glycomet",
  "Lasix",
  "Cosart",
  "Telma",
  "Amaryl",
  "Jardiance",
  "Forxiga",
  "Brufen",
  "Paracetamol",
  "Crocin",
  "Voveran",
  "Combiflam",
  "Glimy",
  "Glimpid",
  "Frusamide",
  "Hydrochlorthiazide",
  "Ramicard",
  "Losacar",
  "Glucophage",
]);

export function getAllLanguageAuditItems(): LanguageAuditItem[] {
  const keys = Object.keys(STRINGS_EN) as (keyof Strings)[];
  return keys.map((key) => {
    const en = STRINGS_EN[key];
    const bn = STRINGS_BN[key];
    const hi = STRINGS_HI[key];

    const isIdenticalBn = bn === en && !ALLOWLIST_IDENTICAL.has(en);
    const isIdenticalHi = hi === en && !ALLOWLIST_IDENTICAL.has(en);
    const isEmptyBn = !bn || bn.trim() === "";
    const isEmptyHi = !hi || hi.trim() === "";

    const needsReview = isIdenticalBn || isIdenticalHi || isEmptyBn || isEmptyHi;

    return {
      key,
      en,
      bn,
      hi,
      needsReview,
    };
  });
}
