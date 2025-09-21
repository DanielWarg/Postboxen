import { test, expect } from '@playwright/test';

test.describe('API Endpoints E2E Tests', () => {
  test('should load meetings API endpoint with authentication', async ({ page }) => {
    // Test API endpoint directly - should work with test-auth
    const response = await page.request.get('/api/agents/meetings');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('meetings');
    expect(Array.isArray(data.meetings)).toBe(true);
  });

  test('should load queue stats API endpoint with authentication', async ({ page }) => {
    const response = await page.request.get('/api/agents/queues/stats');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('waiting');
    expect(data.data).toHaveProperty('active');
    expect(data.data).toHaveProperty('completed');
    expect(data.data).toHaveProperty('failed');
  });

  test('should handle 404 for unknown endpoints', async ({ page }) => {
    const response = await page.request.get('/api/unknown-endpoint');
    expect(response.status()).toBe(404);
  });
});