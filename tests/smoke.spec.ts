import { test, expect } from "@playwright/test";

test.describe("Aushadh Prahari — Check Flow Smoke Test", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("ap_consent_v1", "accepted");
    });
  });

  test("completes check flow in manual mode and generates doctor decision support", async ({
    page,
  }) => {
    // 1. Visit Check flow
    await page.goto("/check");

    // 2. Step 1: Patient Details — proceed to Step 2
    const nextBtn1 = page.locator("button.btn-primary.btn-full").first();
    await nextBtn1.click();

    // 3. Step 2: Symptoms
    // Select "Loose motions" (first symptom button with 💧 icon)
    const looseMotionsBtn = page.locator(".symptom-btn").first();
    await looseMotionsBtn.click();

    // Next to Step 3: Medicines
    const nextBtn2 = page.locator("button.btn-primary").filter({ hasText: "➔" }).first();
    await nextBtn2.click();

    // 4. Step 3: Medicines
    // Search for Cardace or Envas
    const searchInput = page.locator("input[placeholder*='Cardace'], input[placeholder*='Envas']").first();
    await searchInput.fill("Envas");
    await page.waitForTimeout(400);

    // Click on Envas from dropdown
    const envasItem = page.locator("div:has-text('Envas')").last();
    await envasItem.click();

    // Run check (proceed to Step 4)
    const viewResultBtn = page.locator("button.btn-primary").filter({ hasText: "➔" }).first();
    await viewResultBtn.click();

    // 5. Step 4: Result Verification
    // Verify non-negotiable safety disclaimer
    await expect(page.locator(".safety-disclaimer")).toBeVisible();

    // Verify flagged medicine banner or decision card
    await expect(page.locator(".banner-warn").first()).toBeVisible();

    // Verify MO Message copy or SMS button is available
    await expect(page.locator("button:has-text('SMS'), a:has-text('SMS')")).toBeVisible();
  });
});
