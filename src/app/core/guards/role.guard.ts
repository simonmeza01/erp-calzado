import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthMockService } from '../services/auth-mock.service';
import { UserRole } from '../models';

export const roleGuard: CanActivateFn = (route) => {
  const auth   = inject(AuthMockService);
  const router = inject(Router);
  const roles  = route.data['roles'] as UserRole[] | undefined;
  if (!roles || roles.length === 0) return true;
  if (auth.hasRole(...roles)) return true;
  // Redirigir a la primera ruta disponible según su rol
  return router.createUrlTree(['/clientes']);
};
