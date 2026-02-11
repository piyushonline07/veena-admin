import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TrendingMediaItem {
    period: string;
    rank: number;
    media: {
        id: string;
        title: string;
        mediaType: string;
        thumbnailUrl?: string;
    };
    playCount: number;
    updatedAt: string;
}

export interface AllTrendingResponse {
    '1_DAY': TrendingMediaItem[];
    '7_DAYS': TrendingMediaItem[];
    '30_DAYS': TrendingMediaItem[];
    '1_YEAR': TrendingMediaItem[];
}

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

    getTrendingMedia(period: string = '7_DAYS'): Observable<TrendingMediaItem[]> {
        return this.http.get<TrendingMediaItem[]>(`${this.apiUrl}/trending`, {
            params: { period }
        });
    }

    getAllTrendingMedia(): Observable<AllTrendingResponse> {
        return this.http.get<AllTrendingResponse>(`${this.apiUrl}/trending/all`);
    }
}
