import { test, expect } from "@playwright/test";

test.describe("Aushadh Prahari — PBKDF2 PIN Setup & Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("ap_consent_v1", "accepted");
    });
  });

  test("walks through first-time PIN establishment, authentication, logout, failed attempt tracking, and re-login", async ({
    page,
  }) => {
    // 1. Visit Review Queue
    await page.goto("/review");

    // 2. First-time setup screen: enter PIN and Confirm PIN
    const passwordInputs = page.locator("input[type='password']");
    await expect(passwordInputs).toHaveCount(2);

    // Enter valid 4-digit PIN
    await passwordInputs.nth(0).fill("5678");
    await passwordInputs.nth(1).fill("5678");

    // Click Set PIN submit button
    const submitBtn = page.locator("button[type='submit']");
    await submitBtn.click();

    // 3. Authenticated Review Screen
    // Should display reviewer header and tabs
    await expect(page.locator("text=Dr. Ananya Roy, MO")).toBeVisible({ timeout: 10000 });

    // 4. Test Logout
    const logoutBtn = page.locator("button:has-text('Logout'), button:has-text('লগআউট'), button:has-text('लॉगआउट')");
    await logoutBtn.click();

    // 5. User should now be on the PIN Login Screen (only 1 password input)
    await expect(page.locator("input[type='password']")).toHaveCount(1);

    // 6. Test Incorrect PIN Attempt
    const loginPinInput = page.locator("input[type='password']");
    await loginPinInput.fill("1111");
    const loginSubmitBtn = page.locator("button[type='submit']");
    await loginSubmitBtn.click();

    // Error message / remaining attempts should be displayed
    await expect(page.locator("text=4").or(page.locator("text=৪"))).toBeVisible();

    // 7. Test Correct PIN Login
    await loginPinInput.fill("5678");
    await loginSubmitBtn.click();

    // Successfully logged back in
    await expect(page.locator("text=Dr. Ananya Roy, MO")).toBeVisible({ timeout: 10000 });
  });
});
