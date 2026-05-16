import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AUTH_API_URL, API_BASE_URL } from '../config/api.config';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getAccessToken();
  const isApiRequest = request.url.startsWith(API_BASE_URL);
  const isAuthRequest = request.url.startsWith(AUTH_API_URL);

  const authorizedRequest =
    token && isApiRequest
      ? request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthRequest) {
        const returnUrl = router.url && router.url !== '/login' ? router.url : '/';
        authService.clearSession();
        void router.navigate(['/login'], { queryParams: { returnUrl } });
      }

      return throwError(() => error);
    }),
  );
};
