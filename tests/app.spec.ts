import { test, expect } from '@playwright/test';

test('geocat loads', async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/index.html');
  await expect(page.locator('body')).toBeVisible();
});