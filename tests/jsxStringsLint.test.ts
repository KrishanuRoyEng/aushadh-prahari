import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// Allowlist of tokens allowed in raw JSX (symbols, icons, brand constants, punctuation)
const ALLOWED_RAW_TOKENS = new Set([
  "·",
  "←",
  "→",
  "✓",
  "✗",
  "🚨",
  "⚠️",
  "ℹ️",
  "⚙️",
  "🩺",
  "🌡️",
  "👥",
  "🔬",
  "📊",
  "🏠",
  "💊",
  "📞",
  "🗑️",
  "🔒",
  "⏳",
  "🔄",
  "💧",
  "🤮",
  "🤒",
  "🚫",
  "☀️",
  "›",
  "‹",
  "+",
  "-",
  "/",
  "%",
  "SMS",
  "WhatsApp",
  "AI",
  "CSV",
  "JSON",
  "PPV",
  "eGFR",
  "mg/dL",
  "PIN",
  "ID",
  "ORS",
  "UI",
]);

function getAllTsxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllTsxFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("JSX Strings Lint Test", () => {
  const appDir = path.resolve(__dirname, "../src/app");
  const compDir = path.resolve(__dirname, "../src/components");
  const files = [...getAllTsxFiles(appDir), ...getAllTsxFiles(compDir)];

  it("found tsx files to scan", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("ensures all user-visible text in JSX is localized via t() or on allowlist", () => {
    const violations: { file: string; line: number; text: string }[] = [];

    // Regex to match raw JSX text between > and <
    // e.g. >Hardcoded English Text<
    const jsxTextRegex = />([^<>{}\n\r]+)</g;

    for (const file of files) {
      // Exclude tests or language-check page test fixture if any
      const relPath = path.relative(path.resolve(__dirname, ".."), file);
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip comments, imports, style blocks
        if (line.trim().startsWith("//") || line.trim().startsWith("/*") || line.includes("import ")) {
          continue;
        }

        let match: RegExpExecArray | null;
        jsxTextRegex.lastIndex = 0;

        while ((match = jsxTextRegex.exec(line)) !== null) {
          const raw = match[1].trim();
          if (!raw) continue;

          // If raw is just numbers, punctuation or allowed symbols
          if (/^[\d\s.,:;!?()[\]{}#%*+_\-—/|'"`]+$/.test(raw)) {
            continue;
          }

          if (ALLOWED_RAW_TOKENS.has(raw)) {
            continue;
          }

          // Check if it contains word letters in English, Bengali, or Devanagari
          if (/[a-zA-Z\u0980-\u09FF\u0900-\u097F]{2,}/.test(raw)) {
            violations.push({
              file: relPath,
              line: i + 1,
              text: raw,
            });
          }
        }
      }
    }

    if (violations.length > 0) {
      const summary = violations
        .slice(0, 30)
        .map((v) => `${v.file}:${v.line} -> "${v.text}"`)
        .join("\n");
      expect(
        violations,
        `Found ${violations.length} unlocalized JSX text strings:\n${summary}`
      ).toHaveLength(0);
    }
  });
});
