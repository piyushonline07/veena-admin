import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MarketingService {
    private baseApi = `${environment.apiBaseUrl}/api/admin`;

    constructor(private http: HttpClient) { }

    // Push Notifications
    getNotifications(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseApi}/notifications`);
    }

    draftNotification(data: any): Observable<any> {
        return this.http.post(`${this.baseApi}/notifications/draft`, data);
    }

    sendNotification(id: string): Observable<any> {
        return this.http.post(`${this.baseApi}/notifications/${id}/send`, {});
    }

    // Featured Content
    getFeaturedSchedules(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseApi}/featured`);
    }

    scheduleFeature(data: any): Observable<any> {
        return this.http.post(`${this.baseApi}/featured`, data);
    }

    deleteFeature(id: string): Observable<any> {
        return this.http.delete(`${this.baseApi}/featured/${id}`);
    }

    // A/B Testing
    getABTests(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseApi}/ab-tests`);
    }

    startABTest(data: any): Observable<any> {
        return this.http.post(`${this.baseApi}/ab-tests/start`, data);
    }

    completeABTest(id: string, winner: string): Observable<any> {
        return this.http.post(`${this.baseApi}/ab-tests/${id}/complete?winnerVariant=${winner}`, {});
    }
}
