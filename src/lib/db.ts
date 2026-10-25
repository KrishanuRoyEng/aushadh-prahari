/**
 * db.ts — IndexedDB via `idb`
 *
 * Stores: patients, checks, outbox (sync queue), pending review items.
 * No names or phone numbers required.
 */

import { openDB, type IDBPDatabase } from "idb";
import type { Patient, OutboxRecord, PendingReviewItem } from "./schemas";
import type { CheckInput, CheckResult } from "./schemas";

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

// ─── Patients ─────────────────────────────────────────────────────────────────

export async function savePatient(patient: Patient): Promise<void> {
  const db = await getDB();
  await db.put("patients", patient);
}

export async function getPatient(token: string): Promise<Patient | undefined> {
  const db = await getDB();
  return db.get("patients", token);
}

export async function getAllPatients(): Promise<Patient[]> {
  const db = await getDB();
  return db.getAll("patients");
}

export async function deletePatient(token: string): Promise<void> {
  const db = await getDB();
  await db.delete("patients", token);
}

// ─── Checks ───────────────────────────────────────────────────────────────────

export async function saveCheck(record: CheckRecord): Promise<void> {
  const db = await getDB();
  await db.put("checks", record);
}

export async function getAllChecks(): Promise<CheckRecord[]> {
  const db = await getDB();
  return db.getAll("checks");
}

export async function getChecksByToken(token: string): Promise<CheckRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex("checks", "by_token", token);
}

export async function deleteCheck(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("checks", id);
}

// ─── Outbox ───────────────────────────────────────────────────────────────────

export async function enqueue(record: OutboxRecord): Promise<void> {
  const db = await getDB();
  await db.put("outbox", record);
}

export async function getPendingOutbox(): Promise<OutboxRecord[]> {
  const db = await getDB();
  const all = await db.getAll("outbox");
  return all.filter((r: OutboxRecord) => !r.synced);
}

export async function markSynced(id: string): Promise<void> {
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
  const db = await getDB();
  await db.put("review_items", item);
}

export async function getPendingReviews(): Promise<PendingReviewItem[]> {
  const db = await getDB();
  const all = await db.getAll("review_items");
  return all.filter((r: PendingReviewItem) => r.status === "pending");
}

export async function getAllReviews(): Promise<PendingReviewItem[]> {
  const db = await getDB();
  return db.getAll("review_items");
}

export async function updateReviewItem(item: PendingReviewItem): Promise<void> {
  const db = await getDB();
  await db.put("review_items", item);
}

// ─── Contact Status ───────────────────────────────────────────────────────────

export async function setContactStatus(cs: ContactStatus): Promise<void> {
  const db = await getDB();
  await db.put("contact_status", cs);
}

export async function getContactStatus(token: string, date: string): Promise<ContactStatus | undefined> {
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
  const req = indexedDB.deleteDatabase(DB_NAME);
  await new Promise<void>((resolve, reject) => {
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  // Also clear localStorage keys belonging to this app
  if (typeof window !== "undefined") {
    const keysToRemove = Object.keys(localStorage).filter((k) => k.startsWith("ap_"));
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }
}
