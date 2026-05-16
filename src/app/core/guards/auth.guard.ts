import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';

import { AuthService } from '../services/auth.service';

const requireAuthentication = (state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  authService.clearSession();

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

export const authGuard: CanActivateFn = (_route, state) => requireAuthentication(state);
export const authChildGuard: CanActivateChildFn = (_route, state) => requireAuthentication(state);
