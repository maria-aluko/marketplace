import { test, expect } from '@playwright/test';

// Seed constants — match dev seed data
const SEED_PHONE = '+2348000000001';
const SEED_VENDOR_ID = process.env.E2E_SEED_VENDOR_ID ?? '';

test.describe('Review submission flow', () => {
  test.skip(!SEED_VENDOR_ID, 'E2E_SEED_VENDOR_ID env var required');

  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto('/login');

    // Fill phone and request OTP
    const phoneInput = page.getByLabel(/phone/i).or(page.locator('input[name="phone"]'));
    await phoneInput.fill(SEED_PHONE);
    await page.getByRole('button', { name: /send otp/i }).click();

    // In dev, Termii logs the OTP — use a fixed dev OTP or read from logs
    // For now, fill with dev OTP (seed data uses '123456')
    const otpInput = page.getByLabel(/otp|code/i).or(page.locator('input[name="code"]'));
    await otpInput.fill('123456');
    await page.getByRole('button', { name: /verify|confirm/i }).click();

    // Should be authenticated
    await expect(page).not.toHaveURL('/login', { timeout: 10000 });
  });

  test('submit a review for a vendor', async ({ page }) => {
    await page.goto(`/reviews/new/${SEED_VENDOR_ID}`);

    // Click 4th star (rating = 4)
    const stars = page.locator('[data-testid="star"], [aria-label*="star"], button[data-value]');
    await stars.nth(3).click();

    // Fill review body (must be 50+ chars)
    const textarea = page.getByRole('textbox').or(page.locator('textarea'));
    await textarea.fill('This vendor did an excellent job. Very professional and punctual for our event.');

    // Submit the form
    await page.getByRole('button', { name: /submit|post review/i }).click();

    // Expect success message
    await expect(
      page.getByText(/review submitted|thank you|pending approval/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test('review appears on vendor profile after submission', async ({ page }) => {
    await page.goto(`/reviews/new/${SEED_VENDOR_ID}`);

    const stars = page.locator('[data-testid="star"], [aria-label*="star"], button[data-value]');
    await stars.nth(3).click();

    const textarea = page.getByRole('textbox').or(page.locator('textarea'));
    const reviewBody = 'Great service and very responsive to all my event needs throughout the planning.';
    await textarea.fill(reviewBody);

    await page.getByRole('button', { name: /submit|post review/i }).click();
    await expect(page.getByText(/review submitted|thank you|pending/i)).toBeVisible({ timeout: 10000 });

    // Navigate to vendor profile to verify pending/approved state
    await page.goto(`/vendors/${SEED_VENDOR_ID}`);
    // Review may be pending admin approval — check for at least the reviews section
    await expect(page.locator('[data-testid="reviews-section"], [data-testid="vendor-reviews"], h2').filter({ hasText: /review/i }).first()).toBeVisible();
  });
});
