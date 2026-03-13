import { test, expect } from '@playwright/test';

test.describe('Search flow', () => {
  test('search for vendors and view profile', async ({ page }) => {
    await page.goto('/search');

    // Type a keyword and trigger search
    const searchInput = page
      .getByRole('searchbox')
      .or(
        page.locator('input[type="search"], input[name="q"], input[placeholder*="earch"]').first(),
      );
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
    await expect(
      page
        .locator('[data-testid="vendor-about"], [data-testid="vendor-description"], section')
        .first(),
    ).toBeVisible();
  });

  test('shows empty state when no results match', async ({ page }) => {
    await page.goto('/search');

    const searchInput = page
      .locator('input[type="search"], input[name="q"], input[placeholder*="earch"]')
      .first();
    await searchInput.fill('xyznonexistentkeyword12345');
    await searchInput.press('Enter');

    // Either shows empty state or zero results — no vendor cards
    await page.waitForTimeout(2000);
    const cards = page.locator('[data-testid="vendor-card"]');
    await expect(cards).toHaveCount(0);
  });
});

test.describe('Listing search flow', () => {
  test('search services and view listing detail', async ({ page }) => {
    await page.goto('/services');

    // Search input should be visible
    const searchInput = page
      .locator('input[type="search"], input[name="q"], input[placeholder*="earch"]')
      .first();
    await expect(searchInput).toBeVisible();

    // Type a keyword and trigger search
    await searchInput.fill('catering');
    await searchInput.press('Enter');

    // Wait for listing results
    const firstCard = page.locator('[data-testid="listing-card"], a[href*="/listings/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    // Click the first listing card
    await firstCard.click();

    // Should navigate to listing detail page
    await expect(page).toHaveURL(/\/listings\/.+/);

    // Listing title heading should be present
    await expect(page.locator('h1')).toContainText(/.+/);
  });

  test('search equipment with rental filters', async ({ page }) => {
    await page.goto('/equipment');

    // Search input should be visible
    const searchInput = page
      .locator('input[type="search"], input[name="q"], input[placeholder*="earch"]')
      .first();
    await expect(searchInput).toBeVisible();

    // Page should show rental-specific filter options
    await expect(
      page
        .locator('text=Rental Category')
        .or(page.locator('[data-testid="rental-category-filter"]'))
        .first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test('/services has category filter', async ({ page }) => {
    await page.goto('/services');

    // Category filter should be present
    await expect(
      page.locator('text=Category').or(page.locator('[data-testid="category-filter"]')).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test('/listings redirects to /services', async ({ page }) => {
    await page.goto('/listings');
    await expect(page).toHaveURL(/\/services/);
  });

  test('listing detail shows vendor trust signals', async ({ page }) => {
    // Navigate to a listing via services search
    await page.goto('/services');

    const firstCard = page.locator('[data-testid="listing-card"], a[href*="/listings/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();

    await expect(page).toHaveURL(/\/listings\/.+/);

    // Vendor info section should be visible with business name link
    await expect(page.locator('a[href*="/vendors/"]').first()).toBeVisible();
  });
});
