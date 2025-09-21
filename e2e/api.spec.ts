import { test, expect } from '@playwright/test';

test.describe('API Endpoints E2E Tests', () => {
  test('should handle authentication for protected endpoints', async ({ page }) => {
    // Test API endpoint directly - expect 401 for protected endpoints
    const response = await page.request.get('/api/agents/meetings');
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Autentisering');
  });

  test('should handle authentication for queue stats', async ({ page }) => {
    const response = await page.request.get('/api/agents/queues/stats');
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Autentisering');
  });

  test('should handle 404 for unknown endpoints', async ({ page }) => {
    const response = await page.request.get('/api/unknown-endpoint');
    expect(response.status()).toBe(404);
  });
});