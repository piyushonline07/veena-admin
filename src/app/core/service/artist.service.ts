import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Artist {
    id?: number;
    name: string;
    genre?: string;
    country?: string;
    bio?: string;
    imageUrl?: string;
    spotifyUrl?: string;
    youtubeUrl?: string;
    instagramUrl?: string;
    websiteUrl?: string;
    monthlyListeners?: number;
    totalPlays?: number;
    verified?: boolean;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ArtistService {
    private apiUrl = `${environment.apiBaseUrl}/api/admin/artists`;

    constructor(private http: HttpClient) { }

    getArtists(page: number, size: number, query?: string): Observable<any> {
        let url = `${this.apiUrl}?page=${page}&size=${size}`;
        if (query) {
            url += `&query=${encodeURIComponent(query)}`;
        }
        return this.http.get(url);
    }

    getAllActiveArtists(): Observable<Artist[]> {
        return this.http.get<Artist[]>(`${this.apiUrl}/all`);
    }

    getArtist(id: number): Observable<Artist> {
        return this.http.get<Artist>(`${this.apiUrl}/${id}`);
    }

    createArtist(artist: Artist): Observable<Artist> {
        return this.http.post<Artist>(this.apiUrl, artist);
    }

    updateArtist(id: number, artist: Artist): Observable<Artist> {
        return this.http.put<Artist>(`${this.apiUrl}/${id}`, artist);
    }

    deleteArtist(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    hardDeleteArtist(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}/hard`);
    }

    toggleVerification(id: number): Observable<Artist> {
        return this.http.post<Artist>(`${this.apiUrl}/${id}/verify`, {});
    }
}
