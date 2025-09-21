import { test, expect } from '@playwright/test';

test.describe('API Tests', () => {
  test('should handle test-auth login endpoint', async ({ page }) => {
    const response = await page.request.post('/api/test-auth/login');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('ok');
    expect(data.ok).toBe(true);
    expect(data).toHaveProperty('user');
  });

  test('should handle health endpoint', async ({ page }) => {
    const response = await page.request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
  });

  test('should handle 404 for unknown endpoints', async ({ page }) => {
    const response = await page.request.get('/api/unknown-endpoint');
    expect(response.status()).toBe(404);
  });
});
