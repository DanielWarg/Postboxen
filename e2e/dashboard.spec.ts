import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test('should load dashboard and show main components', async ({ page }) => {
    await page.goto('/agents');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the main dashboard elements are present using stable selectors
    await expect(page.getByTestId('app-title')).toBeVisible();
    await expect(page.getByTestId('app-title')).toContainText('AI-kollega');
    
    // Check that spotlight tabs are present
    await expect(page.getByRole('tab', { name: 'Möten' })).toBeVisible();
    
    // Check that KPI cards are visible
    await expect(page.getByText('Möten')).toBeVisible();
    await expect(page.getByText('Briefs')).toBeVisible();
  });

  test('should navigate between spotlight tabs', async ({ page }) => {
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
    
    // Click on different tabs using stable selectors
    await page.getByRole('tab', { name: 'Briefs' }).click();
    await expect(page.getByText('För-brief 30 min före och post-brief efter mötet.')).toBeVisible();
    
    await page.getByRole('tab', { name: 'Regwatch' }).click();
    await expect(page.getByText('Regeländringar')).toBeVisible();
    
    await page.getByRole('tab', { name: 'Möten' }).click();
    await expect(page.getByText('Mötesöversikt')).toBeVisible();
  });

  test('should toggle compact mode', async ({ page }) => {
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
    
    // Find and click the compact mode toggle using stable selector
    const compactToggle = page.getByTestId('compact-switch');
    await compactToggle.click();
    
    // Check that compact mode is toggled
    await expect(compactToggle).toBeChecked();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
    
    // Check that the page loads and main elements are visible on mobile
    await expect(page.getByTestId('app-title')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Möten' })).toBeVisible();
  });

  test('should show observability metrics', async ({ page }) => {
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
    
    // Click on Observability tab
    await page.getByRole('tab', { name: 'Observability' }).click();
    
    // Check that observability metrics are visible
    await expect(page.getByText(/Mål recap\s*<\s*90s: ✅/)).toBeVisible();
    await expect(page.getByText(/Mål nudge\s*<\s*48h: ✅/)).toBeVisible();
    await expect(page.getByText(/Error rate: 0\.02%/)).toBeVisible();
    await expect(page.getByText(/Uptime: 99\.9%/)).toBeVisible();
  });
});