import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) {}

  getAdminDashboard() {
    return this.http.get<any>(
      `${environment.apiBaseUrl}/api/admin/dashboard`,
      { withCredentials: true }
    );
  }

  getDauChart(days = 7) {
    return this.http.get<any[]>(
      `${environment.apiBaseUrl}/api/admin/dashboard/charts/dau?days=${days}`,
      { withCredentials: true }
    );
  }

  getUploadChart(days = 7) {
    return this.http.get<any[]>(
      `${environment.apiBaseUrl}/api/admin/dashboard/charts/uploads?days=${days}`,
      { withCredentials: true }
    );
  }
  getStatusChart() {
    return this.http.get<any>(
      `${environment.apiBaseUrl}/api/admin/dashboard/charts/status`,
      { withCredentials: true }
    );
  }
}
