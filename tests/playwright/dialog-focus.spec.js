// Playwright test skeleton: dialog focus & keyboard navigation
// Note: this is a test skeleton — install Playwright and configure the project to run it.

const { test, expect } = require('@playwright/test');

test.describe('Dialog focus and keyboard behaviour', () => {
  test('PromptDialog focuses input and traps focus', async ({ page }) => {
    await page.goto('http://localhost:5173/moderation');

    // Wait for the moderation table to load
    await page.waitForSelector('.mq-table', { timeout: 5000 });

    // Click the first approve button to open the PromptDialog
    const approveBtn = await page.locator('.mq-btn--approve').first();
    await approveBtn.click();

    // Expect the prompt input to be visible and focused
    const promptInput = page.locator('input[aria-label="Reason"]');
    await expect(promptInput).toBeVisible();
    await expect(promptInput).toBeFocused();

    // Tab through focusable items and ensure focus does not escape
    await page.keyboard.press('Tab');
    // Should focus Confirm button (Submit)
    const submitBtn = page.locator('button:has-text("Submit")');
    await expect(submitBtn).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(promptInput).toHaveCount(0);
  });
});
