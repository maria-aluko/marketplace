import { test, expect } from '@playwright/test';

test.describe('Search flow', () => {
  test('search for vendors and view profile', async ({ page }) => {
    await page.goto('/search');

    // Type a keyword and trigger search
    const searchInput = page.getByRole('searchbox').or(page.locator('input[type="search"], input[name="q"], input[placeholder*="earch"]').first());
    await searchInput.fill('caterer');
    await searchInput.press('Enter');

    // Wait for results
    const firstCard = page.locator('[data-testid="vendor-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    // Click the first vendor card
    await firstCard.click();

    // Should navigate to vendor profile page
    await expect(page).toHaveURL(/\/vendors\/.+/);

    // Vendor name heading should be present
    await expect(page.locator('h1')).toContainText(/.+/);

    // Key profile sections should be visible
    await expect(page.locator('[data-testid="vendor-about"], [data-testid="vendor-description"], section').first()).toBeVisible();
  });

  test('shows empty state when no results match', async ({ page }) => {
    await page.goto('/search');

    const searchInput = page.locator('input[type="search"], input[name="q"], input[placeholder*="earch"]').first();
    await searchInput.fill('xyznonexistentkeyword12345');
    await searchInput.press('Enter');

    // Either shows empty state or zero results — no vendor cards
    await page.waitForTimeout(2000);
    const cards = page.locator('[data-testid="vendor-card"]');
    await expect(cards).toHaveCount(0);
  });
});
