import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  trackCount: number;
  isPublic: boolean;
  isAdminPlaylist: boolean;
  visibleToUsers: boolean;
}

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
  coverUrl?: string;
  visibleToUsers: boolean;
}

export interface UpdatePlaylistRequest {
  name?: string;
  description?: string;
  coverUrl?: string;
  visibleToUsers: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminPlaylistService {
  private apiUrl = `${environment.apiBaseUrl}/admin/playlists`;

  constructor(private http: HttpClient) {}

  // Get all admin playlists
  getAdminPlaylists(): Observable<Playlist[]> {
    return this.http.get<Playlist[]>(this.apiUrl);
  }

  // Create a new admin playlist
  createPlaylist(request: CreatePlaylistRequest): Observable<Playlist> {
    return this.http.post<Playlist>(this.apiUrl, request);
  }

  // Update an admin playlist
  updatePlaylist(id: string, request: UpdatePlaylistRequest): Observable<Playlist> {
    return this.http.put<Playlist>(`${this.apiUrl}/${id}`, request);
  }

  // Delete an admin playlist
  deletePlaylist(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Toggle visibility
  toggleVisibility(id: string, visibleToUsers: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/visibility`, { visibleToUsers });
  }

  // Get playlist tracks
  getPlaylistTracks(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/tracks`);
  }

  // Add track to playlist
  addTrack(playlistId: string, mediaId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${playlistId}/tracks`, { mediaId });
  }

  // Remove track from playlist
  removeTrack(playlistId: string, mediaId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${playlistId}/tracks/${mediaId}`);
  }
}
