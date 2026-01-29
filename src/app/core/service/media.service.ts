import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BatchUpdateRequest {
    mediaIds: string[];
    artistId?: number;
    albumId?: number;
    title?: string;
    description?: string;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percent: number;
    status: 'uploading' | 'completed' | 'error';
    response?: any;
    error?: any;
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

    // Update media with files (thumbnail, lyrics) and relationships (artist, album)
    updateMediaWithFiles(id: string, formData: FormData): Observable<any> {
        return this.http.post(`${this.apiUrl}/${id}/update`, formData);
    }

    deleteMedia(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    // Bulk upload multiple files with progress tracking
    bulkUploadMedia(mediaType: string, files: File[]): Observable<any[]> {
        const formData = new FormData();
        formData.append('mediaType', mediaType);
        files.forEach(file => {
            formData.append('files', file);
        });
        return this.http.post<any[]>(`${this.apiUrl}/bulk-upload`, formData);
    }

    // Bulk upload with real-time progress reporting
    bulkUploadMediaWithProgress(mediaType: string, files: File[]): Observable<UploadProgress> {
        const formData = new FormData();
        formData.append('mediaType', mediaType);
        files.forEach(file => {
            formData.append('files', file);
        });

        const progressSubject = new Subject<UploadProgress>();

        const req = new HttpRequest('POST', `${this.apiUrl}/bulk-upload`, formData, {
            reportProgress: true
        });

        this.http.request(req).subscribe({
            next: (event) => {
                if (event.type === HttpEventType.UploadProgress) {
                    const total = event.total || 0;
                    const loaded = event.loaded || 0;
                    const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
                    progressSubject.next({
                        loaded,
                        total,
                        percent,
                        status: 'uploading'
                    });
                } else if (event.type === HttpEventType.Response) {
                    progressSubject.next({
                        loaded: 100,
                        total: 100,
                        percent: 100,
                        status: 'completed',
                        response: event.body
                    });
                    progressSubject.complete();
                }
            },
            error: (err) => {
                progressSubject.next({
                    loaded: 0,
                    total: 0,
                    percent: 0,
                    status: 'error',
                    error: err
                });
                progressSubject.complete();
            }
        });

        return progressSubject.asObservable();
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

    // Get media by album ID (admin sees all media)
    getMediaByAlbum(albumId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/album/${albumId}`);
    }

    // Get media by artist ID (admin sees all media)
    getMediaByArtist(artistId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/artist/${artistId}`);
    }
}
