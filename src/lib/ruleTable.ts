/**
 * RULE TABLE — Sick-Day & Heatwave Rules
 *
 * ⚠️  ALL RULES ARE UNSIGNED PLACEHOLDERS.
 * ⚠️  Source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist"
 * ⚠️  signedOff: false for every rule.
 * ⚠️  No rule may contain: stop, skip, reduce, hold, do not take (EN),
 *     বন্ধ করুন, ছেড়ে দিন, কমিয়ে দিন (BN),
 *     बंद करें, छोड़ें, कम करें (HI).
 *     This is enforced by bannedWords.test.ts.
 */

import type { Rule } from "./schemas";

export const RULES: Rule[] = [
  // ─── RED FLAGS (GO_TO_HEALTH_FACILITY_NOW) ───────────────────────────────

  {
    id: "RF-001",
    appliesToClasses: [
      "ace_inhibitor", "arb", "diuretic_loop", "diuretic_thiazide",
      "metformin", "sglt2_inhibitor", "sulfonylurea", "nsaid", "other", "unknown",
    ],
    whenIllness: [],
    whenExtra: { child: true },
    action: "GO_TO_HEALTH_FACILITY_NOW",
    text: {
      bn: "শিশু রোগী — এখনই স্বাস্থ্যকেন্দ্রে যান।",
      hi: "बच्चा रोगी — अभी स्वास्थ्य केंद्र जाएँ।",
      en: "Child patient — go to health facility now.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
  {
    id: "RF-002",
    appliesToClasses: [
      "ace_inhibitor", "arb", "diuretic_loop", "diuretic_thiazide",
      "metformin", "sglt2_inhibitor", "sulfonylurea", "nsaid", "other", "unknown",
    ],
    whenIllness: [],
    whenExtra: { pregnant: true },
    action: "GO_TO_HEALTH_FACILITY_NOW",
    text: {
      bn: "গর্ভবতী রোগী, অসুস্থতা — এখনই স্বাস্থ্যকেন্দ্রে যান।",
      hi: "गर्भवती रोगी, बीमारी — अभी स्वास्थ्य केंद्र जाएँ।",
      en: "Pregnant patient with illness — go to health facility now.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
  {
    id: "RF-003",
    appliesToClasses: [
      "ace_inhibitor", "arb", "diuretic_loop", "diuretic_thiazide",
      "metformin", "sglt2_inhibitor", "sulfonylurea", "nsaid", "other", "unknown",
    ],
    whenIllness: ["loose_motions", "vomiting", "fever", "not_eating_drinking"],
    action: "GO_TO_HEALTH_FACILITY_NOW",
    text: {
      bn: "৮ ঘণ্টায় প্রস্রাব নেই — এখনই স্বাস্থ্যকেন্দ্রে যান।",
      hi: "8 घंटे से पेशाब नहीं — अभी स्वास्थ्य केंद्र जाएँ।",
      en: "No urine in 8 hours — go to health facility now.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
  {
    id: "RF-004",
    appliesToClasses: [
      "ace_inhibitor", "arb", "diuretic_loop", "diuretic_thiazide",
      "metformin", "sglt2_inhibitor", "sulfonylurea", "nsaid", "other", "unknown",
    ],
    whenIllness: ["loose_motions", "vomiting", "fever", "not_eating_drinking"],
    action: "GO_TO_HEALTH_FACILITY_NOW",
    text: {
      bn: "মাথা ঘোরা বা জ্ঞান হারানো — এখনই স্বাস্থ্যকেন্দ্রে যান।",
      hi: "चक्कर या बेहोशी — अभी स्वास्थ्य केंद्र जाएँ।",
      en: "Dizziness or fainting — go to health facility now.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
  {
    id: "RF-005",
    appliesToClasses: [
      "ace_inhibitor", "arb", "diuretic_loop", "diuretic_thiazide",
      "metformin", "sglt2_inhibitor", "sulfonylurea", "nsaid", "other", "unknown",
    ],
    whenIllness: ["loose_motions", "vomiting", "fever", "not_eating_drinking"],
    action: "GO_TO_HEALTH_FACILITY_NOW",
    text: {
      bn: "বিভ্রান্তি বা অচেতনতা — এখনই স্বাস্থ্যকেন্দ্রে যান।",
      hi: "भ्रम या चेतनाहीनता — अभी स्वास्थ्य केंद्र जाएँ।",
      en: "Confusion or altered consciousness — go to health facility now.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
  {
    id: "RF-006",
    appliesToClasses: [
      "ace_inhibitor", "arb", "diuretic_loop", "diuretic_thiazide",
      "metformin", "sglt2_inhibitor", "sulfonylurea", "nsaid", "other", "unknown",
    ],
    whenIllness: ["loose_motions"],
    action: "GO_TO_HEALTH_FACILITY_NOW",
    text: {
      bn: "মলে রক্ত — এখনই স্বাস্থ্যকেন্দ্রে যান।",
      hi: "मल में खून — अभी स्वास्थ्य केंद्र जाएँ।",
      en: "Blood in stool — go to health facility now.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
  {
    id: "RF-007",
    appliesToClasses: [
      "ace_inhibitor", "arb", "diuretic_loop", "diuretic_thiazide",
      "metformin", "sglt2_inhibitor", "sulfonylurea", "nsaid", "other", "unknown",
    ],
    whenIllness: ["loose_motions", "vomiting", "fever", "not_eating_drinking"],
    action: "GO_TO_HEALTH_FACILITY_NOW",
    text: {
      bn: "বুকে ব্যথা — এখনই স্বাস্থ্যকেন্দ্রে যান।",
      hi: "सीने में दर्द — अभी स्वास्थ्य केंद्र जाएँ।",
      en: "Chest pain — go to health facility now.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
  {
    id: "RF-008",
    appliesToClasses: [
      "ace_inhibitor", "arb", "diuretic_loop", "diuretic_thiazide",
      "metformin", "sglt2_inhibitor", "sulfonylurea", "nsaid", "other", "unknown",
    ],
    whenIllness: ["vomiting", "loose_motions", "not_eating_drinking"],
    action: "GO_TO_HEALTH_FACILITY_NOW",
    text: {
      bn: "এক দিনেরও বেশি সময় ধরে তরল রাখতে পারছেন না — এখনই স্বাস্থ্যকেন্দ্রে যান।",
      hi: "एक दिन से अधिक समय से तरल नहीं रख पा रहे — अभी स्वास्थ्य केंद्र जाएँ।",
      en: "Cannot keep fluids down for more than a day — go to health facility now.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },

  // ─── SICK-DAY / DEHYDRATION RULES (ASK_DOCTOR_TODAY) ────────────────────

  {
    id: "SD-001",
    appliesToClasses: ["metformin"],
    whenIllness: ["loose_motions", "vomiting", "fever", "not_eating_drinking"],
    action: "ASK_DOCTOR_TODAY",
    text: {
      bn: "পানিশূন্যতা বা জ্বরের সাথে মেটফর্মিন — আজই ডাক্তারকে জিজ্ঞেস করুন।",
      hi: "निर्जलीकरण या बुखार के साथ मेटफॉर्मिन — आज ही डॉक्टर से पूछें।",
      en: "Metformin during illness with dehydration/fever risk — ask the doctor today.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
  {
    id: "SD-002",
    appliesToClasses: ["ace_inhibitor"],
    whenIllness: ["loose_motions", "vomiting", "fever", "not_eating_drinking"],
    action: "ASK_DOCTOR_TODAY",
    text: {
      bn: "পানিশূন্যতার ঝুঁকিতে ACE ইনহিবিটর — আজই ডাক্তারকে জিজ্ঞেস করুন।",
      hi: "निर्जलीकरण के जोखिम में ACE अवरोधक — आज ही डॉक्टर से पूछें।",
      en: "ACE inhibitor during illness with dehydration risk — ask the doctor today.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
  {
    id: "SD-003",
    appliesToClasses: ["arb"],
    whenIllness: ["loose_motions", "vomiting", "fever", "not_eating_drinking"],
    action: "ASK_DOCTOR_TODAY",
    text: {
      bn: "পানিশূন্যতার ঝুঁকিতে ARB — আজই ডাক্তারকে জিজ্ঞেস করুন।",
      hi: "निर्जलीकरण के जोखिम में ARB — आज ही डॉक्टर से पूछें।",
      en: "ARB during illness with dehydration risk — ask the doctor today.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
  {
    id: "SD-004",
    appliesToClasses: ["diuretic_loop"],
    whenIllness: ["loose_motions", "vomiting", "fever", "not_eating_drinking"],
    action: "ASK_DOCTOR_TODAY",
    text: {
      bn: "পানিশূন্যতার ঝুঁকিতে লুপ ডাইউরেটিক — আজই ডাক্তারকে জিজ্ঞেস করুন।",
      hi: "निर्जलीकरण के जोखिम में लूप डाइयूरेटिक — आज ही डॉक्टर से पूछें।",
      en: "Loop diuretic during illness with dehydration risk — ask the doctor today.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
  {
    id: "SD-005",
    appliesToClasses: ["diuretic_thiazide"],
    whenIllness: ["loose_motions", "vomiting", "fever", "not_eating_drinking"],
    action: "ASK_DOCTOR_TODAY",
    text: {
      bn: "পানিশূন্যতার ঝুঁকিতে থায়াজাইড ডাইউরেটিক — আজই ডাক্তারকে জিজ্ঞেস করুন।",
      hi: "निर्जलीकरण के जोखिम में थाइयाज़ाइड डाइयूरेटिक — आज ही डॉक्टर से पूछें।",
      en: "Thiazide diuretic during illness with dehydration risk — ask the doctor today.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
  {
    id: "SD-006",
    appliesToClasses: ["sglt2_inhibitor"],
    whenIllness: ["loose_motions", "vomiting", "fever", "not_eating_drinking"],
    action: "ASK_DOCTOR_TODAY",
    text: {
      bn: "পানিশূন্যতার ঝুঁকিতে SGLT2 ইনহিবিটর — আজই ডাক্তারকে জিজ্ঞেস করুন।",
      hi: "निर्जलीकरण के जोखिम में SGLT2 अवरोधक — आज ही डॉक्टर से पूछें।",
      en: "SGLT2 inhibitor during illness with dehydration risk — ask the doctor today.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
  {
    id: "SD-007",
    appliesToClasses: ["nsaid"],
    whenIllness: ["loose_motions", "vomiting", "fever", "not_eating_drinking"],
    action: "ASK_DOCTOR_TODAY",
    text: {
      bn: "পানিশূন্যতার ঝুঁকিতে NSAID — আজই ডাক্তারকে জিজ্ঞেস করুন।",
      hi: "निर्जलीकरण के जोखिम में NSAID — आज ही डॉक्टर से पूछें।",
      en: "NSAID during illness with dehydration risk — ask the doctor today.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
  {
    id: "SD-008",
    appliesToClasses: ["sulfonylurea"],
    whenIllness: ["fever", "not_eating_drinking", "vomiting", "loose_motions"],
    action: "ASK_DOCTOR_TODAY",
    text: {
      bn: "খাওয়া না হলে বা অসুস্থতায় সালফোনিলুরিয়া — আজই ডাক্তারকে জিজ্ঞেস করুন।",
      hi: "भोजन न खाने पर या बीमारी में सल्फोनीलयूरिया — आज ही डॉक्टर से पूछें।",
      en: "Sulfonylurea when not eating or during illness — ask the doctor today.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
  {
    id: "SD-009",
    appliesToClasses: ["metformin", "ace_inhibitor", "arb", "nsaid"],
    whenIllness: ["loose_motions", "vomiting", "fever", "not_eating_drinking"],
    whenExtra: { kidneyDisease: true },
    action: "ASK_DOCTOR_TODAY",
    text: {
      bn: "কিডনি রোগে পানিশূন্যতার ঝুঁকি বেশি — আজই ডাক্তারকে জিজ্ঞেস করুন।",
      hi: "गुर्दे की बीमारी में निर्जलीकरण का अधिक जोखिम — आज ही डॉक्टर से पूछें।",
      en: "Known kidney disease increases dehydration risk — ask the doctor today.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },

  // ─── HEATWAVE RULES ──────────────────────────────────────────────────────

  {
    id: "HW-001",
    appliesToClasses: ["diuretic_loop", "diuretic_thiazide"],
    whenIllness: ["very_hot_weather"],
    whenHeat: true,
    action: "ASK_DOCTOR_TODAY",
    text: {
      bn: "তীব্র গরমে ডাইউরেটিক — আজই ডাক্তারকে জিজ্ঞেস করুন।",
      hi: "तीव्र गर्मी में डाइयूरेटिक — आज ही डॉक्टर से पूछें।",
      en: "Diuretic during heatwave — ask the doctor today.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
  {
    id: "HW-002",
    appliesToClasses: ["ace_inhibitor"],
    whenIllness: ["very_hot_weather"],
    whenHeat: true,
    action: "ASK_DOCTOR_TODAY",
    text: {
      bn: "তীব্র গরমে ACE ইনহিবিটর — আজই ডাক্তারকে জিজ্ঞেস করুন।",
      hi: "तीव्र गर्मी में ACE अवरोधक — आज ही डॉक्टर से पूछें।",
      en: "ACE inhibitor during heatwave — ask the doctor today.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
  {
    id: "HW-003",
    appliesToClasses: ["arb"],
    whenIllness: ["very_hot_weather"],
    whenHeat: true,
    action: "ASK_DOCTOR_TODAY",
    text: {
      bn: "তীব্র গরমে ARB — আজই ডাক্তারকে জিজ্ঞেস করুন।",
      hi: "तीव्र गर्मी में ARB — आज ही डॉक्टर से पूछें।",
      en: "ARB during heatwave — ask the doctor today.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
  {
    id: "HW-004",
    appliesToClasses: ["sglt2_inhibitor"],
    whenIllness: ["very_hot_weather"],
    whenHeat: true,
    action: "ASK_DOCTOR_TODAY",
    text: {
      bn: "তীব্র গরমে SGLT2 ইনহিবিটর — আজই ডাক্তারকে জিজ্ঞেস করুন।",
      hi: "तीव्र गर्मी में SGLT2 अवरোधक — आज ही डॉक्टर से पूछें।",
      en: "SGLT2 inhibitor during heatwave — ask the doctor today.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
  {
    id: "HW-005",
    appliesToClasses: ["metformin"],
    whenIllness: ["very_hot_weather"],
    whenHeat: true,
    whenExtra: { kidneyDisease: true },
    action: "ASK_DOCTOR_TODAY",
    text: {
      bn: "তীব্র গরমে কিডনি রোগীর মেটফর্মিন — আজই ডাক্তারকে জিজ্ঞেস করুন।",
      hi: "तीव्र गर्मी में गुर्दे की बीमारी में मेटफॉर्मिन — आज ही डॉक्टर से पूछें।",
      en: "Metformin with kidney disease during heatwave — ask the doctor today.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },

  // ─── UNKNOWN MEDICINE ─────────────────────────────────────────────────────

  {
    id: "UK-001",
    appliesToClasses: ["unknown"],
    whenIllness: ["loose_motions", "vomiting", "fever", "not_eating_drinking", "very_hot_weather"],
    action: "ASK_DOCTOR_TODAY",
    text: {
      bn: "অজানা ওষুধ — আজই ডাক্তারকে জিজ্ঞেস করুন।",
      hi: "अज्ञात दवा — आज ही डॉक्टर से पूछें।",
      en: "Unknown medicine — ask the doctor today.",
    },
    source: "PLACEHOLDER - TO BE VERIFIED by physician/pharmacist",
    signedOff: false,
  },
];

export default RULES;
