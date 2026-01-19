import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly BACKEND = 'http://localhost:9999';

  constructor(private http: HttpClient) {}

  /**
   * Checks if user is authenticated AND admin
   */
  isAdminAuthenticated() {
    return this.http.get(`${this.BACKEND}/api/me`, {
      withCredentials: true
    }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * Redirect to Spring Boot login (OAuth2 → Cognito)
   */
  redirectToLogin() {
    window.location.href = this.BACKEND;
  }

  logout() {
    window.location.href = `${this.BACKEND}/logout`;
  }
}
