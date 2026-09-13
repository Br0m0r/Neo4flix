import { anonymousOnlyGuard, authGuard } from './core/auth.guards';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { TwoFactorLoginComponent } from './features/auth/two-factor-login.component';
import { routes } from './app.routes';

describe('auth routes', () => {
  it('registers the three lazy auth pages with anonymous-only protection', async () => {
    const expected = [
      ['auth/login', LoginComponent],
      ['auth/register', RegisterComponent],
      ['auth/2fa', TwoFactorLoginComponent],
    ] as const;

    for (const [path, component] of expected) {
      const route = routes.find((candidate) => candidate.path === path);
      expect(route?.canActivate).toContain(anonymousOnlyGuard);
      expect(await route?.loadComponent?.()).toBe(component);
    }
  });

  it('protects the root application route for authenticated users', () => {
    const root = routes.find((route) => route.path === '');

    expect(root?.canActivate).toContain(authGuard);
  });
});
