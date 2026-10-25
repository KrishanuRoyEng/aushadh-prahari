/**
 * message.ts — MO Message Builder
 *
 * Builds a ≤300-character message for the Medical Officer.
 * Never tells patient to stop/change medicines.
 * Wording: "Ask the doctor today about: <medicine>"
 */

import type { CheckResult, ParsedSymptoms, Patient } from "./schemas";

export interface MessageInput {
  patient: Patient;
  symptoms: ParsedSymptoms;
  result: CheckResult;
  isHeatDay: boolean;
  timestamp: string;
  moPhoneNumber?: string; // optional, for SMS/WhatsApp links
}

export interface BuiltMessage {
  text: string;
  truncated: boolean;
  totalFlagged: number;
  smsLink: string;
  whatsappLink: string;
}

const MAX_CHARS = 300;

// Illness labels (short, for message)
const ILLNESS_SHORT: Record<string, string> = {
  loose_motions: "diarrhoea",
  vomiting: "vomiting",
  fever: "fever",
  not_eating_drinking: "not eating/drinking",
  very_hot_weather: "heat exposure",
  none: "",
};

export function buildMOMessage(input: MessageInput): BuiltMessage {
  const { patient, symptoms, result, isHeatDay, timestamp } = input;
  const date = new Date(timestamp).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
  const time = new Date(timestamp).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Summarise illness
  const activeSymptoms = symptoms.symptoms.value
    .filter((s) => s !== "none")
    .map((s) => ILLNESS_SHORT[s] ?? s)
    .join(", ");

  const illnessStr = activeSymptoms || (isHeatDay ? "heat exposure" : "illness");

  // Collect medicines needing review
  const flaggedMeds = result.perMedicine.filter(
    (m) => m.flag === "ASK_DOCTOR_TODAY" || m.flag === "GO_TO_HEALTH_FACILITY_NOW"
  );

  const totalFlagged = flaggedMeds.length;

  // Core message parts
  const urgencyLabel =
    result.urgency === "GO_TO_HEALTH_FACILITY_NOW"
      ? "🚨 URGENT"
      : result.urgency === "ASK_DOCTOR_TODAY"
      ? "⚠️ REVIEW TODAY"
      : "✓ LOW RISK";

  const patientInfo = `Pt: ${patient.token} (${patient.ageBand}, ${isHeatDay ? "heatwave" : ""})`;
  const illnessInfo = `Illness: ${illnessStr}`;

  // Build medicine list, truncate if needed
  let medList = "";
  let truncated = false;
  let includedCount = 0;

  for (let i = 0; i < flaggedMeds.length; i++) {
    const m = flaggedMeds[i];
    const medStr = `${m.brand}(${m.classes.join("+")}), `;
    const candidate =
      `${urgencyLabel}\n${patientInfo}\n${illnessInfo}\nAsk Dr today: ${medList}${medStr}${date} ${time}`;
    if (candidate.length > MAX_CHARS && i > 0) {
      medList += `+${flaggedMeds.length - i} more`;
      truncated = true;
      break;
    }
    medList += medStr;
    includedCount++;
  }

  if (includedCount === flaggedMeds.length && medList.endsWith(", ")) {
    medList = medList.slice(0, -2);
  }

  const medSection =
    totalFlagged > 0
      ? `Ask Dr today: ${medList}`
      : "No medicine flags at this time";

  let text = `${urgencyLabel}\n${patientInfo}\n${illnessInfo}\n${medSection}\n${date} ${time}`;

  // Final safety check on length
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS - 1) + "…";
    truncated = true;
  }

  // Build links
  const encoded = encodeURIComponent(text);
  const phone = input.moPhoneNumber?.replace(/\D/g, "") ?? "";
  const smsLink = phone ? `sms:${phone}?body=${encoded}` : `sms:?body=${encoded}`;
  const whatsappLink = phone
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  return { text, truncated, totalFlagged, smsLink, whatsappLink };
}
