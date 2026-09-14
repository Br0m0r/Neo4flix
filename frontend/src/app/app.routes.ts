import { Routes } from '@angular/router';
import { anonymousOnlyGuard, authGuard } from './core/auth.guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [authGuard],
    children: [],
  },
  {
    path: 'auth/login',
    canActivate: [anonymousOnlyGuard],
    loadComponent: () => import('./features/auth/login.component').then((module) => module.LoginComponent),
  },
  {
    path: 'auth/register',
    canActivate: [anonymousOnlyGuard],
    loadComponent: () =>
      import('./features/auth/register.component').then((module) => module.RegisterComponent),
  },
  {
    path: 'auth/2fa',
    canActivate: [anonymousOnlyGuard],
    loadComponent: () =>
      import('./features/auth/two-factor-login.component').then(
        (module) => module.TwoFactorLoginComponent,
      ),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile.component').then((module) => module.ProfileComponent),
  },
  { path: 'movies', loadComponent: () => import('./features/catalog/catalog.component').then((m) => m.CatalogComponent) },
  { path: 'movies/:id', loadComponent: () => import('./features/catalog/movie-detail.component').then((m) => m.MovieDetailComponent) },
  { path: '**', redirectTo: '' },
];
