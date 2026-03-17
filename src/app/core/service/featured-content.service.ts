import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FeaturedContent {
  id: string;
  contentType: string; // FEATURED_SONG, VIDEO_AD, AUDIO_AD, IMAGE_AD
  title: string;
  slotIndex: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  // Media info (FEATURED_SONG only)
  mediaId?: string;
  mediaTitle?: string;
  mediaType?: string;
  hlsUrl?: string;
  thumbnailUrl?: string;
  artist?: { id: number; name: string; imageUrl?: string };
  // Ad fields
  adMediaUrl?: string;
  adImageUrl?: string;
}

export interface FeaturedSongRequest {
  mediaId: string;
  slotIndex?: number;
  startTime: string;
  endTime: string;
}

export interface UpdateFeaturedRequest {
  title?: string;
  slotIndex?: number;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FeaturedContentService {
  private apiUrl = `${environment.apiBaseUrl}/api/admin/featured`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<FeaturedContent[]> {
    return this.http.get<FeaturedContent[]>(this.apiUrl);
  }

  getActive(): Observable<FeaturedContent[]> {
    return this.http.get<FeaturedContent[]>(`${this.apiUrl}/active`);
  }

  addFeaturedSong(request: FeaturedSongRequest): Observable<FeaturedContent> {
    return this.http.post<FeaturedContent>(`${this.apiUrl}/song`, request);
  }

  addAd(formData: FormData): Observable<FeaturedContent> {
    return this.http.post<FeaturedContent>(`${this.apiUrl}/ad`, formData);
  }

  update(id: string, request: UpdateFeaturedRequest): Observable<FeaturedContent> {
    return this.http.put<FeaturedContent>(`${this.apiUrl}/${id}`, request);
  }

  toggleActive(id: string): Observable<FeaturedContent> {
    return this.http.post<FeaturedContent>(`${this.apiUrl}/${id}/toggle`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

