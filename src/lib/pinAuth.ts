/**
 * pinAuth.ts — Device-level PIN Authentication using Web Crypto PBKDF2
 *
 * NOTE: This is a device-level deterrent against accidental or unauthorized
 * access on shared CHW tablets, NOT real server-side authentication.
 *
 * Features:
 *  - PBKDF2-SHA256 salted hash (100,000 iterations)
 *  - First-time PIN setup (4-6 digits)
 *  - Wrong-PIN attempt counter (max 5)
 *  - 30-second lockout after 5 consecutive failures
 *  - Auto-lock after 5 minutes of inactivity
 *  - Change PIN flow
 */

const STORAGE_KEYS = {
  HASH: "ap_pin_hash",
  SALT: "ap_pin_salt",
  ATTEMPTS: "ap_pin_attempts",
  LOCKOUT: "ap_pin_lockout_until",
  SESSION: "ap_pin_session_active",
  LAST_ACTIVITY: "ap_pin_last_activity",
  REVIEWER_NAME: "ap_reviewer_name",
  REVIEWER_REG: "ap_reviewer_reg",
} as const;

export const PIN_CONFIG = {
  MIN_LENGTH: 4,
  MAX_LENGTH: 6,
  MAX_ATTEMPTS: 5,
  LOCKOUT_SECONDS: 30,
  AUTO_LOCK_MINUTES: 5,
  ITERATIONS: 100000,
};

// ─── Web Crypto PBKDF2 Helpers ───────────────────────────────────────────────

function getCrypto(): Crypto {
  if (typeof window !== "undefined" && window.crypto) {
    return window.crypto;
  }
  // Fallback for Node.js / test environments
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (globalThis.crypto || require("crypto").webcrypto) as Crypto;
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export async function hashPin(pin: string, saltBytes?: Uint8Array): Promise<{ hashHex: string; saltHex: string }> {
  const cryptoObj = getCrypto();
  const salt = saltBytes || cryptoObj.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const pinData = encoder.encode(pin);

  const baseKey = await cryptoObj.subtle.importKey(
    "raw",
    pinData,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await cryptoObj.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PIN_CONFIG.ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    256
  );

  return {
    hashHex: bufferToHex(derivedBits),
    saltHex: bufferToHex(salt.buffer as ArrayBuffer),
  };
}

function getStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== "undefined" && (globalThis as unknown as { localStorage?: Storage }).localStorage) {
    return (globalThis as unknown as { localStorage: Storage }).localStorage;
  }
  return null;
}

// ─── PIN State & Verification ────────────────────────────────────────────────

export function isPinSet(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  return Boolean(storage.getItem(STORAGE_KEYS.HASH));
}

export async function setPin(pin: string): Promise<{ success: boolean; error?: string }> {
  if (!/^\d{4,6}$/.test(pin)) {
    return { success: false, error: "PIN must be 4 to 6 digits" };
  }
  const { hashHex, saltHex } = await hashPin(pin);
  const storage = getStorage();
  if (storage) {
    storage.setItem(STORAGE_KEYS.HASH, hashHex);
    storage.setItem(STORAGE_KEYS.SALT, saltHex);
    storage.removeItem(STORAGE_KEYS.ATTEMPTS);
    storage.removeItem(STORAGE_KEYS.LOCKOUT);
    setSessionActive(true);
  }
  return { success: true };
}

export function getLockoutRemainingSeconds(): number {
  const storage = getStorage();
  if (!storage) return 0;
  const lockoutUntilStr = storage.getItem(STORAGE_KEYS.LOCKOUT);
  if (!lockoutUntilStr) return 0;
  const lockoutUntil = parseInt(lockoutUntilStr, 10);
  const now = Date.now();
  if (now >= lockoutUntil) {
    storage.removeItem(STORAGE_KEYS.LOCKOUT);
    storage.setItem(STORAGE_KEYS.ATTEMPTS, "0");
    return 0;
  }
  return Math.ceil((lockoutUntil - now) / 1000);
}

export function getFailedAttempts(): number {
  const storage = getStorage();
  if (!storage) return 0;
  return parseInt(storage.getItem(STORAGE_KEYS.ATTEMPTS) || "0", 10);
}

export async function verifyPin(
  pin: string
): Promise<{
  success: boolean;
  error?: "WRONG_PIN" | "LOCKED_OUT" | "NOT_SET";
  remainingAttempts?: number;
  lockoutSeconds?: number;
}> {
  if (!isPinSet()) {
    return { success: false, error: "NOT_SET" };
  }

  const storage = getStorage();
  if (!storage) return { success: false, error: "NOT_SET" };

  // Check lockout
  const remainingLockout = getLockoutRemainingSeconds();
  if (remainingLockout > 0) {
    return { success: false, error: "LOCKED_OUT", lockoutSeconds: remainingLockout };
  }

  const storedHash = storage.getItem(STORAGE_KEYS.HASH)!;
  const storedSaltHex = storage.getItem(STORAGE_KEYS.SALT)!;
  const saltBytes = hexToBytes(storedSaltHex);

  const { hashHex } = await hashPin(pin, saltBytes);

  if (hashHex === storedHash) {
    // Reset failures on success
    storage.removeItem(STORAGE_KEYS.ATTEMPTS);
    storage.removeItem(STORAGE_KEYS.LOCKOUT);
    setSessionActive(true);
    return { success: true };
  } else {
    // Increment failures
    const attempts = getFailedAttempts() + 1;
    storage.setItem(STORAGE_KEYS.ATTEMPTS, attempts.toString());

    if (attempts >= PIN_CONFIG.MAX_ATTEMPTS) {
      const lockoutUntil = Date.now() + PIN_CONFIG.LOCKOUT_SECONDS * 1000;
      storage.setItem(STORAGE_KEYS.LOCKOUT, lockoutUntil.toString());
      return {
        success: false,
        error: "LOCKED_OUT",
        lockoutSeconds: PIN_CONFIG.LOCKOUT_SECONDS,
      };
    }

    return {
      success: false,
      error: "WRONG_PIN",
      remainingAttempts: PIN_CONFIG.MAX_ATTEMPTS - attempts,
    };
  }
}

export async function changePin(
  oldPin: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  const verifyRes = await verifyPin(oldPin);
  if (!verifyRes.success) {
    return { success: false, error: "Current PIN is incorrect" };
  }
  return setPin(newPin);
}

// ─── Session & Inactivity Auto-Lock ──────────────────────────────────────────

export function isSessionActive(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  const active = storage.getItem(STORAGE_KEYS.SESSION) === "true";
  if (!active) return false;

  const lastActivityStr = storage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
  if (lastActivityStr) {
    const lastActivity = parseInt(lastActivityStr, 10);
    const maxInactiveMs = PIN_CONFIG.AUTO_LOCK_MINUTES * 60 * 1000;
    if (Date.now() - lastActivity > maxInactiveMs) {
      lockSession();
      return false;
    }
  }
  return true;
}

export function setSessionActive(active: boolean): void {
  const storage = getStorage();
  if (!storage) return;
  if (active) {
    storage.setItem(STORAGE_KEYS.SESSION, "true");
    touchActivity();
  } else {
    lockSession();
  }
}

export function lockSession(): void {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(STORAGE_KEYS.SESSION);
  storage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
}

export function touchActivity(): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
}

// ─── Reviewer Profile ────────────────────────────────────────────────────────

export function getSavedReviewer(): { name: string; reg: string } {
  const storage = getStorage();
  if (!storage) {
    return { name: "", reg: "" };
  }
  return {
    name: storage.getItem(STORAGE_KEYS.REVIEWER_NAME) || "",
    reg: storage.getItem(STORAGE_KEYS.REVIEWER_REG) || "",
  };
}

export function saveReviewer(name: string, reg: string): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEYS.REVIEWER_NAME, name.trim());
  storage.setItem(STORAGE_KEYS.REVIEWER_REG, reg.trim());
}
