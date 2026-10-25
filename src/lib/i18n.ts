/**
 * i18n.ts — Internationalisation
 *
 * Bengali (default), Hindi, English.
 * All user-facing strings go through t().
 * Language stored in localStorage.
 */

export type Lang = "bn" | "hi" | "en";

export type Strings = typeof STRINGS_EN;

// ─── English strings (canonical) ─────────────────────────────────────────────

const STRINGS_EN = {
  // App name
  appName: "Aushadh Prahari",
  appTagline: "Medicine Guardian for CHOs & ASHAs",

  // Nav
  navHome: "Home",
  navCheck: "Illness Check",
  navHeat: "Heatwave List",
  navPatients: "Patients",
  navReview: "Review Queue",
  navEvaluate: "Evaluate",
  navAbout: "About",
  navDashboard: "Dashboard",

  // Home
  homeNewCheck: "New Illness Check",
  homeHeatwave: "Heatwave Patient List",
  homePatients: "My Patient List",
  homeReview: "Pharmacist / Physician Review",
  homeAbout: "About & Safety Info",

  // Disclaimer
  safetyDisclaimer:
    "Decision-support aid. Not a medical device. Do not change any medicine without a doctor.",
  unsignedBadge: "UNSIGNED RULE — clinician review required",
  syntheticDataBanner: "⚠️ SYNTHETIC DEMO DATA — not real patient data",

  // Patient
  patientToken: "Patient Token",
  patientAgeBand: "Age Group",
  patientPregnant: "Pregnant?",
  patientKidneyDisease: "Known Kidney Disease?",
  patientLivesAlone: "Lives Alone?",
  patientWorksOutdoors: "Works Outdoors?",
  patientCreatinine: "Latest Creatinine (mg/dL)",
  patientEGFR: "Latest eGFR",
  ageBandChild: "Child (< 18 yrs)",
  ageBandAdult: "Adult (18–60 yrs)",
  ageBandElderly: "Elderly (> 60 yrs)",
  yes: "Yes",
  no: "No",
  unknown: "Unknown",
  notSure: "Not sure",

  // Symptoms
  stepSymptoms: "What is the illness?",
  symptomLooseMotions: "Loose Motions / Diarrhoea",
  symptomVomiting: "Vomiting",
  symptomFever: "Fever",
  symptomNotEating: "Not Eating / Drinking",
  symptomHotWeather: "Very Hot Weather",
  symptomNone: "None of these",
  symptomMicButton: "Tell in your own words (voice)",
  durationQuestion: "How many days?",
  ableToDrink: "Can the patient drink and keep fluids?",
  urineQuestion: "Did the patient pass urine in the last 8 hours?",
  dizzinessQuestion: "Any dizziness or fainting?",
  confusionQuestion: "Any confusion or unusual behaviour?",
  bloodInStool: "Any blood in the stool?",
  chestPain: "Any chest pain?",
  cannotKeepFluids: "Unable to keep fluids down for more than a day?",

  // Medicines
  stepMedicines: "What medicines does the patient take?",
  searchMedicine: "Search medicine name…",
  brandStatusVerified: "Verified",
  brandStatusUnsigned: "Unsigned",
  brandStatusUnknown: "Unknown brand",
  brandStatusPendingReview: "Pending review",
  askAISuggest: "Ask AI to suggest drug class",
  addManualClass: "Set class manually",

  // Result
  resultUrgentBanner: "🚨 Go to health facility NOW",
  resultAskDoctorBanner: "⚠️ Ask the doctor today",
  resultNoFlag: "✓ No medicine flags at this time",
  whyToggle: "Why?",
  ruleId: "Rule ID",
  ruleText: "Rule",
  ruleStatus: "Status",
  copyMessage: "Copy Message",
  shareViaSMS: "Share via SMS",
  shareViaWhatsApp: "Share via WhatsApp",
  homeCareReminder: "Home care: Give oral rehydration solution (ORS). Seek help if patient worsens.",

  // Heatwave
  heatPageTitle: "Heatwave Patient Ranking",
  heatIndex: "Heat Index",
  heatDay: "Heat Day",
  notHeatDay: "Not a Heat Day",
  heatForecast: "3-Day Forecast",
  heatManualEntry: "Manual Heat Level Entry",
  contactStatus: "Contact status",
  called: "Called",
  notReached: "Not reached",
  riskScore: "Risk Score",
  whyThisRank: "Why this rank?",

  // Review
  reviewPageTitle: "Pharmacist / Physician Review Queue",
  reviewPendingBrands: "Pending Brand Suggestions",
  reviewUnsignedRules: "Unsigned Rules",
  reviewApprove: "Approve",
  reviewEdit: "Edit",
  reviewReject: "Reject",
  reviewerName: "Reviewer name",
  reviewedAt: "Reviewed at",
  exportJSON: "Export JSON",
  exportCSV: "Export CSV",
  importCSV: "Import CSV",
  pinPrompt: "Enter reviewer PIN",

  // Evaluate
  evaluatePageTitle: "Evaluation Harness",
  importVignettes: "Import Vignettes CSV",
  runEvaluation: "Run Evaluation",
  noDataYet: "No data yet — import a vignette CSV to begin.",
  sensitivityLabel: "Sensitivity (Recall)",
  specificityLabel: "Specificity",
  ppvLabel: "PPV (Precision)",
  kappaLabel: "Cohen's Kappa",
  missedUrgent: "Missed urgent cases",
  exportResults: "Export Results CSV",

  // About
  aboutTitle: "About & Safety",
  aboutLimits: "Limitations",
  aboutPrivacy: "Privacy",
  aboutSources: "Sources",

  // Errors / Status
  aiUnavailable: "AI unavailable — please enter manually.",
  offlineMode: "Offline mode — AI features require internet.",
  syncPending: "Sync pending",
  syncNow: "Sync Now",
  noVoice: "No voice available for this language on this device.",
  loading: "Loading…",
  save: "Save",
  cancel: "Cancel",
  back: "Back",
  next: "Next",
  confirm: "Confirm",
  edit: "Edit",
  delete: "Delete",
  deleteAll: "Delete all my data",
  deleteConfirm: "Are you sure? This cannot be undone.",

  // Consent
  consentTitle: "Welcome to Aushadh Prahari",
  consentBody:
    "This app stores patient check data only on this device. No names or phone numbers are required. You can delete all data at any time from Settings.",
  consentAccept: "I understand — Continue",
  consentDecline: "Do not store any data",

  // Font scale
  fontScaleLabel: "Text size",

  // Lang selector
  langLabel: "Language",
};

// ─── Bengali strings ──────────────────────────────────────────────────────────

const STRINGS_BN: Strings = {
  appName: "ঔষধ প্রহরী",
  appTagline: "CHO ও ASHA-দের জন্য ওষুধ রক্ষক",
  navHome: "হোম",
  navCheck: "অসুস্থতা পরীক্ষা",
  navHeat: "তাপপ্রবাহ তালিকা",
  navPatients: "রোগীর তালিকা",
  navReview: "পর্যালোচনা সারি",
  navEvaluate: "মূল্যায়ন",
  navAbout: "সম্পর্কে",
  navDashboard: "ড্যাশবোর্ড",
  homeNewCheck: "নতুন অসুস্থতা পরীক্ষা",
  homeHeatwave: "তাপপ্রবাহ রোগী তালিকা",
  homePatients: "আমার রোগীর তালিকা",
  homeReview: "ফার্মাসিস্ট / চিকিৎসক পর্যালোচনা",
  homeAbout: "সম্পর্কে ও সুরক্ষা তথ্য",
  safetyDisclaimer:
    "সিদ্ধান্ত সহায়তা সরঞ্জাম। চিকিৎসা যন্ত্র নয়। ডাক্তার ছাড়া কোনো ওষুধ পরিবর্তন করবেন না।",
  unsignedBadge: "অস্বাক্ষরিত নিয়ম — চিকিৎসক পর্যালোচনা প্রয়োজন",
  syntheticDataBanner: "⚠️ কৃত্রিম ডেমো ডেটা — বাস্তব রোগীর ডেটা নয়",
  patientToken: "রোগী টোকেন",
  patientAgeBand: "বয়সের দল",
  patientPregnant: "গর্ভবতী?",
  patientKidneyDisease: "কিডনি রোগ আছে?",
  patientLivesAlone: "একা বাস করেন?",
  patientWorksOutdoors: "বাইরে কাজ করেন?",
  patientCreatinine: "সর্বশেষ ক্রিয়েটিনিন (mg/dL)",
  patientEGFR: "সর্বশেষ eGFR",
  ageBandChild: "শিশু (১৮ বছরের নিচে)",
  ageBandAdult: "প্রাপ্তবয়স্ক (১৮–৬০ বছর)",
  ageBandElderly: "বৃদ্ধ (৬০ বছরের বেশি)",
  yes: "হ্যাঁ",
  no: "না",
  unknown: "অজানা",
  notSure: "নিশ্চিত নই",
  stepSymptoms: "অসুস্থতা কী?",
  symptomLooseMotions: "পাতলা পায়খানা / ডায়রিয়া",
  symptomVomiting: "বমি",
  symptomFever: "জ্বর",
  symptomNotEating: "খাচ্ছেন না / পানি পান করছেন না",
  symptomHotWeather: "অত্যন্ত গরম আবহাওয়া",
  symptomNone: "এর কোনটি নয়",
  symptomMicButton: "নিজের ভাষায় বলুন (কণ্ঠস্বর)",
  durationQuestion: "কত দিন ধরে?",
  ableToDrink: "রোগী কি তরল পান করতে ও রাখতে পারছেন?",
  urineQuestion: "গত ৮ ঘণ্টায় প্রস্রাব হয়েছে?",
  dizzinessQuestion: "মাথা ঘোরা বা জ্ঞান হারিয়েছে?",
  confusionQuestion: "বিভ্রান্তি বা অস্বাভাবিক আচরণ?",
  bloodInStool: "মলে রক্ত?",
  chestPain: "বুকে ব্যথা?",
  cannotKeepFluids: "এক দিনেরও বেশি তরল রাখতে পারছেন না?",
  stepMedicines: "রোগী কোন ওষুধ খান?",
  searchMedicine: "ওষুধের নাম খুঁজুন…",
  brandStatusVerified: "যাচাই করা হয়েছে",
  brandStatusUnsigned: "অস্বাক্ষরিত",
  brandStatusUnknown: "অজানা ব্র্যান্ড",
  brandStatusPendingReview: "পর্যালোচনা মুলতুবি",
  askAISuggest: "AI-কে ড্রাগ ক্লাস সাজেস্ট করতে বলুন",
  addManualClass: "ম্যানুয়ালি ক্লাস সেট করুন",
  resultUrgentBanner: "🚨 এখনই স্বাস্থ্যকেন্দ্রে যান",
  resultAskDoctorBanner: "⚠️ আজই ডাক্তারকে জিজ্ঞেস করুন",
  resultNoFlag: "✓ এখন কোনো ওষুধ পতাকা নেই",
  whyToggle: "কেন?",
  ruleId: "নিয়ম আইডি",
  ruleText: "নিয়ম",
  ruleStatus: "অবস্থা",
  copyMessage: "বার্তা কপি করুন",
  shareViaSMS: "SMS-এ শেয়ার করুন",
  shareViaWhatsApp: "WhatsApp-এ শেয়ার করুন",
  homeCareReminder: "বাড়িতে যত্ন: ORS দিন। অবস্থা খারাপ হলে সাহায্য নিন।",
  heatPageTitle: "তাপপ্রবাহ রোগী র‍্যাংকিং",
  heatIndex: "তাপ সূচক",
  heatDay: "তাপ দিন",
  notHeatDay: "তাপ দিন নয়",
  heatForecast: "৩-দিনের পূর্বাভাস",
  heatManualEntry: "ম্যানুয়াল তাপ স্তর এন্ট্রি",
  contactStatus: "যোগাযোগের অবস্থা",
  called: "ফোন করা হয়েছে",
  notReached: "যোগাযোগ হয়নি",
  riskScore: "ঝুঁকি স্কোর",
  whyThisRank: "এই র‍্যাংক কেন?",
  reviewPageTitle: "ফার্মাসিস্ট / চিকিৎসক পর্যালোচনা সারি",
  reviewPendingBrands: "মুলতুবি ব্র্যান্ড সাজেশন",
  reviewUnsignedRules: "অস্বাক্ষরিত নিয়ম",
  reviewApprove: "অনুমোদন করুন",
  reviewEdit: "সম্পাদনা করুন",
  reviewReject: "প্রত্যাখ্যান করুন",
  reviewerName: "পর্যালোচকের নাম",
  reviewedAt: "পর্যালোচনা করা হয়েছে",
  exportJSON: "JSON রপ্তানি করুন",
  exportCSV: "CSV রপ্তানি করুন",
  importCSV: "CSV আমদানি করুন",
  pinPrompt: "পর্যালোচক PIN লিখুন",
  evaluatePageTitle: "মূল্যায়ন হার্নেস",
  importVignettes: "ভিনেট CSV আমদানি করুন",
  runEvaluation: "মূল্যায়ন চালান",
  noDataYet: "এখনো কোনো ডেটা নেই — শুরু করতে ভিনেট CSV আমদানি করুন।",
  sensitivityLabel: "সংবেদনশীলতা (রিকল)",
  specificityLabel: "নির্দিষ্টতা",
  ppvLabel: "PPV (প্রিসিশন)",
  kappaLabel: "কোহেনের কাপ্পা",
  missedUrgent: "মিস হওয়া জরুরি কেস",
  exportResults: "ফলাফল CSV রপ্তানি করুন",
  aboutTitle: "সম্পর্কে ও সুরক্ষা",
  aboutLimits: "সীমাবদ্ধতা",
  aboutPrivacy: "গোপনীয়তা",
  aboutSources: "উৎস",
  aiUnavailable: "AI উপলব্ধ নয় — অনুগ্রহ করে ম্যানুয়ালি লিখুন।",
  offlineMode: "অফলাইন মোড — AI ফিচারের জন্য ইন্টারনেট দরকার।",
  syncPending: "সিঙ্ক মুলতুবি",
  syncNow: "এখন সিঙ্ক করুন",
  noVoice: "এই ডিভাইসে এই ভাষার জন্য কোনো কণ্ঠস্বর পাওয়া যায়নি।",
  loading: "লোড হচ্ছে…",
  save: "সংরক্ষণ করুন",
  cancel: "বাতিল করুন",
  back: "পিছনে",
  next: "পরবর্তী",
  confirm: "নিশ্চিত করুন",
  edit: "সম্পাদনা",
  delete: "মুছুন",
  deleteAll: "আমার সমস্ত ডেটা মুছুন",
  deleteConfirm: "আপনি কি নিশ্চিত? এটি ফেরানো যাবে না।",
  consentTitle: "ঔষধ প্রহরীতে স্বাগতম",
  consentBody:
    "এই অ্যাপটি শুধুমাত্র এই ডিভাইসে রোগীর চেক ডেটা সংরক্ষণ করে। কোনো নাম বা ফোন নম্বর প্রয়োজন নেই। আপনি যেকোনো সময় সেটিংস থেকে সমস্ত ডেটা মুছে ফেলতে পারবেন।",
  consentAccept: "আমি বুঝেছি — চালিয়ে যান",
  consentDecline: "কোনো ডেটা সংরক্ষণ করবেন না",
  fontScaleLabel: "টেক্সট আকার",
  langLabel: "ভাষা",
};

// ─── Hindi strings ─────────────────────────────────────────────────────────────

const STRINGS_HI: Strings = {
  appName: "औषध प्रहरी",
  appTagline: "CHO और ASHA के लिए दवा रक्षक",
  navHome: "होम",
  navCheck: "बीमारी जांच",
  navHeat: "लू की सूची",
  navPatients: "मरीज़ सूची",
  navReview: "समीक्षा कतार",
  navEvaluate: "मूल्यांकन",
  navAbout: "परिचय",
  navDashboard: "डैशबोर्ड",
  homeNewCheck: "नई बीमारी जांच",
  homeHeatwave: "लू मरीज़ सूची",
  homePatients: "मेरी मरीज़ सूची",
  homeReview: "फार्मासिस्ट / चिकित्सक समीक्षा",
  homeAbout: "परिचय और सुरक्षा जानकारी",
  safetyDisclaimer:
    "निर्णय सहायता उपकरण। चिकित्सा उपकरण नहीं। डॉक्टर के बिना कोई दवा न बदलें।",
  unsignedBadge: "अहस्ताक्षरित नियम — चिकित्सक समीक्षा आवश्यक",
  syntheticDataBanner: "⚠️ कृत्रिम डेमो डेटा — वास्तविक रोगी डेटा नहीं",
  patientToken: "मरीज़ टोकन",
  patientAgeBand: "आयु वर्ग",
  patientPregnant: "गर्भवती?",
  patientKidneyDisease: "गुर्दे की बीमारी?",
  patientLivesAlone: "अकेले रहते हैं?",
  patientWorksOutdoors: "बाहर काम करते हैं?",
  patientCreatinine: "नवीनतम क्रिएटिनिन (mg/dL)",
  patientEGFR: "नवीनतम eGFR",
  ageBandChild: "बच्चा (18 वर्ष से कम)",
  ageBandAdult: "वयस्क (18–60 वर्ष)",
  ageBandElderly: "बुजुर्ग (60 वर्ष से अधिक)",
  yes: "हाँ",
  no: "नहीं",
  unknown: "अज्ञात",
  notSure: "निश्चित नहीं",
  stepSymptoms: "बीमारी क्या है?",
  symptomLooseMotions: "दस्त / दस्त",
  symptomVomiting: "उल्टी",
  symptomFever: "बुखार",
  symptomNotEating: "खाना/पानी नहीं ले रहे",
  symptomHotWeather: "बहुत गर्म मौसम",
  symptomNone: "इनमें से कोई नहीं",
  symptomMicButton: "अपनी भाषा में बताएं (आवाज़)",
  durationQuestion: "कितने दिनों से?",
  ableToDrink: "क्या मरीज़ पानी पी और रख सकते हैं?",
  urineQuestion: "पिछले 8 घंटे में पेशाब हुआ?",
  dizzinessQuestion: "चक्कर या बेहोशी?",
  confusionQuestion: "भ्रम या असामान्य व्यवहार?",
  bloodInStool: "मल में खून?",
  chestPain: "सीने में दर्द?",
  cannotKeepFluids: "एक दिन से अधिक समय से तरल नहीं रख पा रहे?",
  stepMedicines: "मरीज़ कौन सी दवाइयाँ लेते हैं?",
  searchMedicine: "दवा का नाम खोजें…",
  brandStatusVerified: "सत्यापित",
  brandStatusUnsigned: "अहस्ताक्षरित",
  brandStatusUnknown: "अज्ञात ब्रांड",
  brandStatusPendingReview: "समीक्षा लंबित",
  askAISuggest: "AI से दवा वर्ग सुझाव मांगें",
  addManualClass: "मैन्युअल रूप से वर्ग सेट करें",
  resultUrgentBanner: "🚨 अभी स्वास्थ्य केंद्र जाएँ",
  resultAskDoctorBanner: "⚠️ आज ही डॉक्टर से पूछें",
  resultNoFlag: "✓ अभी कोई दवा चेतावनी नहीं",
  whyToggle: "क्यों?",
  ruleId: "नियम आईडी",
  ruleText: "नियम",
  ruleStatus: "स्थिति",
  copyMessage: "संदेश कॉपी करें",
  shareViaSMS: "SMS से शेयर करें",
  shareViaWhatsApp: "WhatsApp से शेयर करें",
  homeCareReminder: "घरेलू देखभाल: ORS दें। हालत बिगड़ने पर मदद लें।",
  heatPageTitle: "लू मरीज़ रैंकिंग",
  heatIndex: "ताप सूचकांक",
  heatDay: "लू का दिन",
  notHeatDay: "लू का दिन नहीं",
  heatForecast: "3-दिन का पूर्वानुमान",
  heatManualEntry: "मैन्युअल ताप स्तर प्रविष्टि",
  contactStatus: "संपर्क स्थिति",
  called: "फ़ोन किया",
  notReached: "संपर्क नहीं हुआ",
  riskScore: "जोखिम स्कोर",
  whyThisRank: "यह रैंक क्यों?",
  reviewPageTitle: "फार्मासिस्ट / चिकित्सक समीक्षा कतार",
  reviewPendingBrands: "लंबित ब्रांड सुझाव",
  reviewUnsignedRules: "अहस्ताक्षरित नियम",
  reviewApprove: "अनुमोदित करें",
  reviewEdit: "संपादित करें",
  reviewReject: "अस्वीकार करें",
  reviewerName: "समीक्षक नाम",
  reviewedAt: "समीक्षा की गई",
  exportJSON: "JSON निर्यात करें",
  exportCSV: "CSV निर्यात करें",
  importCSV: "CSV आयात करें",
  pinPrompt: "समीक्षक PIN दर्ज करें",
  evaluatePageTitle: "मूल्यांकन हार्नेस",
  importVignettes: "Vignette CSV आयात करें",
  runEvaluation: "मूल्यांकन चलाएं",
  noDataYet: "अभी तक कोई डेटा नहीं — शुरू करने के लिए vignette CSV आयात करें।",
  sensitivityLabel: "संवेदनशीलता (रिकॉल)",
  specificityLabel: "विशिष्टता",
  ppvLabel: "PPV (सटीकता)",
  kappaLabel: "कोहेन का कप्पा",
  missedUrgent: "चूके हुए जरूरी मामले",
  exportResults: "परिणाम CSV निर्यात करें",
  aboutTitle: "परिचय और सुरक्षा",
  aboutLimits: "सीमाएं",
  aboutPrivacy: "गोपनीयता",
  aboutSources: "स्रोत",
  aiUnavailable: "AI उपलब्ध नहीं — कृपया मैन्युअल रूप से दर्ज करें।",
  offlineMode: "ऑफ़लाइन मोड — AI सुविधाओं के लिए इंटरनेट चाहिए।",
  syncPending: "सिंक लंबित",
  syncNow: "अभी सिंक करें",
  noVoice: "इस डिवाइस पर इस भाषा के लिए कोई आवाज़ उपलब्ध नहीं।",
  loading: "लोड हो रहा है…",
  save: "सहेजें",
  cancel: "रद्द करें",
  back: "पीछे",
  next: "अगला",
  confirm: "पुष्टि करें",
  edit: "संपादित करें",
  delete: "हटाएं",
  deleteAll: "मेरा सारा डेटा हटाएं",
  deleteConfirm: "क्या आप सुनिश्चित हैं? यह पूर्ववत नहीं किया जा सकता।",
  consentTitle: "औषध प्रहरी में आपका स्वागत है",
  consentBody:
    "यह ऐप केवल इस डिवाइस पर मरीज़ चेक डेटा संग्रहीत करता है। कोई नाम या फोन नंबर आवश्यक नहीं। आप Settings से कभी भी सभी डेटा हटा सकते हैं।",
  consentAccept: "मैं समझता/समझती हूं — जारी रखें",
  consentDecline: "कोई डेटा संग्रहीत न करें",
  fontScaleLabel: "पाठ आकार",
  langLabel: "भाषा",
};

// ─── Registry and lookup ──────────────────────────────────────────────────────

const STRINGS: Record<Lang, Strings> = {
  en: STRINGS_EN,
  bn: STRINGS_BN,
  hi: STRINGS_HI,
};

const LANG_KEY = "ap_lang";

let currentLang: Lang = "bn";

export function getLanguage(): Lang {
  return currentLang;
}

export function setLanguage(lang: Lang): void {
  currentLang = lang;
  if (typeof window !== "undefined") {
    localStorage.setItem(LANG_KEY, lang);
  }
}

export function initLanguage(): void {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(LANG_KEY) as Lang | null;
  if (stored && STRINGS[stored]) {
    currentLang = stored;
  }
}

export function t(key: keyof Strings, lang?: Lang): string {
  const l = lang ?? currentLang;
  return STRINGS[l][key] ?? STRINGS_EN[key] ?? key;
}

// Helper for language labels
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
