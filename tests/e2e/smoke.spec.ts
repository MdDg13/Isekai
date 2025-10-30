import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Isekai|Next.js/i);
  await expect(page.locator('h1')).toContainText(/Isekai/i);
});


