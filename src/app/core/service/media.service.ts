import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
}
