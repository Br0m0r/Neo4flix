import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { AuthStore } from '../../core/auth.store';
import { PublicUser } from '../../core/auth.models';
import { ProfileApiService } from '../../core/profile-api.service';
import { ProfileComponent } from './profile.component';

const user: PublicUser = {
  id: 'user-1',
  email: 'alice@example.com',
  displayName: 'Alice',
  role: 'USER',
  twoFactorEnabled: false,
  createdAt: '2026-09-13T10:00:00Z',
};

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  const routerEvents = new Subject<NavigationStart>();
  const router = {
    events: routerEvents.asObservable(),
    navigateByUrl: vi.fn().mockResolvedValue(true),
    createUrlTree: vi.fn((commands: string[]) => commands),
    serializeUrl: vi.fn((commands: string[]) => commands[0]),
  };
  const api = {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    setupTwoFactor: vi.fn(),
    confirmTwoFactor: vi.fn(),
    disableTwoFactor: vi.fn(),
    deleteAccount: vi.fn(),
  };
  const authStore = { clear: vi.fn() };

  beforeEach(async () => {
    Object.values(api).forEach((mock) => mock.mockReset());
    api.getProfile.mockReturnValue(of(user));
    router.navigateByUrl.mockClear();
    authStore.clear.mockClear();
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: ProfileApiService, useValue: api },
        { provide: AuthStore, useValue: authStore },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
  });

  function type(selector: string, value: string): void {
    const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function submit(selector: string): void {
    (fixture.nativeElement.querySelector(selector) as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('loads profile data, keeps email read-only, and saves only the display name', () => {
    api.updateProfile.mockReturnValue(of({ ...user, displayName: 'Alice Updated' }));
    const email = fixture.nativeElement.querySelector('[data-testid="profile-email"]') as HTMLInputElement;
    expect(email.readOnly).toBe(true);
    expect(email.value).toBe('alice@example.com');

    type('[data-testid="profile-display-name"]', 'Alice Updated');
    submit('[data-testid="profile-form"]');

    expect(api.updateProfile).toHaveBeenCalledWith({ displayName: 'Alice Updated' });
    expect(fixture.nativeElement.textContent).toContain('Profile updated.');
  });

  it('changes the password with reauthentication and clears sensitive fields', () => {
    api.changePassword.mockReturnValue(of(undefined));
    type('[data-testid="current-password"]', 'OldPassword1!');
    type('[data-testid="new-password"]', 'NewPassword1!');
    type('[data-testid="confirm-new-password"]', 'NewPassword1!');
    submit('[data-testid="password-form"]');

    expect(api.changePassword).toHaveBeenCalledWith({
      currentPassword: 'OldPassword1!',
      newPassword: 'NewPassword1!',
      code: null,
    });
    expect((fixture.nativeElement.querySelector('[data-testid="current-password"]') as HTMLInputElement).value).toBe('');
    expect(fixture.nativeElement.textContent).toContain('Password changed.');
  });

  it('keeps 2FA enrollment in memory and clears it after confirmation or navigation', () => {
    const localWrite = vi.spyOn(window.localStorage, 'setItem');
    const sessionWrite = vi.spyOn(window.sessionStorage, 'setItem');
    api.setupTwoFactor.mockReturnValue(
      of({
        otpauthUri: 'otpauth://totp/Neo4flix:alice?secret=MEMORYONLY',
        qrCodeDataUrl: 'data:image/png;base64,cXItY29kZQ==',
        expiresAt: '2026-09-13T10:10:00Z',
      }),
    );
    api.confirmTwoFactor.mockReturnValue(of(undefined));

    (fixture.nativeElement.querySelector('[data-testid="setup-2fa"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="totp-enrollment"]')).not.toBeNull();

    type('[data-testid="confirm-totp-code"]', '428193');
    submit('[data-testid="confirm-totp-form"]');
    expect(api.confirmTwoFactor).toHaveBeenCalledWith({ code: '428193' });
    expect(fixture.nativeElement.querySelector('[data-testid="totp-enrollment"]')).toBeNull();
    expect(localWrite).not.toHaveBeenCalled();
    expect(sessionWrite).not.toHaveBeenCalled();

    fixture.destroy();
    api.getProfile.mockReturnValue(of(user));
    fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    api.setupTwoFactor.mockReturnValue(of({ otpauthUri: 'secret', qrCodeDataUrl: 'data:image/png;base64,eA==', expiresAt: 'later' }));
    (fixture.nativeElement.querySelector('[data-testid="setup-2fa"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    routerEvents.next(new NavigationStart(1, '/watchlist'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="totp-enrollment"]')).toBeNull();
    localWrite.mockRestore();
    sessionWrite.mockRestore();
  });

  it('does not restore enrollment data when a setup response arrives after navigation starts', () => {
    const delayedSetup = new Subject<{
      otpauthUri: string;
      qrCodeDataUrl: string;
      expiresAt: string;
    }>();
    api.setupTwoFactor.mockReturnValue(delayedSetup.asObservable());

    (fixture.nativeElement.querySelector('[data-testid="setup-2fa"]') as HTMLButtonElement).click();
    routerEvents.next(new NavigationStart(2, '/auth/login'));
    delayedSetup.next({
      otpauthUri: 'otpauth://totp/Neo4flix:alice?secret=SHOULDNOTRETURN',
      qrCodeDataUrl: 'data:image/png;base64,eA==',
      expiresAt: 'later',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="totp-enrollment"]')).toBeNull();
  });

  it('disables 2FA only with password and a six-digit code', () => {
    api.getProfile.mockReturnValue(of({ ...user, twoFactorEnabled: true }));
    fixture.destroy();
    fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    api.disableTwoFactor.mockReturnValue(of(undefined));

    type('[data-testid="disable-password"]', 'Password1!');
    type('[data-testid="disable-totp-code"]', '428193');
    submit('[data-testid="disable-2fa-form"]');

    expect(api.disableTwoFactor).toHaveBeenCalledWith({ password: 'Password1!', code: '428193' });
    expect(fixture.nativeElement.textContent).toContain('Two-factor authentication disabled.');
  });

  it('requires the current 2FA code for password changes and deletion when 2FA is enabled', () => {
    api.getProfile.mockReturnValue(of({ ...user, twoFactorEnabled: true }));
    fixture.destroy();
    fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    api.changePassword.mockReturnValue(of(undefined));
    api.deleteAccount.mockReturnValue(of(undefined));

    type('[data-testid="current-password"]', 'OldPassword1!');
    type('[data-testid="new-password"]', 'NewPassword1!');
    type('[data-testid="confirm-new-password"]', 'NewPassword1!');
    submit('[data-testid="password-form"]');
    expect(api.changePassword).not.toHaveBeenCalled();

    type('[data-testid="password-totp-code"]', '428193');
    submit('[data-testid="password-form"]');
    expect(api.changePassword).toHaveBeenCalledWith({
      currentPassword: 'OldPassword1!',
      newPassword: 'NewPassword1!',
      code: '428193',
    });

    type('[data-testid="delete-password"]', 'Password1!');
    type('[data-testid="delete-confirmation"]', 'DELETE');
    submit('[data-testid="delete-account-form"]');
    expect(api.deleteAccount).not.toHaveBeenCalled();

    type('[data-testid="delete-totp-code"]', '428193');
    submit('[data-testid="delete-account-form"]');
    expect(api.deleteAccount).toHaveBeenCalledWith({ password: 'Password1!', code: '428193' });
  });

  it('requires typed confirmation and reauthentication before deleting the account', () => {
    api.deleteAccount.mockReturnValue(of(undefined));
    type('[data-testid="delete-password"]', 'Password1!');
    type('[data-testid="delete-confirmation"]', 'not delete');
    submit('[data-testid="delete-account-form"]');
    expect(api.deleteAccount).not.toHaveBeenCalled();

    type('[data-testid="delete-confirmation"]', 'DELETE');
    submit('[data-testid="delete-account-form"]');

    expect(api.deleteAccount).toHaveBeenCalledWith({ password: 'Password1!', code: null });
    expect(authStore.clear).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
  });

  it('provides links to rating history and the watchlist', () => {
    const ratingLink = fixture.nativeElement.querySelector('[data-testid="ratings-link"]') as HTMLAnchorElement;
    const watchlistLink = fixture.nativeElement.querySelector('[data-testid="watchlist-link"]') as HTMLAnchorElement;

    expect(ratingLink.getAttribute('href')).toBe('/ratings');
    expect(watchlistLink.getAttribute('href')).toBe('/watchlist');
  });
});
