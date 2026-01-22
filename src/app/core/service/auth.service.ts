import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs'; // RxJS imports zaroori hain

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'admin_token';

  constructor() {}

  // 1. Token ko LocalStorage mein save karne ke liye
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  // 2. Token ko Read karne ke liye
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // 3. Jo method miss ho raha tha (AppComponent iski demand kar raha hai)
  isAdminAuthenticated(): Observable<boolean> {
    const token = this.getToken();
    // !!token convert karta hai string ko boolean mein (agar token hai toh true)
    // of() isko observable bana deta hai jise subscribe kiya ja sake
    return of(!!token);
  }

  // 4. Check karne ke liye ki user logged in hai (Sync method)
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // JWT ko decode karke expiry check karein
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = Date.now() >= payload.exp * 1000;

      if (isExpired) {
        this.logout(); // Agar expire ho gaya toh saaf kardo
        return false;
      }
      return true;
    } catch (e) {
      return false; // Agar token ka format hi galat hai
    }
  }

  // 5. Flutter Login (Root) par wapas bhejne ke liye
  redirectToLogin(): void {
    this.logout();
  }

  // 6. Token clear karke redirect karna
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    window.location.href = '/';
  }
}
