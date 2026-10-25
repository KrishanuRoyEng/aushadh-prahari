/**
 * privacy.ts — Consent, token generation, data management
 * DPDP Act 2023 aligned.
 */

const CONSENT_KEY = "ap_consent_v1";
const REVIEWER_PIN_KEY = "ap_reviewer_pin";

// ─── Patient token ────────────────────────────────────────────────────────────

export function generateToken(): string {
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export const generatePatientToken = generateToken;

// ─── Consent ──────────────────────────────────────────────────────────────────

export type ConsentStatus = "accepted" | "declined" | "pending";

export function getConsentStatus(): ConsentStatus {
  if (typeof window === "undefined") return "pending";
  const stored = localStorage.getItem(CONSENT_KEY);
  if (stored === "accepted" || stored === "declined") return stored;
  return "pending";
}

export function setConsentStatus(status: "accepted" | "declined"): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, status);
}

// ─── Reviewer PIN (bcrypt not available server-side on client; use simple hash) ─

// NOTE: This uses a simple SHA-256 hash. Not bcrypt.
// Document: this is NOT strong authentication. A full deployment needs server auth.
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "ap_salt_v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function setReviewerPin(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  localStorage.setItem(REVIEWER_PIN_KEY, hash);
}

export async function verifyReviewerPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(REVIEWER_PIN_KEY);
  if (!stored) return false;
  const hash = await hashPin(pin);
  return hash === stored;
}

export function hasReviewerPin(): boolean {
  return !!localStorage.getItem(REVIEWER_PIN_KEY);
}

// ─── Font scale ───────────────────────────────────────────────────────────────

export type FontScale = 100 | 125 | 150;

export function getFontScale(): FontScale {
  if (typeof window === "undefined") return 100;
  const stored = localStorage.getItem("ap_font_scale");
  if (stored === "125") return 125;
  if (stored === "150") return 150;
  return 100;
}

export function setFontScale(scale: FontScale): void {
  localStorage.setItem("ap_font_scale", String(scale));
  document.documentElement.setAttribute("data-font-scale", String(scale));
}

export function applyFontScale(): void {
  const scale = getFontScale();
  document.documentElement.setAttribute("data-font-scale", String(scale));
}

// ─── MO phone number ──────────────────────────────────────────────────────────

export function getMOPhone(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("ap_mo_phone") ?? "";
}

export function setMOPhone(phone: string): void {
  localStorage.setItem("ap_mo_phone", phone);
}

export { deleteAllData } from "./db";
