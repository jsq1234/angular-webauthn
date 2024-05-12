import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  if(localStorage['username'] !== null) {
    return true;
  }
  return false;
};
