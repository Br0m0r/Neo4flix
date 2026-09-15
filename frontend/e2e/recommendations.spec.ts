import { expect, Page, test } from '@playwright/test';

const email = process.env.NEO4FLIX_E2E_EMAIL;
const password = process.env.NEO4FLIX_E2E_PASSWORD;

async function signIn(page: Page): Promise<void> {
  await page.goto('/auth/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(email!);
  await page.getByRole('textbox', { name: 'Password' }).fill(password!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
}

test('authenticated users can load recommendations and persist filter URL state', async ({ page }) => {
  test.skip(!email || !password, 'Set NEO4FLIX_E2E_EMAIL and NEO4FLIX_E2E_PASSWORD for the Compose browser fixture.');

  await signIn(page);
  await page.goto('/recommendations');
  await expect(page.getByRole('heading', { name: 'Recommendations' })).toBeVisible();
  await expect(page.getByRole('status').or(page.getByTestId('recommendations'))).toBeVisible();

  await page.getByLabel('Genre').fill('Science Fiction');
  await page.getByTestId('apply-filters').click();
  await expect(page).toHaveURL(/genre=Science(?:%20|\+)Fiction/);
  await expect(page.getByRole('heading', { name: 'Recommendations' })).toBeVisible();
});

test('recommendation outage leaves the normal movie catalog available', async ({ page }) => {
  test.skip(!email || !password, 'Set NEO4FLIX_E2E_EMAIL and NEO4FLIX_E2E_PASSWORD for the Compose browser fixture.');

  await page.route('**/api/v1/recommendations/me**', (route) => route.fulfill({
    status: 503,
    contentType: 'application/problem+json',
    body: JSON.stringify({ code: 'RECOMMENDATION_SERVICE_UNAVAILABLE' }),
  }));
  await signIn(page);
  await page.goto('/recommendations');
  await expect(page.getByRole('alert')).toContainText('temporarily unavailable');
  await page.getByRole('link', { name: 'Browse movies' }).first().click();
  await expect(page.getByRole('heading', { name: 'Movies' })).toBeVisible();
});
