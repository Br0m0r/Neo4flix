import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthResponse } from './auth.models';
import { authInterceptor } from './auth.interceptor';
import { AuthStore } from './auth.store';

const session = (accessToken: string): AuthResponse => ({
  accessToken,
  tokenType: 'Bearer',
  expiresIn: 900,
  user: {
    id: 'user-1',
    email: 'alice@example.com',
    displayName: 'Alice',
    role: 'USER',
    twoFactorEnabled: false,
    createdAt: '2026-09-13T10:00:00Z',
  },
});

describe('authInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let store: AuthStore;
  const router = { navigateByUrl: vi.fn().mockResolvedValue(true) };

  beforeEach(() => {
    router.navigateByUrl.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(AuthStore);
    store.acceptAuthenticatedSession(session('old-token'));
  });

  afterEach(() => http.verify());

  it('attaches the in-memory bearer token to API requests', () => {
    client.get('/api/v1/movies').subscribe();

    const outgoing = http.expectOne('/api/v1/movies');
    expect(outgoing.request.headers.get('Authorization')).toBe('Bearer old-token');
    outgoing.flush([]);
  });

  it('coordinates one refresh for concurrent 401 responses and retries both requests', () => {
    client.get('/api/v1/movies/one').subscribe();
    client.get('/api/v1/movies/two').subscribe();

    const originals = http.match((request) => request.url.startsWith('/api/v1/movies/'));
    expect(originals).toHaveLength(2);
    originals.forEach((request) =>
      request.flush({}, { status: 401, statusText: 'Unauthorized' }),
    );

    const refresh = http.expectOne('/api/v1/auth/refresh');
    expect(refresh.request.withCredentials).toBe(true);
    refresh.flush(session('new-token'));

    const retries = http.match((request) => request.url.startsWith('/api/v1/movies/'));
    expect(retries).toHaveLength(2);
    retries.forEach((request) => {
      expect(request.request.headers.get('Authorization')).toBe('Bearer new-token');
      request.flush({});
    });
    http.expectNone('/api/v1/auth/refresh');
  });

  it('retries an eligible request only once', () => {
    const error = vi.fn();
    client.get('/api/v1/movies').subscribe({ error });
    http
      .expectOne('/api/v1/movies')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('/api/v1/auth/refresh').flush(session('new-token'));

    http
      .expectOne('/api/v1/movies')
      .flush({}, { status: 401, statusText: 'Still unauthorized' });

    http.expectNone('/api/v1/auth/refresh');
    expect(error).toHaveBeenCalledOnce();
  });

  it('does not refresh recursively for public authentication endpoints', () => {
    const error = vi.fn();
    client.post('/api/v1/auth/login', {}).subscribe({ error });

    http
      .expectOne('/api/v1/auth/login')
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    http.expectNone('/api/v1/auth/refresh');
    expect(error).toHaveBeenCalledOnce();
  });

  it('clears authentication and routes to login when refresh fails', () => {
    const error = vi.fn();
    client.get('/api/v1/movies').subscribe({ error });
    http
      .expectOne('/api/v1/movies')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    http
      .expectOne('/api/v1/auth/refresh')
      .flush({}, { status: 401, statusText: 'Refresh rejected' });

    expect(store.state().status).toBe('anonymous');
    expect(store.state().accessToken).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
    expect(error).toHaveBeenCalledOnce();
  });
});
