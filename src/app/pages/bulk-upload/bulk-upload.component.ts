import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { MediaService, BatchUpdateRequest, UploadProgress, BulkUploadProgress, FileGroupProgress } from '../../core/service/media.service';
import { ArtistService, Artist } from '../../core/service/artist.service';
import { AlbumService, Album } from '../../core/service/album.service';
import { CreditService, Credit } from '../../core/service/credit.service';
import { MessageService, ConfirmationService } from 'primeng/api';

interface UploadedMedia {
    id: string;
    title: string;
    mediaType: string;
    status: string;
    visibility: string;
    artist?: any;
    album?: any;
    thumbnailUrl?: string;
    lyricsUrl?: string;
    fileSize?: number;
    fileExtension?: string;
    selected: boolean;
}

@Component({
    selector: 'app-bulk-upload',
    templateUrl: './bulk-upload.component.html',
    styleUrls: ['./bulk-upload.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class BulkUploadComponent implements OnInit {
    // Step management
    currentStep: number = 0;
    steps = [
        { label: 'Upload Files' },
        { label: 'Edit Metadata' },
        { label: 'Review & Publish' }
    ];

    // Upload state
    mediaType: any = { label: 'Audio', value: 'AUDIO' };
    mediaTypes = [
        { label: 'Audio', value: 'AUDIO' },
        { label: 'Video', value: 'VIDEO' }
    ];
    filesToUpload: File[] = [];
    uploading: boolean = false;
    uploadProgress: number = 0;
    uploadedBytes: number = 0;
    totalBytes: number = 0;
    uploadStatus: string = '';
    fileGroupProgress: FileGroupProgress[] = [];
    uploadConcurrency: number = 3;
    completedGroupCount: number = 0;
    totalGroupCount: number = 0;

    uploadedMedia: UploadedMedia[] = [];
    draftMedia: UploadedMedia[] = [];

    // Batch edit
    artists: Artist[] = [];
    albums: Album[] = [];
    composers: Credit[] = [];
    lyricists: Credit[] = [];
    producers: Credit[] = [];
    directors: Credit[] = [];
    selectedArtist: Artist | null = null;
    selectedSubArtists: Artist[] = [];
    selectedAlbum: Album | null = null;
    selectedComposer: Credit | null = null;
    selectedLyricist: Credit | null = null;
    selectedProducer: Credit | null = null;
    selectedDirector: Credit | null = null;
    batchTitle: string = '';
    batchDescription: string = '';
    batchReleaseDate: Date | null = null;
    batchMediaType: any = null;
    updating: boolean = false;

    // Publish
    publishing: boolean = false;

    constructor(
        private mediaService: MediaService,
        private artistService: ArtistService,
        private albumService: AlbumService,
        private creditService: CreditService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private cdr: ChangeDetectorRef,
        private ngZone: NgZone
    ) { }

    ngOnInit(): void {
        this.loadArtists();
        this.loadAlbums();
        this.loadComposers();
        this.loadLyricists();
        this.loadProducers();
        this.loadDirectors();
        this.loadDraftMedia();
    }

    ngOnDestroy(): void {
        this.stopKeepAlive();
    }

    /** Start pinging the backend every 2 minutes to keep the Cognito session alive during long uploads. */
    private startKeepAlive(): void {
        });
    }

    loadAlbums(): void {
        this.albumService.getAllActiveAlbums().subscribe({
            next: (albums) => this.albums = albums,
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load albums' })
        });
    }

    loadComposers(): void {
        this.creditService.getAllComposers().subscribe({
            next: (composers) => this.composers = composers,
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load composers' })
        });
    }

    loadLyricists(): void {
        this.creditService.getAllLyricists().subscribe({
            next: (lyricists) => this.lyricists = lyricists,
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load lyricists' })
        });
    }

    loadProducers(): void {
        this.creditService.getAllProducers().subscribe({
            next: (producers) => this.producers = producers,
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load producers' })
        });
    }

    loadDirectors(): void {
        this.creditService.getAllDirectors().subscribe({
            next: (directors) => this.directors = directors,
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load directors' })
        });
    }

    loadDraftMedia(): void {
        this.mediaService.getDraftMedia().subscribe({
            next: (media) => {
                this.draftMedia = media.map(m => ({
                    ...m,
                    selected: false
                }));
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load draft media' })
        });
    }

    // File selection
    onFilesSelected(event: any): void {
        const files = event.files || event.target?.files;
        if (files) {
            const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
            const validFiles: File[] = [];
            const oversizedFiles: string[] = [];
            const wrongTypeFiles: string[] = [];
            const allowedMedia = this.allowedMediaExtensions;
            const disallowedMedia = this.mediaType?.value === 'VIDEO' ? this.audioExtensions : this.videoExtensions;

            for (const file of Array.from(files) as File[]) {
                const ext = this.getFileExtension(file.name);

                // Reject media files that don't match selected type
                if (disallowedMedia.includes(ext)) {
                    wrongTypeFiles.push(file.name);
                    continue;
                }

                if (file.size > maxSize) {
                    oversizedFiles.push(file.name);
                } else {
                    validFiles.push(file);
                }
            }
            if (wrongTypeFiles.length > 0) {
                const selectedType = this.mediaType?.value === 'VIDEO' ? 'Video' : 'Audio';
                const allowedExts = allowedMedia.map(e => `.${e}`).join(', ');
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Wrong file type',
                    detail: `Skipped ${wrongTypeFiles.length} file(s) not matching "${selectedType}" type. Allowed media: ${allowedExts}. Skipped: ${wrongTypeFiles.join(', ')}`
                });
            }
            if (oversizedFiles.length > 0) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'File too large',
                    detail: `Skipped ${oversizedFiles.length} file(s) exceeding 10GB: ${oversizedFiles.join(', ')}`
                });
            }
            this.filesToUpload = [...this.filesToUpload, ...validFiles];
        }
    }

    removeFile(index: number): void {
        this.filesToUpload.splice(index, 1);
    }

    clearFiles(): void {
        this.filesToUpload = [];
    }

    onMediaTypeChange(): void {
        if (this.filesToUpload.length === 0) return;

        const disallowed = this.mediaType?.value === 'VIDEO' ? this.audioExtensions : this.videoExtensions;
        const invalidFiles = this.filesToUpload.filter(f => disallowed.includes(this.getFileExtension(f.name)));

        if (invalidFiles.length > 0) {
            this.filesToUpload = this.filesToUpload.filter(f => !disallowed.includes(this.getFileExtension(f.name)));
            const selectedType = this.mediaType?.value === 'VIDEO' ? 'Video' : 'Audio';
            this.messageService.add({
                severity: 'info',
                summary: 'Files removed',
                detail: `Removed ${invalidFiles.length} file(s) that don't match "${selectedType}" type: ${invalidFiles.map(f => f.name).join(', ')}`
            });
        }
    }

    // File type detection (strict formats based on selected media type)
    private audioExtensions = ['mp3', 'wav'];
    private videoExtensions = ['mp4', 'mov'];
    private thumbnailExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    private lyricsExtensions = ['vtt'];

    /** Returns allowed media extensions based on the currently selected media type */
    get allowedMediaExtensions(): string[] {
        return this.mediaType?.value === 'VIDEO' ? this.videoExtensions : this.audioExtensions;
    }

    /** All possible media extensions (audio + video) for general type detection */
    private get allMediaExtensions(): string[] {
        return [...this.audioExtensions, ...this.videoExtensions];
    }

    /** Accept string for the file picker based on selected media type */
    get acceptFileTypes(): string {
        const mediaExts = this.allowedMediaExtensions.map(e => `.${e}`).join(',');
        const thumbExts = this.thumbnailExtensions.map(e => `.${e}`).join(',');
        const lyricsExts = this.lyricsExtensions.map(e => `.${e}`).join(',');
        return `${mediaExts},${thumbExts},${lyricsExts}`;
    }

    getFileExtension(filename: string): string {
        const lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : '';
    }

    getFileType(filename: string): string {
        const ext = this.getFileExtension(filename);
        if (this.audioExtensions.includes(ext)) return 'Audio';
        if (this.videoExtensions.includes(ext)) return 'Video';
        if (this.thumbnailExtensions.includes(ext)) return 'Thumbnail';
        if (this.lyricsExtensions.includes(ext)) return 'Lyrics';
        return 'Unknown';
    }

    getFileTypeSeverity(filename: string): string {
        const type = this.getFileType(filename);
        if (type === 'Audio' || type === 'Video') return 'info';
        if (type === 'Thumbnail') return 'warning';
        if (type === 'Lyrics') return 'success';
        return 'secondary';
    }

    get mediaFileCount(): number {
        return this.filesToUpload.filter(f =>
            this.allowedMediaExtensions.includes(this.getFileExtension(f.name))
        ).length;
    }

    get thumbnailFileCount(): number {
        return this.filesToUpload.filter(f =>
            this.thumbnailExtensions.includes(this.getFileExtension(f.name))
        ).length;
    }

    get lyricsFileCount(): number {
        return this.filesToUpload.filter(f =>
            this.lyricsExtensions.includes(this.getFileExtension(f.name))
        ).length;
    }

    get totalFileSize(): number {
        return this.filesToUpload.reduce((acc, f) => acc + f.size, 0);
    }

    getFileExtensionLabel(filename: string): string {
        const ext = this.getFileExtension(filename);
        return ext ? `.${ext.toUpperCase()}` : '';
    }

    // Upload
    uploadFiles(): void {
        if (this.mediaFileCount === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please select at least one media file (audio/video)' });
            return;
        }

        this.uploading = true;
        this.uploadProgress = 0;
        this.uploadedBytes = 0;
        this.totalBytes = this.filesToUpload.reduce((acc, f) => acc + f.size, 0);
        this.fileGroupProgress = [];
        this.completedGroupCount = 0;
        this.totalGroupCount = 0;

        // Start keep-alive pings to prevent session expiry during long uploads
        this.startKeepAlive();

        const fileGroups = this.mediaService.groupFilesByBaseName(this.filesToUpload);
        this.totalGroupCount = fileGroups.size;
        this.uploadStatus = `Uploading ${this.totalGroupCount} file group(s) in parallel (${this.uploadConcurrency} at a time)...`;

        this.mediaService.parallelBulkUpload(
            this.mediaType.value,
            this.filesToUpload,
            this.uploadConcurrency
        ).subscribe({
            next: (progress: BulkUploadProgress) => {
                this.ngZone.run(() => {
                    this.uploadProgress = progress.overallPercent;
                    this.uploadedBytes = progress.overallLoaded;
                    this.totalBytes = progress.overallTotal || this.totalBytes;
                    this.fileGroupProgress = [...progress.groups];
                    this.completedGroupCount = progress.completedCount;
                    this.totalGroupCount = progress.totalCount;

                    if (progress.status === 'uploading') {
                    } else if (progress.status === 'completed') {
                        this.uploadStatus = 'Processing files...';
                        console.log('[BulkUpload] Upload completed. Responses:', progress.responses?.length,
                            'Groups:', progress.groups.map(g => `${g.groupName}:${g.status}`));

                        // Map uploaded media from responses (filter out null/invalid entries)
                        const validResponses = (progress.responses || []).filter((m: any) => m && m.id);
                        this.uploadedMedia = validResponses.map((m: any) => ({
                            ...m,
                            selected: true
                        }));

                        const mediaCount = this.uploadedMedia.length;
                        const withThumbnail = this.uploadedMedia.filter(m => m.thumbnailUrl).length;
                        const withLyrics = this.uploadedMedia.filter(m => m.lyricsUrl).length;
                        const errorCount = progress.groups.filter(g => g.status === 'error').length;
                        const successCount = progress.groups.filter(g => g.status === 'completed').length;

                        let detail = '';
                        if (mediaCount > 0) {
                            detail = `${mediaCount} songs uploaded (${withThumbnail} with thumbnails, ${withLyrics} with lyrics)`;
                        } else if (successCount > 0) {
                            detail = `${successCount} file group(s) uploaded successfully`;
                        }
                        if (errorCount > 0) {
                            detail += detail ? `. ${errorCount} group(s) failed.` : `${errorCount} group(s) failed.`;
                        }

                        this.messageService.add({
                            severity: errorCount > 0 && successCount === 0 ? 'error' : (errorCount > 0 ? 'warn' : 'success'),
                            summary: 'Upload Complete!',
                            detail
                        });

                        this.filesToUpload = [];
                        this.uploading = false;
                        this.uploadStatus = '';
                        this.stopKeepAlive();
                        this.currentStep = 1;
                        this.loadDraftMedia();
                    }
                    this.cdr.detectChanges();
                });
            },
            error: (err) => {
                this.ngZone.run(() => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to upload files' });
                    this.uploading = false;
                    this.uploadStatus = '';
                    this.stopKeepAlive();
                    this.cdr.detectChanges();
                });
            }
        });
    }

    // Selection
    get allMedia(): UploadedMedia[] {
        // Deduplicate: uploadedMedia takes priority (has selected: true)
        const uploadedIds = new Set(this.uploadedMedia.map(m => m.id));
        const uniqueDrafts = this.draftMedia.filter(m => !uploadedIds.has(m.id));
        return [...this.uploadedMedia, ...uniqueDrafts];
    }

    get selectedMedia(): UploadedMedia[] {
        return this.allMedia.filter(m => m.selected);
    }

    toggleSelectAll(checked: boolean): void {
        this.uploadedMedia.forEach(m => m.selected = checked);
        this.draftMedia.forEach(m => m.selected = checked);
    }

    get allSelected(): boolean {
        const all = this.allMedia;
        return all.length > 0 && all.every(m => m.selected);
    }

    set allSelected(value: boolean) {
        this.toggleSelectAll(value);
    }

    deleteMediaItem(media: UploadedMedia): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${media.title}"? This will permanently remove it and its files.`,
            header: 'Confirm Delete',
            icon: 'pi pi-trash',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.mediaService.deleteMedia(media.id).subscribe({
                    next: () => {
                        this.draftMedia = this.draftMedia.filter(m => m.id !== media.id);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Deleted',
                            detail: `"${media.title}" has been deleted`
                        });
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: `Failed to delete "${media.title}"`
                        });
                    }
                });
            }
        });
    }

    // Delete all selected media items
    deleteSelectedMedia(): void {
        const selected = this.selectedMedia;
        if (selected.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'No items selected' });
            return;
        }

        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${selected.length} selected item(s)? This will permanently remove them and their files.`,
            header: 'Confirm Batch Delete',
            icon: 'pi pi-trash',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                let successCount = 0;
                let errorCount = 0;
                let processed = 0;
                const total = selected.length;

                selected.forEach(media => {
                    this.mediaService.deleteMedia(media.id).subscribe({
                        next: () => {
                            this.uploadedMedia = this.uploadedMedia.filter(m => m.id !== media.id);
                            this.draftMedia = this.draftMedia.filter(m => m.id !== media.id);
                            successCount++;
                            processed++;
                            if (processed === total) {
                                this.showDeleteSummary(successCount, errorCount);
                            }
                        },
                        error: () => {
                            errorCount++;
                            processed++;
                            if (processed === total) {
                                this.showDeleteSummary(successCount, errorCount);
                            }
                        }
                    });
                });
            }
        });
    }

    private showDeleteSummary(successCount: number, errorCount: number): void {
        if (errorCount === 0) {
            this.messageService.add({
                severity: 'success',
                summary: 'Deleted',
                detail: `${successCount} item(s) deleted successfully`
            });
        } else {
            this.messageService.add({
                severity: 'warn',
                summary: 'Partially Deleted',
                detail: `${successCount} deleted, ${errorCount} failed`
            });
        }
    }

    // Batch update
    applyBatchUpdate(): void {
        const selectedIds = this.selectedMedia.map(m => m.id);

        if (selectedIds.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please select media items to update' });
            return;
        }

        const request: BatchUpdateRequest = {
            mediaIds: selectedIds
        };

        if (this.selectedArtist) {
            request.artistId = this.selectedArtist.id;
        }
        if (this.selectedSubArtists && this.selectedSubArtists.length > 0) {
            request.subArtistIds = this.selectedSubArtists.map(a => a.id).filter((id): id is number => id !== undefined);
        }
        if (this.selectedAlbum) {
            request.albumId = this.selectedAlbum.id;
        }
        if (this.batchTitle) {
            request.title = this.batchTitle;
        }
        if (this.batchDescription) {
            request.description = this.batchDescription;
        }
        if (this.selectedComposer) {
            request.composerName = this.selectedComposer.name;
        }
        if (this.selectedLyricist) {
            request.lyricistName = this.selectedLyricist.name;
        }
        if (this.selectedProducer) {
            request.producerName = this.selectedProducer.name;
        }
        if (this.selectedDirector) {
            request.directorName = this.selectedDirector.name;
        }
        if (this.batchReleaseDate) {
            const date = new Date(this.batchReleaseDate);
            request.releaseDate = date.toISOString().split('T')[0];
        }
        if (this.batchMediaType) {
            request.mediaType = this.batchMediaType.value;
        }

        this.updating = true;
        this.mediaService.batchUpdateMedia(request).subscribe({
            next: (updated) => {
                // Update local data
                updated.forEach(u => {
                    const idx = this.uploadedMedia.findIndex(m => m.id === u.id);
                    if (idx >= 0) {
                        this.uploadedMedia[idx] = { ...u, selected: true };
                    }
                    const draftIdx = this.draftMedia.findIndex(m => m.id === u.id);
                    if (draftIdx >= 0) {
                        this.draftMedia[draftIdx] = { ...u, selected: true };
                    }
                });

                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `${updated.length} items updated`
                });

                // Clear batch fields
                this.selectedArtist = null;
                this.selectedSubArtists = [];
                this.selectedAlbum = null;
                this.selectedComposer = null;
                this.selectedLyricist = null;
                this.selectedProducer = null;
                this.selectedDirector = null;
                this.batchTitle = '';
                this.batchDescription = '';
                this.batchReleaseDate = null;
                this.batchMediaType = null;
                this.updating = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update media' });
                this.updating = false;
            }
        });
    }

    // Publish
    goToPublish(): void {
        this.currentStep = 2;
    }

    get readyToPublish(): UploadedMedia[] {
        return this.selectedMedia.filter(m => m.status === 'READY');
    }

    get notReadyToPublish(): UploadedMedia[] {
        return this.selectedMedia.filter(m => m.status !== 'READY');
    }

    publishSelected(): void {
        const readyIds = this.readyToPublish.map(m => m.id);

        if (readyIds.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'No media ready to publish' });
            return;
        }

        this.confirmationService.confirm({
            message: `Are you sure you want to publish ${readyIds.length} media items? They will become publicly visible.`,
            header: 'Confirm Publish',
            icon: 'pi pi-globe',
            accept: () => {
                this.publishing = true;
                this.mediaService.batchPublishMedia(readyIds).subscribe({
                    next: (published) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Published!',
                            detail: `${published.length} items are now public`
                        });

                        // Remove published items from lists
                        this.uploadedMedia = this.uploadedMedia.filter(m => !readyIds.includes(m.id));
                        this.draftMedia = this.draftMedia.filter(m => !readyIds.includes(m.id));

                        this.publishing = false;

                        // Go back to step 1 if there are remaining drafts
                        if (this.draftMedia.length > 0 || this.uploadedMedia.length > 0) {
                            this.currentStep = 1;
                        } else {
                            this.currentStep = 0;
                        }
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to publish media' });
                        this.publishing = false;
                    }
                });
            }
        });
    }

    // Navigation
    nextStep(): void {
        if (this.currentStep < 2) {
            this.currentStep++;
        }
    }

    prevStep(): void {
        if (this.currentStep > 0) {
            this.currentStep--;
        }
    }

    getStatusSeverity(status: string): string {
        switch (status) {
            case 'READY': return 'success';
            case 'PROCESSING': return 'warning';
            case 'FAILED': return 'danger';
            default: return 'info';
        }
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getGroupStatusIcon(status: string): string {
        switch (status) {
            case 'completed': return 'pi pi-check-circle text-green-500';
            case 'uploading': return 'pi pi-spin pi-spinner text-primary';
            case 'error': return 'pi pi-times-circle text-red-500';
            default: return 'pi pi-clock text-gray-400';
        }
    }

    getGroupStatusSeverity(status: string): string {
        switch (status) {
            case 'completed': return 'success';
            case 'uploading': return 'info';
            case 'error': return 'danger';
            default: return 'secondary';
        }
    }
}
