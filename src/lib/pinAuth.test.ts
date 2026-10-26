import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  hashPin,
  setPin,
  verifyPin,
  changePin,
  isPinSet,
  isSessionActive,
  lockSession,
  touchActivity,
  getLockoutRemainingSeconds,
  PIN_CONFIG,
} from "./pinAuth";

// Mock localStorage in memory
const memoryStorage: Record<string, string> = {};
beforeEach(() => {
  for (const k in memoryStorage) delete memoryStorage[k];
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => memoryStorage[k] ?? null,
    setItem: (k: string, v: string) => {
      memoryStorage[k] = v;
    },
    removeItem: (k: string) => {
      delete memoryStorage[k];
    },
    clear: () => {
      for (const k in memoryStorage) delete memoryStorage[k];
    },
  });
});

describe("pinAuth — PBKDF2 Hashing and Verification", () => {
  it("generates deterministic hash with fixed salt", async () => {
    const salt = new Uint8Array(16).fill(7);
    const { hashHex: h1, saltHex: s1 } = await hashPin("1234", salt);
    const { hashHex: h2, saltHex: s2 } = await hashPin("1234", salt);
    expect(h1).toBe(h2);
    expect(s1).toBe(s2);
    expect(h1.length).toBe(64); // 256 bits = 64 hex chars
  });

  it("fails setPin if PIN is not 4-6 digits", async () => {
    const r1 = await setPin("12");
    expect(r1.success).toBe(false);
    const r2 = await setPin("1234567");
    expect(r2.success).toBe(false);
    const r3 = await setPin("abcd");
    expect(r3.success).toBe(false);
  });

  it("sets a valid PIN and verifies successfully", async () => {
    expect(isPinSet()).toBe(false);
    const res = await setPin("5678");
    expect(res.success).toBe(true);
    expect(isPinSet()).toBe(true);

    const checkCorrect = await verifyPin("5678");
    expect(checkCorrect.success).toBe(true);
    expect(isSessionActive()).toBe(true);
  });

  it("tracks failed attempts and enforces 30s lockout after 5 failures", async () => {
    await setPin("9999");

    // Fail 4 times
    for (let i = 1; i <= 4; i++) {
      const res = await verifyPin("0000");
      expect(res.success).toBe(false);
      expect(res.error).toBe("WRONG_PIN");
      expect(res.remainingAttempts).toBe(PIN_CONFIG.MAX_ATTEMPTS - i);
    }

    // 5th failure triggers lockout
    const res5 = await verifyPin("0000");
    expect(res5.success).toBe(false);
    expect(res5.error).toBe("LOCKED_OUT");
    expect(res5.lockoutSeconds).toBe(30);
    expect(getLockoutRemainingSeconds()).toBeGreaterThan(0);

    // Any attempt while locked out is rejected immediately
    const resDuringLockout = await verifyPin("9999");
    expect(resDuringLockout.success).toBe(false);
    expect(resDuringLockout.error).toBe("LOCKED_OUT");
  });

  it("supports changing PIN", async () => {
    await setPin("1111");
    const changeFail = await changePin("0000", "2222");
    expect(changeFail.success).toBe(false);

    const changeSuccess = await changePin("1111", "2222");
    expect(changeSuccess.success).toBe(true);

    const verifyOld = await verifyPin("1111");
    expect(verifyOld.success).toBe(false);

    const verifyNew = await verifyPin("2222");
    expect(verifyNew.success).toBe(true);
  });

  it("auto-locks session after 5 minutes of inactivity", async () => {
    await setPin("4321");
    touchActivity();
    expect(isSessionActive()).toBe(true);

    // Simulate 6 minutes passing
    const pastTime = Date.now() - 6 * 60 * 1000;
    memoryStorage["ap_pin_last_activity"] = pastTime.toString();

    expect(isSessionActive()).toBe(false);
    // Explicit lockSession
    lockSession();
    expect(isSessionActive()).toBe(false);
  });
});
