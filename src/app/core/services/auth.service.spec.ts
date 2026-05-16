import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AUTH_API_URL } from '../config/api.config';
import { AuthService } from './auth.service';

const STORAGE_KEY = 'todo.auth.session';
const FUTURE_EXPIRY = '2099-01-01T00:00:00.000Z';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.removeItem(STORAGE_KEY);

    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem(STORAGE_KEY);
  });

  it('logs in, stores the session, and exposes the bearer token', () => {
    let token = '';

    service.login({ username: '  user  ', password: '1234' }).subscribe((session) => {
      token = session.token;
    });

    const request = http.expectOne(`${AUTH_API_URL}/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ username: 'user', password: '1234' });
    request.flush({
      token: 'jwt-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      expiresAt: FUTURE_EXPIRY,
      username: 'user',
    });

    expect(token).toBe('jwt-token');
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.username()).toBe('user');
    expect(service.getAccessToken()).toBe('jwt-token');
    expect(localStorage.getItem(STORAGE_KEY)).toContain('jwt-token');
  });

  it('logs out through the API and clears the stored session', () => {
    service.login({ username: 'user', password: '1234' }).subscribe();
    http.expectOne(`${AUTH_API_URL}/login`).flush({
      token: 'jwt-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      expiresAt: FUTURE_EXPIRY,
      username: 'user',
    });

    let loggedOut: boolean | undefined;
    service.logout().subscribe((value) => {
      loggedOut = value;
    });

    const request = http.expectOne(`${AUTH_API_URL}/logout`);
    expect(request.request.method).toBe('POST');
    request.flush({ loggedOut: true });

    expect(loggedOut).toBeTrue();
    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
