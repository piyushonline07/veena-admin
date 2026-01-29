import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BatchUpdateRequest {
    mediaIds: string[];
    artistId?: number;
    albumId?: number;
    title?: string;
    description?: string;
}

@Injectable({
    providedIn: 'root'
})
export class MediaService {
    private apiUrl = `${environment.apiBaseUrl}/api/admin/media`;

    constructor(private http: HttpClient) { }

    uploadMedia(formData: FormData): Observable<any> {
        return this.http.post(`${this.apiUrl}/upload`, formData);
    }

    getMediaList(page: number, size: number, query?: string): Observable<any> {
        let url = `${this.apiUrl}?page=${page}&size=${size}`;
        if (query) {
            url += `&query=${encodeURIComponent(query)}`;
        }
        return this.http.get(url);
    }

    updateMedia(id: string, data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, data);
    }

    deleteMedia(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    // Bulk upload multiple files
    bulkUploadMedia(mediaType: string, files: File[]): Observable<any[]> {
        const formData = new FormData();
        formData.append('mediaType', mediaType);
        files.forEach(file => {
            formData.append('files', file);
        });
        return this.http.post<any[]>(`${this.apiUrl}/bulk-upload`, formData);
    }

    // Batch update metadata for multiple media items
    batchUpdateMedia(request: BatchUpdateRequest): Observable<any[]> {
        return this.http.put<any[]>(`${this.apiUrl}/batch-update`, request);
    }

    // Batch publish multiple media items
    batchPublishMedia(mediaIds: string[]): Observable<any[]> {
        return this.http.post<any[]>(`${this.apiUrl}/batch-publish`, mediaIds);
    }

    // Get all draft/unpublished media
    getDraftMedia(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/drafts`);
    }
}
