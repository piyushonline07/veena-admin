import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from "../service/auth.service";
import { environment } from "../../../environments/environment";


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Skip authentication in development if configured
    if (environment.skipAuth) {
      console.log('Auth skipped (development mode)');
      return true;
    }

    // 1. URL Snapshot se turant token check karein
    const tokenFromUrl = route.queryParamMap.get('token');

    if (tokenFromUrl) {
      console.log('Token found in URL, saving...');
      this.auth.setToken(tokenFromUrl);
      return true; // Access allow karein
    }

    // 2. Agar URL mein nahi hai, toh Storage dekhein
    if (this.auth.isLoggedIn()) {
      return true;
    }

    // 3. Agar dono jagah nahi hai, tabhi bahar nikaalein
    console.log('No token found, redirecting to login');
    this.auth.redirectToLogin();
    return false;
  }
}

