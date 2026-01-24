import { Component, OnInit } from '@angular/core';
import { MediaService } from '../../core/service/media.service';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-media-list',
    templateUrl: './media-list.component.html',
    styleUrls: ['./media-list.component.scss'],
    providers: [MessageService]
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

    visibilityOptions: any[] = [
        { label: 'Private', value: 'PRIVATE' },
        { label: 'Unlisted', value: 'UNLISTED' },
        { label: 'Public', value: 'PUBLIC' }
    ];

    constructor(
        private mediaService: MediaService,
        private messageService: MessageService
    ) { }

    ngOnInit(): void {
        this.loadMedia(0, this.rows);
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
        this.selectedMedia = { ...media };
        this.mediaDialog = true;
    }

    deleteMedia(media: any) {
        if (confirm(`Are you sure you want to delete "${media.title}"?`)) {
            this.mediaService.deleteMedia(media.id).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Media deleted' });
                    this.loadMedia(0, this.rows);
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete media' });
                    console.error(err);
                }
            });
        }
    }

    hideDialog() {
        this.mediaDialog = false;
    }

    saveMedia() {
        const payload = {
            title: this.selectedMedia.title,
            description: this.selectedMedia.description,
            visibility: this.selectedMedia.visibility
        };

        this.mediaService.updateMedia(this.selectedMedia.id, payload).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Media updated' });
                this.loadMedia(0, this.rows);
                this.mediaDialog = false;
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update media' });
                console.error(err);
            }
        });
    }
}
