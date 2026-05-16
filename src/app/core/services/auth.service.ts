import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, tap } from 'rxjs';

import { AUTH_API_URL } from '../config/api.config';
import { AuthSession, LoginCredentials, LoginResponse, LogoutResponse } from '../models/auth.model';

const AUTH_STORAGE_KEY = 'todo.auth.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _session = signal<AuthSession | null>(this.readStoredSession());

  readonly session = this._session.asReadonly();
  readonly username = computed(() => this._session()?.username ?? null);
  readonly isAuthenticated = computed(() => this.isValidSession(this._session()));

  login(credentials: LoginCredentials): Observable<AuthSession> {
    const payload: LoginCredentials = {
      username: credentials.username.trim(),
      password: credentials.password,
    };

    return this.http.post<LoginResponse>(`${AUTH_API_URL}/login`, payload).pipe(
      map((response) => this.toSession(response)),
      tap((session) => this.storeSession(session)),
    );
  }

  logout(): Observable<boolean> {
    if (!this._session()) {
      this.clearSession();
      return of(true);
    }

    return this.http.post<LogoutResponse>(`${AUTH_API_URL}/logout`, {}).pipe(
      map((response) => response.loggedOut),
      catchError(() => of(false)),
      finalize(() => this.clearSession()),
    );
  }

  getAccessToken(): string | null {
    const session = this._session();

    if (!this.isValidSession(session)) {
      this.clearSession();
      return null;
    }

    return session.token;
  }

  clearSession(): void {
    this._session.set(null);

    if (this.isBrowser) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  private storeSession(session: AuthSession): void {
    this._session.set(session);

    if (this.isBrowser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    }
  }

  private readStoredSession(): AuthSession | null {
    if (!this.isBrowser) {
      return null;
    }

    const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawSession) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawSession) as Partial<AuthSession>;
      const session = this.normalizeSession(parsed);

      if (this.isValidSession(session)) {
        return session;
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }

  private normalizeSession(value: Partial<AuthSession>): AuthSession | null {
    if (
      typeof value.token !== 'string' ||
      typeof value.expiresAt !== 'string' ||
      typeof value.username !== 'string'
    ) {
      return null;
    }

    return {
      token: value.token,
      tokenType: typeof value.tokenType === 'string' ? value.tokenType : 'Bearer',
      expiresAt: value.expiresAt,
      username: value.username,
    };
  }

  private toSession(response: LoginResponse): AuthSession {
    return {
      token: response.token,
      tokenType: response.tokenType || 'Bearer',
      expiresAt: response.expiresAt,
      username: response.username,
    };
  }

  private isValidSession(session: AuthSession | null): session is AuthSession {
    if (!session?.token || !session.expiresAt) {
      return false;
    }

    const expiresAt = new Date(session.expiresAt).getTime();
    return Number.isFinite(expiresAt) && expiresAt > Date.now();
  }
}
