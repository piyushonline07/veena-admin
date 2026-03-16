import { Component, OnInit } from '@angular/core';
import { MediaService } from '../../core/service/media.service';
import { ArtistService, Artist } from '../../core/service/artist.service';
import { AlbumService, Album } from '../../core/service/album.service';
import { CreditService, Credit } from '../../core/service/credit.service';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-upload-media',
    templateUrl: './upload-media.component.html',
    styleUrls: ['./upload-media.component.scss'],
    providers: [MessageService]
})
export class UploadMediaComponent implements OnInit {
    title: string = '';
    description: string = '';
    mediaType: any;
    mediaTypes: any[] = [
        { label: 'Video', value: 'VIDEO' },
        { label: 'Audio', value: 'AUDIO' }
    ];

    // Artist selection
    artists: Artist[] = [];
    selectedArtist: Artist | null = null;

    // Sub-artists (featuring artists)
    selectedSubArtists: Artist[] = [];

    // Composer/Lyricist credits (text fields - legacy)
    composerName: string = '';
    lyricistName: string = '';

    // Credit entity selections (dropdown)
    composers: Credit[] = [];
    lyricists: Credit[] = [];
    producers: Credit[] = [];
    directors: Credit[] = [];
    selectedComposer: Credit | null = null;
    selectedLyricist: Credit | null = null;
    selectedProducer: Credit | null = null;
    selectedDirector: Credit | null = null;

    // Album selection
    albums: Album[] = [];
    selectedAlbum: Album | null = null;

    // Release date
    releaseDate: Date | null = null;

    file: File | null = null;
    thumbnail: File | null = null;
    lyrics: File | null = null;
    loading: boolean = false;
    uploadProgress: number = 0;
    uploadedBytes: number = 0;
    totalBytes: number = 0;
    uploadStatus: string = '';
    lastUploadedMedia: any = null;

    constructor(
        private mediaService: MediaService,
        private artistService: ArtistService,
        private albumService: AlbumService,
        private creditService: CreditService,
        private messageService: MessageService
    ) { }

    ngOnInit(): void {
        this.loadArtists();
        this.loadAlbums();
        this.loadCredits();
    }

    loadArtists() {
        this.artistService.getAllActiveArtists().subscribe({
            next: (artists) => {
                this.artists = artists;
            },
            error: (err) => {
                console.error('Failed to load artists', err);
            }
        });
    }

    loadAlbums(): void {
        this.albumService.getAllActiveAlbums().subscribe({
            next: (albums) => {
                this.albums = albums;
            },
            error: (err) => {
                console.error('Failed to load albums', err);
            }
        });
    }

    loadCredits(): void {
        this.creditService.getAllComposers().subscribe({
            next: (data) => this.composers = data,
            error: (err) => console.error('Failed to load composers', err)
        });
        this.creditService.getAllLyricists().subscribe({
            next: (data) => this.lyricists = data,
            error: (err) => console.error('Failed to load lyricists', err)
        });
        this.creditService.getAllProducers().subscribe({
            next: (data) => this.producers = data,
            error: (err) => console.error('Failed to load producers', err)
        });
        this.creditService.getAllDirectors().subscribe({
            next: (data) => this.directors = data,
            error: (err) => console.error('Failed to load directors', err)
        });
    }

    onFileSelect(event: any, type: string) {
        if (type === 'file') {
            this.file = event.files[0];
        } else if (type === 'thumbnail') {
            this.thumbnail = event.files[0];
        } else if (type === 'lyrics') {
            this.lyrics = event.files[0];
        }
    }

    upload() {
        if (!this.title || !this.mediaType || !this.file) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please provide title, media type and source file.' });
            return;
        }

        this.loading = true;
        this.uploadProgress = 0;
        this.uploadedBytes = 0;
        this.totalBytes = this.file?.size || 0;
        this.uploadStatus = 'Uploading...';
        const formData = new FormData();
        formData.append('title', this.title);
        formData.append('description', this.description);
        formData.append('mediaType', this.mediaType.value);
        formData.append('file', this.file);

        if (this.selectedArtist?.id) {
            formData.append('artistId', this.selectedArtist.id.toString());
        }
        if (this.selectedAlbum?.id) {
            formData.append('albumId', this.selectedAlbum.id.toString());
        }

        // Sub-artists (featuring artists)
        if (this.selectedSubArtists && this.selectedSubArtists.length > 0) {
            this.selectedSubArtists.forEach(artist => {
                if (artist.id) {
                    formData.append('subArtistIds', artist.id.toString());
                }
            });
        }

        // Composer/Lyricist credits (text fields - legacy)
        if (this.composerName) {
            formData.append('composerName', this.composerName);
        }
        if (this.lyricistName) {
            formData.append('lyricistName', this.lyricistName);
        }

        // Credit entity IDs (dropdown selections)
        if (this.selectedComposer?.id) {
            formData.append('composerId', this.selectedComposer.id.toString());
        }
        if (this.selectedLyricist?.id) {
            formData.append('lyricistId', this.selectedLyricist.id.toString());
        }
        if (this.selectedProducer?.id) {
            formData.append('producerId', this.selectedProducer.id.toString());
        }
        if (this.selectedDirector?.id) {
            formData.append('directorId', this.selectedDirector.id.toString());
        }

        // Release date (format as ISO date string YYYY-MM-DD)
        if (this.releaseDate) {
            const date = new Date(this.releaseDate);
            formData.append('releaseDate', date.toISOString().split('T')[0]);
        }

        if (this.thumbnail) {
            formData.append('thumbnail', this.thumbnail);
        }
        if (this.lyrics) {
            formData.append('lyrics', this.lyrics);
        }

        this.mediaService.uploadMediaWithProgress(formData).subscribe({
            next: (progress) => {
                this.uploadProgress = progress.percent;
                this.uploadedBytes = progress.loaded;
                this.totalBytes = progress.total || this.totalBytes;

                if (progress.status === 'uploading') {
                    this.uploadStatus = `Uploading... ${this.formatFileSize(progress.loaded)} / ${this.formatFileSize(progress.total)}`;
                } else if (progress.status === 'completed') {
                    this.loading = false;
                    this.uploadProgress = 0;
                    this.uploadStatus = '';
                    this.lastUploadedMedia = progress.response;

                    let message = 'Media uploaded successfully';
                    if (this.selectedAlbum) {
                        message += ` and added to "${this.selectedAlbum.name}"`;
                    }

                    this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
                    this.resetForm();
                } else if (progress.status === 'error') {
                    this.loading = false;
                    this.uploadProgress = 0;
                    this.uploadStatus = '';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload failed' });
                }
            },
            error: (err) => {
                this.loading = false;
                this.uploadProgress = 0;
                this.uploadStatus = '';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload failed' });
                console.error(err);
            }
        });
    }

    resetForm() {
        this.title = '';
        this.description = '';
        this.mediaType = null;
        this.selectedArtist = null;
        this.selectedSubArtists = [];
        this.composerName = '';
        this.lyricistName = '';
        this.selectedComposer = null;
        this.selectedLyricist = null;
        this.selectedProducer = null;
        this.selectedDirector = null;
        this.selectedAlbum = null;
        this.releaseDate = null;
        this.file = null;
        this.thumbnail = null;
        this.lyrics = null;
        this.uploadProgress = 0;
        this.uploadedBytes = 0;
        this.totalBytes = 0;
        this.uploadStatus = '';
    }

    formatFileSize(bytes: number): string {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
