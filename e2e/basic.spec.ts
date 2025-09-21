import { test, expect } from '@playwright/test';

test.describe('Basic E2E Tests', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page loads without errors
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page');
    expect(response?.status()).toBe(404);
  });
});
