import { Component, OnInit } from '@angular/core';
import { MediaService, BatchUpdateRequest, UploadProgress } from '../../core/service/media.service';
import { ArtistService, Artist } from '../../core/service/artist.service';
import { AlbumService, Album } from '../../core/service/album.service';
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

    // Uploaded media
    uploadedMedia: UploadedMedia[] = [];
    draftMedia: UploadedMedia[] = [];

    // Batch edit
    artists: Artist[] = [];
    albums: Album[] = [];
    selectedArtist: Artist | null = null;
    selectedAlbum: Album | null = null;
    batchTitle: string = '';
    batchDescription: string = '';
    updating: boolean = false;

    // Publish
    publishing: boolean = false;

    constructor(
        private mediaService: MediaService,
        private artistService: ArtistService,
        private albumService: AlbumService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) { }

    ngOnInit(): void {
        this.loadArtists();
        this.loadAlbums();
        this.loadDraftMedia();
    }

    loadArtists(): void {
        this.artistService.getAllActiveArtists().subscribe({
            next: (artists) => this.artists = artists,
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load artists' })
        });
    }

    loadAlbums(): void {
        this.albumService.getAllActiveAlbums().subscribe({
            next: (albums) => this.albums = albums,
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load albums' })
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
            this.filesToUpload = [...this.filesToUpload, ...Array.from(files) as File[]];
        }
    }

    removeFile(index: number): void {
        this.filesToUpload.splice(index, 1);
    }

    clearFiles(): void {
        this.filesToUpload = [];
    }

    // File type detection (strict formats: mp3 for audio, mp4 for video, vtt for lyrics)
    private mediaExtensions = ['mp3', 'mp4'];
    private thumbnailExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    private lyricsExtensions = ['vtt'];

    getFileExtension(filename: string): string {
        const lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : '';
    }

    getFileType(filename: string): string {
        const ext = this.getFileExtension(filename);
        if (this.mediaExtensions.includes(ext)) return 'Media';
        if (this.thumbnailExtensions.includes(ext)) return 'Thumbnail';
        if (this.lyricsExtensions.includes(ext)) return 'Lyrics';
        return 'Unknown';
    }

    getFileTypeSeverity(filename: string): string {
        const type = this.getFileType(filename);
        if (type === 'Media') return 'info';
        if (type === 'Thumbnail') return 'warning';
        if (type === 'Lyrics') return 'success';
        return 'secondary';
    }

    get mediaFileCount(): number {
        return this.filesToUpload.filter(f =>
            this.mediaExtensions.includes(this.getFileExtension(f.name))
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
        this.uploadStatus = 'Uploading to S3...';

        this.mediaService.bulkUploadMediaWithProgress(
            this.mediaType.value,
            this.filesToUpload
        ).subscribe({
            next: (progress) => {
                this.uploadProgress = progress.percent;
                this.uploadedBytes = progress.loaded;
                this.totalBytes = progress.total || this.totalBytes;

                if (progress.status === 'uploading') {
                    this.uploadStatus = `Uploading... ${this.formatFileSize(progress.loaded)} / ${this.formatFileSize(progress.total)}`;
                } else if (progress.status === 'completed') {
                    this.uploadStatus = 'Processing files...';
                    this.uploadedMedia = (progress.response || []).map((m: any) => ({
                        ...m,
                        selected: true
                    }));

                    const mediaCount = this.uploadedMedia.length;
                    const withThumbnail = this.uploadedMedia.filter(m => m.thumbnailUrl).length;
                    const withLyrics = this.uploadedMedia.filter(m => m.lyricsUrl).length;

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Upload Complete!',
                        detail: `${mediaCount} songs uploaded (${withThumbnail} with thumbnails, ${withLyrics} with lyrics)`
                    });

                    this.filesToUpload = [];
                    this.uploading = false;
                    this.uploadStatus = '';
                    this.currentStep = 1; // Move to metadata step
                    this.loadDraftMedia(); // Refresh draft list
                } else if (progress.status === 'error') {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to upload files' });
                    this.uploading = false;
                    this.uploadStatus = '';
                }
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to upload files' });
                this.uploading = false;
                this.uploadStatus = '';
            }
        });
    }

    // Selection
    get allMedia(): UploadedMedia[] {
        return [...this.uploadedMedia, ...this.draftMedia];
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
        if (this.selectedAlbum) {
            request.albumId = this.selectedAlbum.id;
        }
        if (this.batchTitle) {
            request.title = this.batchTitle;
        }
        if (this.batchDescription) {
            request.description = this.batchDescription;
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
                this.selectedAlbum = null;
                this.batchTitle = '';
                this.batchDescription = '';
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
}
