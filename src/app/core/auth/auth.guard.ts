import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { from, map, switchMap, take } from 'rxjs';
import { AuthService } from '../../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.user$.pipe(
    take(1),
    switchMap((user) => user
      ? from(auth.prepareUserData(user)).pipe(map(() => true))
      : [router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url }
        })])
  );
};
