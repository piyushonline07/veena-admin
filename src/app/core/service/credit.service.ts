import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type CreditType = 'COMPOSER' | 'LYRICIST';

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

  // Get credit by ID
  getById(id: number): Observable<Credit> {
    return this.http.get<Credit>(`${this.apiUrl}/${id}`);
  }

  // Create a new credit
  createCredit(request: CreateCreditRequest): Observable<Credit> {
    return this.http.post<Credit>(this.apiUrl, request);
  }


  // Create a composer
  createComposer(name: string, bio?: string, imageUrl?: string): Observable<Credit> {
    return this.http.post<Credit>(`${this.apiUrl}/composers`, { name, bio, imageUrl });
  }

  // Create a lyricist
  createLyricist(name: string, bio?: string, imageUrl?: string): Observable<Credit> {
    return this.http.post<Credit>(`${this.apiUrl}/lyricists`, { name, bio, imageUrl });
  }

  // Update a credit
  updateCredit(id: number, request: UpdateCreditRequest): Observable<Credit> {
    return this.http.put<Credit>(`${this.apiUrl}/${id}`, request);
  }

  // Delete a credit (soft delete)
  deleteCredit(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
