import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Album {
    id?: number;
    name: string;
    description?: string;
    coverImageUrl?: string;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AlbumService {
    private apiUrl = `${environment.apiBaseUrl}/api/admin/albums`;

    constructor(private http: HttpClient) { }

    getAlbums(page: number, size: number, query?: string): Observable<any> {
        let url = `${this.apiUrl}?page=${page}&size=${size}`;
        if (query) {
            url += `&query=${encodeURIComponent(query)}`;
        }
        return this.http.get(url);
    }

    getAllActiveAlbums(): Observable<Album[]> {
        return this.http.get<Album[]>(`${this.apiUrl}/all`);
    }

    getAlbum(id: number): Observable<Album> {
        return this.http.get<Album>(`${this.apiUrl}/${id}`);
    }

    createAlbum(album: Album): Observable<Album> {
        return this.http.post<Album>(this.apiUrl, album);
    }

    updateAlbum(id: number, album: Album): Observable<Album> {
        return this.http.put<Album>(`${this.apiUrl}/${id}`, album);
    }

    deleteAlbum(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    hardDeleteAlbum(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}/hard`);
    }

    uploadAlbumImage(id: number, image: File): Observable<Album> {
        const formData = new FormData();
        formData.append('image', image);
        return this.http.post<Album>(`${this.apiUrl}/${id}/image`, formData);
    }

    uploadAlbumImageByName(albumName: string, image: File): Observable<{ imageUrl: string }> {
        const formData = new FormData();
        formData.append('name', albumName);
        formData.append('image', image);
        return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/image`, formData);
    }
}
