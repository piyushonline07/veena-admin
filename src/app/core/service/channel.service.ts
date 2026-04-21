import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChannelResponse {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    channelName: string;
    channelHandle: string;
    description: string;
    imageUrl: string;
    active: boolean;
    subscriberCount: number;
    totalViews: number;
    createdAt: string;
    updatedAt: string;
    totalMedia: number;
    pendingMedia: number;
    approvedMedia: number;
}

export interface UserMediaResponse {
    id: string;
    title: string;
    description: string;
    mediaType: string;
    status: string;
    approvalStatus: string;
    rejectionReason: string;
    hlsUrl: string;
    thumbnailUrl: string;
    fileSize: number;
    fileExtension: string;
    playCount: number;
    durationSeconds: number;
    createdAt: string;
    updatedAt: string;
    reviewedAt: string;
    channelId: string;
    channelName: string;
    uploadedById: string;
    uploadedByName: string;
    uploadedByEmail: string;
}

export interface MediaApprovalRequest {
    action: 'APPROVE' | 'REJECT';
    rejectionReason?: string;
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
export class ChannelService {
    private apiUrl = `${environment.apiBaseUrl}/api/admin/channels`;

    constructor(private http: HttpClient) { }

    /**
     * List all user channels with stats.
     */
    getChannels(page: number, size: number, query?: string): Observable<PageResponse<ChannelResponse>> {
        let url = `${this.apiUrl}?page=${page}&size=${size}&sort=createdAt,desc`;
        if (query) {
            url += `&query=${encodeURIComponent(query)}`;
        }
        return this.http.get<PageResponse<ChannelResponse>>(url);
    }

    /**
     * Get all media pending approval.
     */
    getPendingMedia(page: number, size: number): Observable<PageResponse<UserMediaResponse>> {
        return this.http.get<PageResponse<UserMediaResponse>>(
            `${this.apiUrl}/media/pending?page=${page}&size=${size}`
        );
    }

    /**
     * Get media for a specific channel.
     */
    getChannelMedia(channelId: string, page: number, size: number, approvalFilter?: string): Observable<PageResponse<UserMediaResponse>> {
        let url = `${this.apiUrl}/${channelId}/media?page=${page}&size=${size}&sort=createdAt,desc`;
        if (approvalFilter) {
            url += `&status=${approvalFilter}`;
        }
        return this.http.get<PageResponse<UserMediaResponse>>(url);
    }

    /**
     * Approve or reject a media submission.
     */
    reviewMedia(mediaId: string, request: MediaApprovalRequest): Observable<UserMediaResponse> {
        return this.http.post<UserMediaResponse>(
            `${this.apiUrl}/media/${mediaId}/review`, request
        );
    }

    /**
     * Batch approve multiple media items.
     */
    batchApproveMedia(mediaIds: string[]): Observable<UserMediaResponse[]> {
        return this.http.post<UserMediaResponse[]>(
            `${this.apiUrl}/media/batch-approve`, mediaIds
        );
    }
}
