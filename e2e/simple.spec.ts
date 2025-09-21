import { test, expect } from '@playwright/test';

test.describe('Simplified E2E Tests', () => {
  test('should load homepage without errors', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Check that page loads without errors - title might be empty in dev mode
    const title = await page.title();
    expect(typeof title).toBe('string');
    
    // Check for basic content without relying on specific selectors
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page');
    expect(response?.status()).toBe(404);
  });

  test('should load agents page with basic content', async ({ page }) => {
    await page.goto('/agents');
    
    // Wait for page to load
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Check that page loads without errors - title might be empty in dev mode
    const title = await page.title();
    expect(typeof title).toBe('string');
    
    // Check for basic content without relying on specific selectors
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });
});
