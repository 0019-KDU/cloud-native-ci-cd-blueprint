import { test, expect } from '@playwright/test';

test.describe('AI Incident Assistant - E2E Tests', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AI Incident Assistant/i);
  });

  test('should navigate to incidents list page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Incidents');
    await expect(page).toHaveURL(/.*incidents/);
  });

  test('should create a new incident', async ({ page }) => {
    await page.goto('/incidents/new');
    
    // Fill incident form
    await page.fill('[name="title"]', 'E2E Test Incident');
    await page.fill('[name="description"]', 'This is a test incident created by E2E tests');
    await page.selectOption('[name="severity"]', 'high');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify redirect to incidents list
    await expect(page).toHaveURL(/.*incidents$/);
    
    // Verify incident appears in list
    await expect(page.locator('text=E2E Test Incident')).toBeVisible();
  });

  test('should view incident details', async ({ page }) => {
    // Go to incidents list
    await page.goto('/incidents');
    
    // Click first incident
    await page.click('[data-testid="incident-item"]:first-child');
    
    // Verify incident detail page
    await expect(page.locator('[data-testid="incident-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="incident-description"]')).toBeVisible();
  });

  test('should access analytics dashboard', async ({ page }) => {
    await page.goto('/analytics');
    
    // Verify charts are rendered
    await expect(page.locator('[data-testid="analytics-chart"]')).toBeVisible();
  });
});

test.describe('API Health Checks', () => {
  test('backend API should be healthy', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('should fetch incidents from API', async ({ request }) => {
    const response = await request.get('/api/incidents');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('should fetch analytics data from API', async ({ request }) => {
    const response = await request.get('/api/analytics/overview');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('totalIncidents');
  });
});
