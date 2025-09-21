import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  test('should load dashboard with authentication', async ({ page }) => {
    // Try to access the dashboard - should work with test-auth
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
    
    // Should load normally with test authentication
    await expect(page.getByTestId('app-title')).toContainText('AI-kollega');
  });

  test('should handle authentication flow', async ({ page }) => {
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
    
    // Should be authenticated and page should load
    await expect(page.getByTestId('app-title')).toBeVisible();
  });
});