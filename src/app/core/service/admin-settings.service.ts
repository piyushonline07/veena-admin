import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface AppSettings {
  enableUserNotifications: boolean;
  defaultAutoplayForUsers: boolean;
  allowUserDownloads: boolean;
  enableComments: boolean;
  maintenanceMode: boolean;
  minimumAppVersion?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminSettingsService {
  private baseApi = `${environment.apiBaseUrl}/api/admin/app-settings`;

  constructor(private http: HttpClient) {}

  getSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>(this.baseApi);
  }

  saveSettings(settings: AppSettings): Observable<AppSettings> {
    return this.http.put<AppSettings>(this.baseApi, settings);
  }
}
