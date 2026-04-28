import { expect, test } from '@playwright/test';

test('shopping page is reachable', async ({ page }) => {
  await page.goto('/spesa');
  await expect(page).toHaveURL(/spesa/);
});
