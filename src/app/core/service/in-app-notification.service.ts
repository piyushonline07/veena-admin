import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface InAppNotification {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    targetGroup: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PagedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class InAppNotificationService {
    private baseApi = `${environment.apiBaseUrl}/api/admin/in-app-notifications`;

    constructor(private http: HttpClient) { }

    /**
     * Get all in-app notifications (admin)
     */
    getAllNotifications(): Observable<InAppNotification[]> {
        return this.http.get<InAppNotification[]>(this.baseApi);
    }

    /**
     * Get notification by ID
     */
    getNotificationById(id: string): Observable<InAppNotification> {
        return this.http.get<InAppNotification>(`${this.baseApi}/${id}`);
    }

    /**
     * Create a new in-app notification
     */
    createNotification(data: {
        title: string;
        description: string;
        targetGroup?: string;
        isActive?: boolean;
    }, image?: File): Observable<InAppNotification> {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('targetGroup', data.targetGroup || 'ALL');
        formData.append('isActive', String(data.isActive !== false));
        if (image) {
            formData.append('image', image);
        }
        return this.http.post<InAppNotification>(this.baseApi, formData);
    }

    /**
     * Update an existing notification
     */
    updateNotification(id: string, data: {
        title?: string;
        description?: string;
        targetGroup?: string;
        isActive?: boolean;
    }, image?: File): Observable<InAppNotification> {
        const formData = new FormData();
        if (data.title) formData.append('title', data.title);
        if (data.description) formData.append('description', data.description);
        if (data.targetGroup) formData.append('targetGroup', data.targetGroup);
        if (data.isActive !== undefined) formData.append('isActive', String(data.isActive));
        if (image) {
            formData.append('image', image);
        }
        return this.http.put<InAppNotification>(`${this.baseApi}/${id}`, formData);
    }

    /**
     * Delete a notification
     */
    deleteNotification(id: string): Observable<any> {
        return this.http.delete(`${this.baseApi}/${id}`);
    }

    /**
     * Toggle notification active status
     */
    toggleActive(id: string): Observable<InAppNotification> {
        return this.http.post<InAppNotification>(`${this.baseApi}/${id}/toggle-active`, {});
    }

    /**
     * Get count of active notifications
     */
    getActiveCount(): Observable<{ activeCount: number }> {
        return this.http.get<{ activeCount: number }>(`${this.baseApi}/count`);
    }
}

