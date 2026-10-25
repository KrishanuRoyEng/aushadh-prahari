/**
 * bannedWords.test.ts
 *
 * Lint test: scans all rule texts for banned wording.
 * Fails if any rule text contains words indicating "stop/skip/reduce/hold a medicine".
 * This enforces the non-negotiable safety rule #2.
 */

import { describe, it, expect } from "vitest";
import RULES from "./ruleTable";
import { SAFETY_DISCLAIMER } from "./rules";

// ─── Banned word lists (all languages) ───────────────────────────────────────

const BANNED_ENGLISH = [
  "stop",
  "skip",
  "reduce",
  "hold",
  "do not take",
  "don't take",
  "discontinue",
  "withhold",
  "omit",
];

const BANNED_BENGALI = [
  "বন্ধ করুন",
  "ছেড়ে দিন",
  "কমিয়ে দিন",
  "খাবেন না",
  "বাদ দিন",
  "নেবেন না",
];

const BANNED_HINDI = [
  "बंद करें",
  "छोड़ें",
  "कम करें",
  "मत लें",
  "बंद कर दें",
  "रोकें",
];

const ALL_BANNED = [...BANNED_ENGLISH, ...BANNED_BENGALI, ...BANNED_HINDI];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("bannedWords — rule text safety lint", () => {
  for (const rule of RULES) {
    const texts = [rule.text.en, rule.text.bn, rule.text.hi];
    const allText = texts.join(" ").toLowerCase();

    it(`Rule ${rule.id}: no banned wording`, () => {
      for (const banned of ALL_BANNED) {
        const found = allText.includes(banned.toLowerCase());
        expect(
          found,
          `Rule ${rule.id} contains banned phrase "${banned}" in text: ${texts.join(" | ")}`
        ).toBe(false);
      }
    });
  }

  it("SAFETY_DISCLAIMER does not contain banned wording", () => {
    const lower = SAFETY_DISCLAIMER.toLowerCase();
    for (const banned of BANNED_ENGLISH) {
      expect(
        lower.includes(banned.toLowerCase()),
        `SAFETY_DISCLAIMER contains banned phrase "${banned}"`
      ).toBe(false);
    }
  });

  it("All rules have signedOff: false (placeholder enforcement)", () => {
    for (const rule of RULES) {
      expect(
        rule.signedOff,
        `Rule ${rule.id} has signedOff:true — should be false until clinician review`
      ).toBe(false);
    }
  });

  it("All rules have a source string containing PLACEHOLDER or TO BE VERIFIED", () => {
    for (const rule of RULES) {
      const hasPlaceholder =
        rule.source.includes("PLACEHOLDER") ||
        rule.source.includes("TO BE VERIFIED");
      expect(
        hasPlaceholder,
        `Rule ${rule.id} source "${rule.source}" must contain PLACEHOLDER or TO BE VERIFIED`
      ).toBe(true);
    }
  });
});
