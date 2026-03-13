import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type CreditType = 'COMPOSER' | 'LYRICIST' | 'PRODUCER' | 'DIRECTOR';

export interface Credit {
  id: number;
  name: string;
  bio?: string;
  imageUrl?: string;
  creditType: CreditType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCreditRequest {
  name: string;
  bio?: string;
  imageUrl?: string;
  creditType: CreditType;
}

export interface UpdateCreditRequest {
  name?: string;
  bio?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class CreditService {
  private apiUrl = `${environment.apiBaseUrl}/api/admin/credits`;

  constructor(private http: HttpClient) {}

  // Get all credits with pagination and filtering
  getCredits(page: number, size: number, type?: CreditType, query?: string): Observable<PageResponse<Credit>> {
    let url = `${this.apiUrl}?page=${page}&size=${size}`;
    if (type) {
      url += `&type=${type}`;
    }
    if (query) {
      url += `&query=${encodeURIComponent(query)}`;
    }
    return this.http.get<PageResponse<Credit>>(url);
  }


  // Get all active composers
  getAllComposers(): Observable<Credit[]> {
    return this.http.get<Credit[]>(`${this.apiUrl}/composers`);
  }

  // Get all active lyricists
  getAllLyricists(): Observable<Credit[]> {
    return this.http.get<Credit[]>(`${this.apiUrl}/lyricists`);
  }

  // Get all active producers
  getAllProducers(): Observable<Credit[]> {
    return this.http.get<Credit[]>(`${this.apiUrl}/producers`);
  }

  // Get all active directors
  getAllDirectors(): Observable<Credit[]> {
    return this.http.get<Credit[]>(`${this.apiUrl}/directors`);
  }

  // Get credit by ID
  getById(id: number): Observable<Credit> {
    return this.http.get<Credit>(`${this.apiUrl}/${id}`);
  }

  // Create a new credit (with optional image file upload)
  createCredit(request: CreateCreditRequest, image?: File): Observable<Credit> {
    const formData = new FormData();
    formData.append('name', request.name);
    formData.append('creditType', request.creditType);
    if (request.bio) {
      formData.append('bio', request.bio);
    }
    if (image) {
      formData.append('image', image);
    }
    return this.http.post<Credit>(this.apiUrl, formData);
  }


  // Create a composer
  createComposer(name: string, bio?: string, imageUrl?: string): Observable<Credit> {
    return this.http.post<Credit>(`${this.apiUrl}/composers`, { name, bio, imageUrl });
  }

  // Create a lyricist
  createLyricist(name: string, bio?: string, imageUrl?: string): Observable<Credit> {
    return this.http.post<Credit>(`${this.apiUrl}/lyricists`, { name, bio, imageUrl });
  }

  // Create a producer
  createProducer(name: string, bio?: string, imageUrl?: string): Observable<Credit> {
    return this.http.post<Credit>(`${this.apiUrl}/producers`, { name, bio, imageUrl });
  }

  // Create a director
  createDirector(name: string, bio?: string, imageUrl?: string): Observable<Credit> {
    return this.http.post<Credit>(`${this.apiUrl}/directors`, { name, bio, imageUrl });
  }

  // Update a credit (with optional image file upload)
  updateCredit(id: number, request: UpdateCreditRequest, image?: File): Observable<Credit> {
    const formData = new FormData();
    if (request.name) {
      formData.append('name', request.name);
    }
    if (request.bio !== undefined) {
      formData.append('bio', request.bio || '');
    }
    if (request.isActive !== undefined && request.isActive !== null) {
      formData.append('isActive', String(request.isActive));
    }
    if (image) {
      formData.append('image', image);
    }
    return this.http.put<Credit>(`${this.apiUrl}/${id}`, formData);
  }

  // Delete a credit (soft delete)
  deleteCredit(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  // Get media associated with a credit (as composer, lyricist, producer, or director)
  getMediaByCreditId(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/media`);
  }
}
