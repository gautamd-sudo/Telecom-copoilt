import { test, expect } from '@playwright/test';

test.describe('Telecom AI Platform E2E Tests', () => {
  
  test('Unauthenticated access redirects to /login', async ({ page }) => {
    // Visiting root without login should redirect to /login
    await page.goto('/');
    await page.waitForURL('**/login');
    await expect(page.getByText('Secure Authentication')).toBeVisible();

    // Visiting /dashboard directly without login should also redirect to /login
    await page.goto('/dashboard');
    await page.waitForURL('**/login*');
    await expect(page.getByText('Secure Authentication')).toBeVisible();
  });

  test('Dashboard navigation and AI Insights render', async ({ page }) => {
    // 0. Authenticate first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@acme.com');
    await page.fill('input[type="password"]', 'admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Check Sidebar
    await expect(page.getByText('Telecom AI')).toBeVisible();
    
    // Check specific critical workflows by navigating
    // 1. KPI Visualization
    const networkHealth = page.getByText('Network Health');
    await expect(networkHealth).toBeVisible();
    
    // 2. Incident Creation (UI)
    await page.goto('/dashboard/incidents');
    await expect(page.getByText('Active Incidents')).toBeVisible();
    
    // 3. AI Copilot (UI)
    await page.goto('/dashboard/copilot');
    await expect(page.getByText('Telecom AI Copilot').first()).toBeVisible();
    
    // 4. Sentiment Analysis (UI)
    await page.goto('/dashboard/conversations');
    await expect(page.getByText('Conversation Intelligence').first()).toBeVisible();
  });

  test('Authentication flow: login and logout', async ({ page }) => {
    // 1. Visit Login page
    await page.goto('/login');
    await expect(page.getByText('Secure Authentication')).toBeVisible();
    
    // 2. Fill credentials
    await page.fill('input[type="email"]', 'admin@acme.com');
    await page.fill('input[type="password"]', 'admin123!');
    
    // 3. Submit
    await page.click('button[type="submit"]');
    
    // 4. Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page.getByText('Admin User')).toBeVisible();

    // 5. Sign Out
    const signOutBtn = page.getByRole('button', { name: /Sign Out/i }).first();
    await signOutBtn.click();
    
    // 6. Should redirect back to login
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page.getByText('Secure Authentication')).toBeVisible();
  });
});
