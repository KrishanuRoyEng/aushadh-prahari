/**
 * db.ts — IndexedDB via `idb` with Demo Mode Isolation
 *
 * Stores: patients, checks, outbox (sync queue), pending review items.
 * No names or phone numbers required.
 *
 * Isolation Guarantee:
 * When Demo Mode is active, all operations interact with an isolated in-memory/localStorage
 * demo store so real patient records are NEVER touched or modified.
 */

import { openDB, type IDBPDatabase } from "idb";
import type { Patient, OutboxRecord, PendingReviewItem } from "./schemas";
import type { CheckInput, CheckResult } from "./schemas";
import { isDemoMode, getDemoStore, saveDemoStore, generateInitialDemoStore } from "./demo";

const DB_NAME = "aushadh-prahari";
const DB_VERSION = 1;

// ─── Schema ───────────────────────────────────────────────────────────────────

export interface CheckRecord {
  id: string;
  input: CheckInput;
  result: CheckResult;
  createdAt: string;
}

export interface ContactStatus {
  token: string;
  date: string; // YYYY-MM-DD
  status: "called" | "not_reached" | "none";
}

// ─── Open DB ──────────────────────────────────────────────────────────────────

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("patients")) {
          db.createObjectStore("patients", { keyPath: "token" });
        }
        if (!db.objectStoreNames.contains("checks")) {
          const checksStore = db.createObjectStore("checks", { keyPath: "id" });
          checksStore.createIndex("by_token", "input.patient.token");
          checksStore.createIndex("by_date", "createdAt");
        }
        if (!db.objectStoreNames.contains("outbox")) {
          db.createObjectStore("outbox", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("review_items")) {
          db.createObjectStore("review_items", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("contact_status")) {
          db.createObjectStore("contact_status", {
            keyPath: ["token", "date"],
          });
        }
      },
    });
  }
  return dbPromise;
}

// Helper to get or init demo store
function getActiveDemoStore() {
  let store = getDemoStore();
  if (!store) {
    store = generateInitialDemoStore();
    saveDemoStore(store);
  }
  return store;
}

// ─── Patients ─────────────────────────────────────────────────────────────────

export async function savePatient(patient: Patient): Promise<void> {
  if (isDemoMode()) {
    const store = getActiveDemoStore();
    const idx = store.patients.findIndex((p) => p.token === patient.token);
    if (idx >= 0) store.patients[idx] = patient;
    else store.patients.push(patient);
    saveDemoStore(store);
    return;
  }
  const db = await getDB();
  await db.put("patients", patient);
}

export async function getPatient(token: string): Promise<Patient | undefined> {
  if (isDemoMode()) {
    const store = getActiveDemoStore();
    return store.patients.find((p) => p.token === token);
  }
  const db = await getDB();
  return db.get("patients", token);
}

export async function getAllPatients(): Promise<Patient[]> {
  if (isDemoMode()) {
    const store = getActiveDemoStore();
    return store.patients;
  }
  const db = await getDB();
  return db.getAll("patients");
}

export async function deletePatient(token: string): Promise<void> {
  if (isDemoMode()) {
    const store = getActiveDemoStore();
    store.patients = store.patients.filter((p) => p.token !== token);
    saveDemoStore(store);
    return;
  }
  const db = await getDB();
  await db.delete("patients", token);
}

// ─── Checks ───────────────────────────────────────────────────────────────────

export async function saveCheck(record: CheckRecord): Promise<void> {
  if (isDemoMode()) {
    const store = getActiveDemoStore();
    const idx = store.checks.findIndex((c) => c.id === record.id);
    if (idx >= 0) store.checks[idx] = record;
    else store.checks.unshift(record);
    saveDemoStore(store);
    return;
  }
  const db = await getDB();
  await db.put("checks", record);
}

export async function getAllChecks(): Promise<CheckRecord[]> {
  if (isDemoMode()) {
    const store = getActiveDemoStore();
    return store.checks;
  }
  const db = await getDB();
  return db.getAll("checks");
}

export async function getChecksByToken(token: string): Promise<CheckRecord[]> {
  if (isDemoMode()) {
    const store = getActiveDemoStore();
    return store.checks.filter((c) => c.input.patient.token === token);
  }
  const db = await getDB();
  return db.getAllFromIndex("checks", "by_token", token);
}

export async function deleteCheck(id: string): Promise<void> {
  if (isDemoMode()) {
    const store = getActiveDemoStore();
    store.checks = store.checks.filter((c) => c.id !== id);
    saveDemoStore(store);
    return;
  }
  const db = await getDB();
  await db.delete("checks", id);
}

// ─── Outbox ───────────────────────────────────────────────────────────────────

export async function enqueue(record: OutboxRecord): Promise<void> {
  if (isDemoMode()) {
    return; // No real sync in demo mode
  }
  const db = await getDB();
  await db.put("outbox", record);
}

export async function getPendingOutbox(): Promise<OutboxRecord[]> {
  if (isDemoMode()) {
    return [];
  }
  const db = await getDB();
  const all = await db.getAll("outbox");
  return all.filter((r: OutboxRecord) => !r.synced);
}

export async function markSynced(id: string): Promise<void> {
  if (isDemoMode()) return;
  const db = await getDB();
  const record: OutboxRecord | undefined = await db.get("outbox", id);
  if (record) {
    record.synced = true;
    record.syncedAt = new Date().toISOString();
    await db.put("outbox", record);
  }
}

// ─── Review Items ─────────────────────────────────────────────────────────────

export async function savePendingReview(item: PendingReviewItem): Promise<void> {
  if (isDemoMode()) {
    const store = getActiveDemoStore();
    const idx = store.pendingReviews.findIndex((r) => r.id === item.id);
    if (idx >= 0) store.pendingReviews[idx] = item;
    else store.pendingReviews.unshift(item);
    saveDemoStore(store);
    return;
  }
  const db = await getDB();
  await db.put("review_items", item);
}

export async function getPendingReviews(): Promise<PendingReviewItem[]> {
  if (isDemoMode()) {
    const store = getActiveDemoStore();
    return store.pendingReviews.filter((r) => r.status === "pending");
  }
  const db = await getDB();
  const all = await db.getAll("review_items");
  return all.filter((r: PendingReviewItem) => r.status === "pending");
}

export async function getAllReviews(): Promise<PendingReviewItem[]> {
  if (isDemoMode()) {
    const store = getActiveDemoStore();
    return store.pendingReviews;
  }
  const db = await getDB();
  return db.getAll("review_items");
}

export async function updateReviewItem(item: PendingReviewItem): Promise<void> {
  if (isDemoMode()) {
    const store = getActiveDemoStore();
    const idx = store.pendingReviews.findIndex((r) => r.id === item.id);
    if (idx >= 0) store.pendingReviews[idx] = item;
    else store.pendingReviews.push(item);
    saveDemoStore(store);
    return;
  }
  const db = await getDB();
  await db.put("review_items", item);
}

// ─── Contact Status ───────────────────────────────────────────────────────────

export async function setContactStatus(cs: ContactStatus): Promise<void> {
  if (isDemoMode()) {
    const store = getActiveDemoStore();
    const idx = store.contactStatus.findIndex(
      (c) => c.token === cs.token && c.date === cs.date
    );
    if (idx >= 0) store.contactStatus[idx] = cs;
    else store.contactStatus.push(cs);
    saveDemoStore(store);
    return;
  }
  const db = await getDB();
  await db.put("contact_status", cs);
}

export async function getContactStatus(
  token: string,
  date: string
): Promise<ContactStatus | undefined> {
  if (isDemoMode()) {
    const store = getActiveDemoStore();
    return store.contactStatus.find(
      (c) => c.token === token && c.date === date
    );
  }
  const db = await getDB();
  return db.get("contact_status", [token, date]);
}

// ─── Delete All (DPDP Act compliance) ────────────────────────────────────────

export async function deleteAllData(): Promise<void> {
  // Close and delete the DB
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
  if (typeof indexedDB !== "undefined") {
    const req = indexedDB.deleteDatabase(DB_NAME);
    await new Promise<void>((resolve, reject) => {
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
  // Also clear localStorage keys belonging to this app
  if (typeof window !== "undefined") {
    const keysToRemove = Object.keys(localStorage).filter((k) =>
      k.startsWith("ap_")
    );
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }
}
