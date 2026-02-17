import { Component, OnInit } from '@angular/core';
import { MediaService } from '../../core/service/media.service';
import { ArtistService } from '../../core/service/artist.service';
import { AlbumService } from '../../core/service/album.service';
import { CreditService, Credit } from '../../core/service/credit.service';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
    selector: 'app-media-list',
    templateUrl: './media-list.component.html',
    styleUrls: ['./media-list.component.scss'],
    providers: [MessageService, ConfirmationService]
})
export class MediaListComponent implements OnInit {
    mediaList: any[] = [];
    totalRecords: number = 0;
    loading: boolean = true;
    rows: number = 10;
    first: number = 0;
    searchQuery: string = '';
    viewMode: 'list' | 'grid' = 'list';

    mediaDialog: boolean = false;
    previewDialog: boolean = false;
    selectedMedia: any = {};
    selectedMediaForPreview: any = null;
    savingMedia: boolean = false;

    // Artists and Albums for dropdowns
    artistsList: any[] = [];
    albumsList: any[] = [];

    // Credits for dropdowns
    composersList: Credit[] = [];
    lyricistsList: Credit[] = [];
    producersList: Credit[] = [];

    // File upload state
    newThumbnailFile: File | null = null;
    newLyricsFile: File | null = null;

    visibilityOptions: any[] = [
        { label: 'Private', value: 'PRIVATE' },
        { label: 'Unlisted', value: 'UNLISTED' },
        { label: 'Public', value: 'PUBLIC' }
    ];

    constructor(
        private mediaService: MediaService,
        private artistService: ArtistService,
        private albumService: AlbumService,
        private creditService: CreditService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) { }

    ngOnInit(): void {
        this.loadMedia(0, this.rows);
        this.loadArtistsAndAlbums();
        this.loadCredits();
    }

    loadCredits(): void {
        // Load composers
        this.creditService.getAllComposers().subscribe({
            next: (data) => {
                this.composersList = data || [];
            },
            error: () => {
                console.error('Failed to load composers');
            }
        });

        // Load lyricists
        this.creditService.getAllLyricists().subscribe({
            next: (data) => {
                this.lyricistsList = data || [];
            },
            error: () => {
                console.error('Failed to load lyricists');
            }
        });

        // Load producers
        this.creditService.getAllProducers().subscribe({
            next: (data) => {
                this.producersList = data || [];
            },
            error: () => {
                console.error('Failed to load producers');
            }
        });
    }

    loadArtistsAndAlbums(): void {
        // Load artists
        this.artistService.getArtists(0, 100).subscribe({
            next: (data) => {
                this.artistsList = data.content || [];
            },
            error: () => {
                console.error('Failed to load artists');
            }
        });

        // Load albums
        this.albumService.getAlbums(0, 100).subscribe({
            next: (data) => {
                this.albumsList = data.content || [];
            },
            error: () => {
                console.error('Failed to load albums');
            }
        });
    }

    previewMedia(media: any) {
        console.log('[MediaList] Preview media:', media);
        console.log('[MediaList] lyricsUrl:', media.lyricsUrl);
        this.selectedMediaForPreview = { ...media };
        this.previewDialog = true;
    }

    closePreview() {
        this.previewDialog = false;
        this.selectedMediaForPreview = null;
    }

    loadMedia(page: number, size: number) {
        this.loading = true;
        this.mediaService.getMediaList(page, size, this.searchQuery).subscribe({
            next: (data) => {
                this.mediaList = data.content;
                this.totalRecords = data.totalElements;
                this.loading = false;
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load media list' });
                this.loading = false;
                console.error(err);
            }
        });
    }

    onPageChange(event: any) {
        const page = event.page !== undefined ? event.page : (event.first / event.rows);
        this.loadMedia(page, event.rows);
    }

    onSearch() {
        this.loadMedia(0, this.rows);
    }

    editMedia(media: any) {
        this.selectedMedia = {
            ...media,
            artistId: media.artist?.id || null,
            albumId: media.album?.id || null,
            subArtistIds: media.subArtists?.map((a: any) => a.id) || [],
            composerId: media.composer?.id || null,
            lyricistId: media.lyricist?.id || null,
            producerId: media.producer?.id || null
        };
        this.newThumbnailFile = null;
        this.newLyricsFile = null;
        this.mediaDialog = true;
    }

    deleteMedia(media: any) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${media.title}"? This will also delete all associated files from storage.`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.mediaService.deleteMedia(media.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Media and associated files deleted' });
                        this.loadMedia(0, this.rows);
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete media' });
                        console.error(err);
                    }
                });
            }
        });
    }

    hideDialog() {
        this.mediaDialog = false;
        this.newThumbnailFile = null;
        this.newLyricsFile = null;
    }

    onThumbnailSelect(event: any): void {
        const file = event.files?.[0];
        if (file) {
            this.newThumbnailFile = file;
        }
    }

    clearThumbnail(): void {
        this.newThumbnailFile = null;
    }

    onLyricsSelect(event: any): void {
        const file = event.files?.[0];
        if (file) {
            this.newLyricsFile = file;
        }
    }

    clearLyrics(): void {
        this.newLyricsFile = null;
    }

    saveMedia() {
        this.savingMedia = true;

        // Check if we need to upload files
        const hasFiles = this.newThumbnailFile || this.newLyricsFile;
        const hasRelationshipChanges = this.selectedMedia.artistId !== undefined || this.selectedMedia.albumId !== undefined;
        const hasCreditsChanges = this.selectedMedia.composerId !== undefined ||
                                  this.selectedMedia.lyricistId !== undefined ||
                                  this.selectedMedia.producerId !== undefined;
        const hasSubArtists = this.selectedMedia.subArtistIds && this.selectedMedia.subArtistIds.length > 0;

        if (hasFiles || hasRelationshipChanges || hasCreditsChanges || hasSubArtists) {
            // Use the new multipart endpoint
            const formData = new FormData();
            formData.append('title', this.selectedMedia.title);
            formData.append('description', this.selectedMedia.description || '');
            formData.append('visibility', this.selectedMedia.visibility);

            if (this.selectedMedia.artistId !== undefined) {
                formData.append('artistId', this.selectedMedia.artistId?.toString() || '0');
            }
            if (this.selectedMedia.albumId !== undefined) {
                formData.append('albumId', this.selectedMedia.albumId?.toString() || '0');
            }

            // Sub-artists (featuring artists)
            if (this.selectedMedia.subArtistIds && this.selectedMedia.subArtistIds.length > 0) {
                this.selectedMedia.subArtistIds.forEach((id: number) => {
                    formData.append('subArtistIds', id.toString());
                });
            }

            // Composer/Lyricist/Producer credits (as credit IDs)
            if (this.selectedMedia.composerId !== undefined) {
                formData.append('composerId', this.selectedMedia.composerId?.toString() || '0');
            }
            if (this.selectedMedia.lyricistId !== undefined) {
                formData.append('lyricistId', this.selectedMedia.lyricistId?.toString() || '0');
            }
            if (this.selectedMedia.producerId !== undefined) {
                formData.append('producerId', this.selectedMedia.producerId?.toString() || '0');
            }

            if (this.newThumbnailFile) {
                formData.append('thumbnail', this.newThumbnailFile);
            }
            if (this.newLyricsFile) {
                formData.append('lyrics', this.newLyricsFile);
            }

            this.mediaService.updateMediaWithFiles(this.selectedMedia.id, formData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Media updated successfully' });
                    this.loadMedia(0, this.rows);
                    this.hideDialog();
                    this.savingMedia = false;
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update media' });
                    console.error(err);
                    this.savingMedia = false;
                }
            });
        } else {
            // Use the simple PUT endpoint
            const payload = {
                title: this.selectedMedia.title,
                description: this.selectedMedia.description,
                visibility: this.selectedMedia.visibility
            };

            this.mediaService.updateMedia(this.selectedMedia.id, payload).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Media updated' });
                    this.loadMedia(0, this.rows);
                    this.hideDialog();
                    this.savingMedia = false;
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update media' });
                    console.error(err);
                    this.savingMedia = false;
                }
            });
        }
    }
}
