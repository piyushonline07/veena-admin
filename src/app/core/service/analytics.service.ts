import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {
    private apiUrl = `${environment.apiBaseUrl}/api/admin/analytics`;

    constructor(private http: HttpClient) { }

    getDashboardStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/dashboard-stats`);
    }

    getDAUChartData(): Observable<any> {
        return this.http.get(`${this.apiUrl}/dau-chart`);
    }

    getMAUChartData(): Observable<any> {
        return this.http.get(`${this.apiUrl}/mau-chart`);
    }

    getTrendingMedia(): Observable<any> {
        return this.http.get(`${this.apiUrl}/trending`);
    }
}
