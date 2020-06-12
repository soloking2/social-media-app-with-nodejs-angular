import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements CanActivate {

  constructor(private router: Router,
              private storage: LocalStorageService) { }

canActivate(
  route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean | UrlTree> | Observable<boolean | UrlTree> {

    const loggedIn = this.isLoggedIn();


    let activate = loggedIn;
    let redirect = '/feed';

    if (route.data.loggedIn) {
      activate = !activate;
      redirect = '/register';
    }

    if (!activate) {
      return true;
    } else {
      this.router.navigate([redirect]);
      return false;
    }
}

isLoggedIn() {
  if (this.storage.getToken()) {
    return true;
  }
  return false;
}

public isLogOut() {
  this.storage.removeToken();
}
}
