import { test, expect } from "@playwright/test";

test.describe("Aushadh Prahari — Check Flow Smoke Test", () => {
  test("completes check flow in manual mode and generates doctor decision support", async ({
    page,
  }) => {
    // 1. Visit Home
    await page.goto("/");

    // If consent dialog is showing, accept it
    const consentButton = page.locator("button:has-text('আমি বুঝেছি')");
    if (await consentButton.isVisible()) {
      await consentButton.click();
    }

    // 2. Navigate to Check flow
    await page.goto("/check");

    // 3. Step 1: Patient Details
    await expect(page.locator("text=রোগী (Patient)")).toBeVisible();

    // Select adult and proceed
    const nextBtn1 = page.locator("button:has-text('পরের ধাপ: লক্ষণ')");
    await nextBtn1.click();

    // 4. Step 2: Symptoms
    await expect(page.locator("text=লক্ষণ (Symptoms)")).toBeVisible();

    // Select "Loose motions" (first symptom button with 💧 icon)
    const looseMotionsBtn = page.locator(".symptom-btn").first();
    await looseMotionsBtn.click();

    // Next to Medicines
    const nextBtn2 = page.locator("button:has-text('পরের ধাপ: ওষুধ')");
    await nextBtn2.click();

    // 5. Step 3: Medicines
    await expect(page.locator("text=ওষুধ (Medicines)")).toBeVisible();

    // Search for Envas
    const searchInput = page.locator("input[placeholder*='Envas']");
    await searchInput.fill("Envas");
    await page.waitForTimeout(400);

    // Click on Envas from dropdown
    const envasItem = page.locator("div:has-text('Envas')").last();
    await envasItem.click();

    // Run check
    const viewResultBtn = page.locator("button:has-text('ফলাফল দেখুন')");
    await viewResultBtn.click();

    // 6. Step 4: Result Verification
    await expect(page.locator("text=ফলাফল (Decision Support)")).toBeVisible();

    // Verify non-negotiable safety disclaimer
    await expect(
      page.locator(
        "text=Decision-support aid. Not a medical device. Do not change any medicine without a doctor."
      )
    ).toBeVisible();

    // Verify flagged medicine banner or badge
    await expect(page.locator("text=ASK DOCTOR TODAY").first()).toBeVisible();

    // Verify MO Message block
    await expect(page.locator("text=মেডিকেল অফিসারকে বার্তা")).toBeVisible();
  });
});
