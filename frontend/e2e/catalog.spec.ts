import { expect, test } from '@playwright/test';

test('anonymous users can browse the public movie catalog', async ({ page }) => {
  await page.goto('/movies');

  await expect(page.getByRole('heading', { name: 'Movies' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Search titles' })).toBeVisible();
  await expect(page.getByText(/movies$/)).toBeVisible();
});
