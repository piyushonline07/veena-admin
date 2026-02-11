import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import {AuthService} from "../service/auth.service";
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();

    // Only add Authorization header for API requests, not for CloudFront/S3/external URLs
    // This prevents CORS preflight issues with CloudFront
    const isApiRequest = request.url.startsWith(environment.apiBaseUrl) ||
                         request.url.startsWith('/api');

    if (token && isApiRequest) {
      request = request.clone({
        setHeaders: {Authorization: `Bearer ${token}`}
      });
    }

    return next.handle(request).pipe(
      catchError((error) => {
        // Agar backend se 401 error aata hai
        if (error.status === 401 && isApiRequest) {
          this.auth.logout(); // Token clear karo aur login par bhejo
        }
        return throwError(error);
      })
    );
  }
}
