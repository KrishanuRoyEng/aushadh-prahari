import { test, expect } from "@playwright/test";

test.describe("i18n Localization & Browser Auto-translate Prevention", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("ap_consent_v1", "accepted");
    });
  });

  test("enforces translate=no and meta notranslate on html", async ({ page }) => {
    await page.goto("/");

    // Verify html tag has translate="no"
    const htmlTranslate = await page.locator("html").getAttribute("translate");
    expect(htmlTranslate).toBe("no");

    // Verify google notranslate meta tag
    const metaTag = page.locator("meta[name='google'][content='notranslate']");
    await expect(metaTag).toHaveCount(1);
  });

  test("switches language to Bengali and renders Bengali UI without reload", async ({ page }) => {
    await page.goto("/");

    // Select Bengali from header dropdown
    const langSelect = page.locator("#header-lang-select");
    await langSelect.selectOption("bn");

    // Verify html lang="bn"
    await expect(page.locator("html")).toHaveAttribute("lang", "bn");

    // Verify Bengali headers and buttons
    await expect(page.locator("h1")).toContainText("ঔষধ প্রহরী");
    await expect(page.locator("a[href='/check']").first()).toContainText("অসুস্থতা পরীক্ষা");
    await expect(page.locator("a[href='/heat']").first()).toContainText("তাপপ্রবাহ");
  });

  test("switches language to Hindi and renders Hindi UI", async ({ page }) => {
    await page.goto("/");

    // Select Hindi from header dropdown
    const langSelect = page.locator("#header-lang-select");
    await langSelect.selectOption("hi");

    // Verify html lang="hi"
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");

    // Verify Hindi headers and navigation
    await expect(page.locator("h1")).toContainText("औषध प्रहरी");
    await expect(page.locator("a[href='/check']").first()).toContainText("बीमारी जांच");
    await expect(page.locator("a[href='/heat']").first()).toContainText("लू");
  });

  test("language audit page displays side-by-side strings", async ({ page }) => {
    await page.goto("/about/language-check");

    // Table should contain key, English, Bengali, Hindi columns
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator("th").nth(0)).toBeVisible();
    const count = await page.locator("tr").count();
    expect(count).toBeGreaterThan(50);
  });
});
