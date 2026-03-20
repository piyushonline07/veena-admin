import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, of, forkJoin, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface BatchUpdateRequest {
    mediaIds: string[];
    artistId?: number;
    albumId?: number;
    subArtistIds?: number[];
    composerName?: string;
    lyricistName?: string;
    producerName?: string;
    directorName?: string;
    title?: string;
    description?: string;
    releaseDate?: string;
    mediaType?: string;
    podcast?: boolean;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percent: number;
    status: 'uploading' | 'completed' | 'error';
    response?: any;
    error?: any;
}

export interface FileGroupProgress {
    groupName: string;
    loaded: number;
    total: number;
    percent: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    response?: any;
    error?: any;
}

export interface BulkUploadProgress {
    groups: FileGroupProgress[];
    overallLoaded: number;
    overallTotal: number;
    overallPercent: number;
    completedCount: number;
    totalCount: number;
    status: 'uploading' | 'completed' | 'error';
    responses: any[];
}

export interface PlayRequest {
    position?: number;
}

/** S3 multipart upload chunk size: 50MB */
const CHUNK_SIZE = 50 * 1024 * 1024;

/** Threshold below which we use the old backend-proxy upload (5MB) */
const CHUNKED_UPLOAD_THRESHOLD = 5 * 1024 * 1024;

@Injectable({
    providedIn: 'root'
})
export class MediaService {
    private apiUrl = `${environment.apiBaseUrl}/api/admin/media`;
    private userApiUrl = `${environment.apiBaseUrl}/api/media`;

    constructor(private http: HttpClient) { }

    /**
     * Record a play event for a media item.
     * This updates play counts and user history for trending calculations.
     * @param mediaId The UUID of the media being played
     * @param position Optional playback position in seconds
     */
    recordPlay(mediaId: string, position?: number): Observable<void> {
        if (!mediaId) {
            console.warn('recordPlay called without mediaId');
            return of(undefined);
        }

        const body: PlayRequest = {};
        if (position !== undefined) {
            body.position = position;
        }

        return this.http.post<void>(`${this.userApiUrl}/${mediaId}/play`, body).pipe(
            catchError((error) => {
                // Log but don't throw - play tracking should not block playback
                console.error('Failed to record play:', error);
                return of(undefined);
            })
        );
    }

    uploadMedia(formData: FormData): Observable<any> {
        return this.http.post(`${this.apiUrl}/upload`, formData);
    }

    /** Upload single media with real-time progress reporting */
    uploadMediaWithProgress(formData: FormData): Observable<UploadProgress> {
        const progressSubject = new Subject<UploadProgress>();

        const req = new HttpRequest('POST', `${this.apiUrl}/upload`, formData, {
            reportProgress: true
        });

        let lastTotal = 0;

        this.http.request(req).subscribe({
            next: (event) => {
                if (event.type === HttpEventType.UploadProgress) {
                    const total = event.total || 0;
                    const loaded = event.loaded || 0;
                    if (total > 0) lastTotal = total;
                    const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
                    progressSubject.next({ loaded, total, percent, status: 'uploading' });
                } else if (event.type === HttpEventType.Response) {
                    progressSubject.next({
                        loaded: lastTotal || 100, total: lastTotal || 100, percent: 100,
                        status: 'completed', response: event.body
                    });
                    progressSubject.complete();
                }
            },
            error: (err) => {
                progressSubject.next({ loaded: 0, total: 0, percent: 0, status: 'error', error: err });
                progressSubject.complete();
            }
        });

        return progressSubject.asObservable();
    }

    getMediaList(page: number, size: number, query?: string, filters?: { mediaType?: string, artistId?: number, albumId?: number }): Observable<any> {
        let url = `${this.apiUrl}?page=${page}&size=${size}`;
        if (query) {
            url += `&query=${encodeURIComponent(query)}`;
        }
        if (filters?.mediaType) {
            url += `&mediaType=${encodeURIComponent(filters.mediaType)}`;
        }
        if (filters?.artistId) {
            url += `&artistId=${filters.artistId}`;
        }
        if (filters?.albumId) {
            url += `&albumId=${filters.albumId}`;
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

    /**
     * Group files by base name (without extension) so that media, thumbnail, and lyrics
     * files with the same base name are uploaded together in one request.
     */
    groupFilesByBaseName(files: File[]): Map<string, File[]> {
        const groups = new Map<string, File[]>();
        for (const file of files) {
            const lastDot = file.name.lastIndexOf('.');
            const baseName = lastDot > 0 ? file.name.substring(0, lastDot) : file.name;
            if (!groups.has(baseName)) {
                groups.set(baseName, []);
            }
            groups.get(baseName)!.push(file);
        }
        return groups;
    }

    /**
     * Upload a single file group (media + optional thumbnail + lyrics).
     * Uses S3 presigned chunked upload for large media files (>5MB) to avoid token expiration.
     * Falls back to backend-proxy upload for small files and non-media files.
     */
    private uploadFileGroup(mediaType: string, files: File[], groupName: string): Observable<UploadProgress> {
        const totalSize = files.reduce((acc, f) => acc + f.size, 0);
        const progressSubject = new Subject<UploadProgress>();

        // Separate media files from thumbnail/lyrics
        const audioExtensions = ['mp3', 'wav'];
        const videoExtensions = ['mp4', 'mov'];
        const mediaExtensions = [...audioExtensions, ...videoExtensions];

        const mediaFiles = files.filter(f => {
            const ext = f.name.split('.').pop()?.toLowerCase() || '';
            return mediaExtensions.includes(ext);
        });
        const otherFiles = files.filter(f => {
            const ext = f.name.split('.').pop()?.toLowerCase() || '';
            return !mediaExtensions.includes(ext);
        });

        // If the media file is large enough, use S3 chunked upload
        const largeMediaFile = mediaFiles.find(f => f.size > CHUNKED_UPLOAD_THRESHOLD);

        if (largeMediaFile) {
            // Use S3 presigned chunked upload for the media file
            this.chunkedUploadFileGroup(mediaType, largeMediaFile, otherFiles, groupName, totalSize, progressSubject);
        } else {
            // Small files: use the old backend-proxy upload
            this.backendProxyUpload(mediaType, files, totalSize, progressSubject);
        }

        return progressSubject.asObservable();
    }

    /**
     * Upload a large media file using S3 multipart presigned URLs.
     * Thumbnail and lyrics are uploaded separately via the old bulk-upload endpoint.
     */
    private async chunkedUploadFileGroup(
        mediaType: string,
        mediaFile: File,
        otherFiles: File[],
        groupName: string,
        totalSize: number,
        progressSubject: Subject<UploadProgress>
    ): Promise<void> {
        try {
            const fileType = 'media';
            const contentType = mediaFile.type || 'application/octet-stream';

            // Step 1: Initiate multipart upload (short API call, needs auth)
            const initResponse: any = await this.http.post(
                `${this.apiUrl}/s3-upload/initiate`,
                { fileName: mediaFile.name, contentType, mediaType, fileType }
            ).toPromise();

            const { uploadId, key, mediaId } = initResponse;

            // Step 2: Calculate chunks
            const fileSize = mediaFile.size;
            const chunkCount = Math.ceil(fileSize / CHUNK_SIZE);

            // Step 3: Get presigned URLs for all parts (short API call, needs auth)
            const urlsResponse: any[] = await this.http.post<any[]>(
                `${this.apiUrl}/s3-upload/presigned-urls`,
                { uploadId, key, partCount: chunkCount }
            ).toPromise() || [];

            // Step 4: Upload chunks directly to S3 using presigned URLs (NO auth needed)
            const completedParts: { partNumber: number; eTag: string }[] = [];
            let uploadedBytes = 0;

            for (let i = 0; i < chunkCount; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, fileSize);
                const chunk = mediaFile.slice(start, end);
                const presignedUrl = urlsResponse[i].url;
                const partNumber = urlsResponse[i].partNumber;

                // Upload this chunk directly to S3 via XMLHttpRequest for progress tracking
                const eTag = await this.uploadChunkToS3(presignedUrl, chunk, (chunkLoaded) => {
                    const currentTotal = uploadedBytes + chunkLoaded;
                    const percent = totalSize > 0 ? Math.round((currentTotal / totalSize) * 100) : 0;
                    progressSubject.next({
                        loaded: currentTotal,
                        total: totalSize,
                        percent,
                        status: 'uploading'
                    });
                });

                completedParts.push({ partNumber, eTag });
                uploadedBytes += (end - start);
            }

            // Step 5: Complete multipart upload + create media record (short API call, needs auth)
            const completeResponse: any = await this.http.post(
                `${this.apiUrl}/s3-upload/complete`,
                {
                    uploadId, key, mediaId,
                    fileName: mediaFile.name,
                    mediaType, fileType,
                    fileSize: mediaFile.size,
                    parts: completedParts
                }
            ).toPromise();

            // Step 6: If there are thumbnail/lyrics files, upload them via old endpoint
            // and then attach them to the media record
            let finalResponse = completeResponse;
            if (otherFiles.length > 0) {
                try {
                    const formData = new FormData();
                    otherFiles.forEach(f => {
                        const ext = f.name.split('.').pop()?.toLowerCase() || '';
                        if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
                            formData.append('thumbnail', f);
                        } else if (ext === 'vtt') {
                            formData.append('lyrics', f);
                        }
                    });
                    if (formData.has('thumbnail') || formData.has('lyrics')) {
                        finalResponse = await this.http.post(
                            `${this.apiUrl}/${mediaId}/update`, formData
                        ).toPromise();
                    }
                } catch (e) {
                    console.warn('Failed to upload thumbnail/lyrics for', groupName, e);
                    // Continue - the media file itself was uploaded successfully
                }
            }

            progressSubject.next({
                loaded: totalSize,
                total: totalSize,
                percent: 100,
                status: 'completed',
                response: Array.isArray(finalResponse) ? finalResponse : [finalResponse]
            });
            progressSubject.complete();

        } catch (error: any) {
            console.error('Chunked upload failed for', groupName, error);

            // Try to abort the multipart upload if we have the uploadId
            progressSubject.next({
                loaded: 0, total: totalSize, percent: 0,
                status: 'error', error
            });
            progressSubject.complete();
        }
    }

    /**
     * Upload a single chunk to S3 using a presigned URL via XMLHttpRequest.
     * Returns the ETag from the response header (required for completing multipart upload).
     */
    private uploadChunkToS3(
        presignedUrl: string,
        chunk: Blob,
        onProgress: (loaded: number) => void
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', presignedUrl, true);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    onProgress(event.loaded);
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    // Keep ETag as-is (with or without quotes) - backend normalizes it
                    const eTag = xhr.getResponseHeader('ETag') || '';
                    if (!eTag) {
                        console.warn('[ChunkedUpload] S3 response missing ETag header - CORS may not expose it');
                    }
                    resolve(eTag.replace(/"/g, ''));
                } else {
                    reject(new Error(`S3 chunk upload failed with status ${xhr.status}`));
                }
            };

            xhr.onerror = () => {
                reject(new Error('Network error during S3 chunk upload'));
            };

            xhr.ontimeout = () => {
                reject(new Error('Timeout during S3 chunk upload'));
            };

            // 6 hour timeout for very large chunks on slow connections
            xhr.timeout = 6 * 60 * 60 * 1000;
            xhr.send(chunk);
        });
    }

    /**
     * Fallback: upload files through the backend proxy (original approach).
     * Used for small files that don't need chunking.
     */
    private backendProxyUpload(
        mediaType: string,
        files: File[],
        totalSize: number,
        progressSubject: Subject<UploadProgress>
    ): void {
        const formData = new FormData();
        formData.append('mediaType', mediaType);
        files.forEach(file => formData.append('files', file));

        const req = new HttpRequest('POST', `${this.apiUrl}/bulk-upload`, formData, {
            reportProgress: true
        });

        this.http.request(req).subscribe({
            next: (event) => {
                if (event.type === HttpEventType.UploadProgress) {
                    const total = event.total || totalSize;
                    const loaded = event.loaded || 0;
                    const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
                    progressSubject.next({ loaded, total, percent, status: 'uploading' });
                } else if (event.type === HttpEventType.Response) {
                    progressSubject.next({
                        loaded: totalSize,
                        total: totalSize,
                        percent: 100,
                        status: 'completed',
                        response: event.body
                    });
                    progressSubject.complete();
                }
            },
            error: (err) => {
                progressSubject.next({ loaded: 0, total: totalSize, percent: 0, status: 'error', error: err });
                progressSubject.complete();
            }
        });
    }

    /**
     * Parallel bulk upload: groups files by base name and uploads up to `concurrency` groups
     * at the same time. Emits aggregated BulkUploadProgress with per-group details.
     */
    parallelBulkUpload(mediaType: string, files: File[], concurrency: number = 3): Observable<BulkUploadProgress> {
        const progressSubject = new BehaviorSubject<BulkUploadProgress>({
            groups: [],
            overallLoaded: 0,
            overallTotal: 0,
            overallPercent: 0,
            completedCount: 0,
            totalCount: 0,
            status: 'uploading',
            responses: []
        });

        const fileGroups = this.groupFilesByBaseName(files);
        const groupEntries = Array.from(fileGroups.entries());
        const totalGroups = groupEntries.length;

        // Initialize per-group progress
        const groupProgressMap: Map<string, FileGroupProgress> = new Map();
        for (const [name, groupFiles] of groupEntries) {
            const totalSize = groupFiles.reduce((acc, f) => acc + f.size, 0);
            groupProgressMap.set(name, {
                groupName: name,
                loaded: 0,
                total: totalSize,
                percent: 0,
                status: 'pending'
            });
        }

        const allResponses: any[] = [];
        let completedCount = 0;
        let activeCount = 0;
        let nextIndex = 0;

        const emitProgress = () => {
            const groups = Array.from(groupProgressMap.values());
            const overallLoaded = groups.reduce((acc, g) => acc + g.loaded, 0);
            const overallTotal = groups.reduce((acc, g) => acc + g.total, 0);
            const overallPercent = overallTotal > 0 ? Math.round((overallLoaded / overallTotal) * 100) : 0;
            const isComplete = completedCount === totalGroups;

            progressSubject.next({
                groups,
                overallLoaded,
                overallTotal,
                overallPercent,
                completedCount,
                totalCount: totalGroups,
                status: isComplete ? 'completed' : 'uploading',
                responses: [...allResponses]
            });

            if (isComplete) {
                progressSubject.complete();
            }
        };

        const startNext = () => {
            while (activeCount < concurrency && nextIndex < totalGroups) {
                const [groupName, groupFiles] = groupEntries[nextIndex];
                nextIndex++;
                activeCount++;

                const gp = groupProgressMap.get(groupName)!;
                gp.status = 'uploading';
                emitProgress();

                this.uploadFileGroup(mediaType, groupFiles, groupName).subscribe({
                    next: (progress) => {
                        const g = groupProgressMap.get(groupName)!;
                        if (progress.status === 'uploading') {
                            g.loaded = progress.loaded;
                            g.total = progress.total || g.total;
                            g.percent = progress.percent;
                            g.status = 'uploading';
                        } else if (progress.status === 'completed') {
                            g.loaded = g.total;
                            g.percent = 100;
                            g.status = 'completed';
                            g.response = progress.response;
                            if (Array.isArray(progress.response)) {
                                allResponses.push(...progress.response);
                            } else if (progress.response) {
                                allResponses.push(progress.response);
                            }
                            completedCount++;
                            activeCount--;
                            startNext();
                        } else if (progress.status === 'error') {
                            g.status = 'error';
                            g.error = progress.error;
                            completedCount++;
                            activeCount--;
                            startNext();
                        }
                        emitProgress();
                    },
                    error: () => {
                        const g = groupProgressMap.get(groupName)!;
                        g.status = 'error';
                        completedCount++;
                        activeCount--;
                        emitProgress();
                        startNext();
                    }
                });
            }
        };

        // Kick off initial batch
        if (totalGroups === 0) {
            progressSubject.next({
                groups: [],
                overallLoaded: 0,
                overallTotal: 0,
                overallPercent: 100,
                completedCount: 0,
                totalCount: 0,
                status: 'completed',
                responses: []
            });
            progressSubject.complete();
        } else {
            startNext();
        }

        return progressSubject.asObservable();
    }
}
