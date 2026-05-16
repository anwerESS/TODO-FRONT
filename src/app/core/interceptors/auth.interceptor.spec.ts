import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { TODO_API_URL } from '../config/api.config';
import { authInterceptor } from './auth.interceptor';

const STORAGE_KEY = 'todo.auth.session';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: 'jwt-token',
        tokenType: 'Bearer',
        expiresAt: '2099-01-01T00:00:00.000Z',
        username: 'user',
      }),
    );

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpClient = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem(STORAGE_KEY);
  });

  it('adds the bearer token to API requests', () => {
    httpClient.get(TODO_API_URL).subscribe();

    const request = http.expectOne(TODO_API_URL);
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush([]);
  });

  it('clears the session and redirects to login on protected 401 responses', () => {
    spyOn(router, 'navigate').and.resolveTo(true);

    httpClient.get(TODO_API_URL).subscribe({ error: () => undefined });

    const request = http.expectOne(TODO_API_URL);
    request.flush(
      { message: 'Authentication is required' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/' },
    });
  });
});
