import { expect, test } from '@playwright/test';

const email = process.env.NEO4FLIX_E2E_ADMIN_EMAIL;
const password = process.env.NEO4FLIX_E2E_ADMIN_PASSWORD;

test('ADMIN can create, edit, and delete catalog entries in the browser', async ({ page, request }) => {
  test.skip(!email || !password, 'Set NEO4FLIX_E2E_ADMIN_EMAIL and NEO4FLIX_E2E_ADMIN_PASSWORD for the disposable admin fixture.');

  await page.goto('/auth/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(email!);
  await page.getByRole('textbox', { name: 'Password' }).fill(password!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

  await page.goto('/admin/catalog');
  await expect(page.getByRole('heading', { name: 'Catalog administration' })).toBeVisible();

  const movieTitle = `Browser movie ${Date.now()}`;
  await page.getByRole('textbox', { name: 'Title' }).fill(movieTitle);
  await page.getByRole('textbox', { name: 'Overview' }).fill('Created by the admin browser contract');
  await page.getByRole('spinbutton', { name: 'Release year' }).fill('2026');
  await page.getByRole('button', { name: 'Create movie' }).click();
  await expect(page.getByRole('status')).toContainText('Movie created.');

  const movieRow = page.getByText(movieTitle).locator('..');
  await movieRow.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('textbox', { name: 'Title' }).fill(`${movieTitle} updated`);
  await page.getByRole('button', { name: 'Update movie' }).click();
  await expect(page.getByRole('status')).toContainText('Movie updated.');

  const updatedRow = page.getByText(`${movieTitle} updated`).locator('..');
  await updatedRow.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('status')).toContainText('Movie deleted.');

  const login = await request.post('/api/v1/auth/login', { data: { email, password } });
  expect(login.status()).toBe(200);
  const token = (await login.json()).accessToken as string;
  const deletion = await request.delete('/api/v1/users/me', {
    headers: { Authorization: `Bearer ${token}` },
    data: { password, code: null },
  });
  expect(deletion.status()).toBe(204);
});
