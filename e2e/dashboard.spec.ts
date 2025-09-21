import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test('should load dashboard and show main components', async ({ page }) => {
    await page.goto('/agents');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the main dashboard elements are present (use more specific selector)
    await expect(page.locator('h1').first()).toContainText('AI-kollega');
    
    // Check that spotlight tabs are present
    await expect(page.locator('[role="tab"]').first()).toBeVisible();
    
    // Check that KPI cards are visible
    await expect(page.locator('text=Möten')).toBeVisible();
    await expect(page.locator('text=Briefs')).toBeVisible();
  });

  test('should navigate between spotlight tabs', async ({ page }) => {
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
    
    // Click on different tabs
    await page.click('text=Briefs');
    await expect(page.locator('text=För-brief 30 min före och post-brief efter mötet.')).toBeVisible();
    
    await page.click('text=Regwatch');
    await expect(page.locator('text=Regeländringar')).toBeVisible();
    
    await page.click('text=Möten');
    await expect(page.locator('text=Mötesöversikt')).toBeVisible();
  });

  test('should toggle compact mode', async ({ page }) => {
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
    
    // Find and click the compact mode toggle (use more specific selector)
    const compactToggle = page.locator('label[for="compact-mode"] + button');
    await compactToggle.click();
    
    // Check that compact mode is toggled
    await expect(compactToggle).toBeChecked();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
    
    // Check that the page loads and main elements are visible on mobile
    await expect(page.locator('h1').first()).toContainText('AI-kollega');
    await expect(page.locator('[role="tab"]').first()).toBeVisible();
  });
});