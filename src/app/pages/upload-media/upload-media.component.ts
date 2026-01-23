import { Component, OnInit } from '@angular/core';
import { MediaService } from '../../core/service/media.service';
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

    file: File | null = null;
    thumbnail: File | null = null;
    lyrics: File | null = null;
    loading: boolean = false;
    lastUploadedMedia: any = null;

    constructor(
        private mediaService: MediaService,
        private messageService: MessageService
    ) { }

    ngOnInit(): void {
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
        const formData = new FormData();
        formData.append('title', this.title);
        formData.append('description', this.description);
        formData.append('mediaType', this.mediaType.value);
        formData.append('file', this.file);
        if (this.thumbnail) {
            formData.append('thumbnail', this.thumbnail);
        }
        if (this.lyrics) {
            formData.append('lyrics', this.lyrics);
        }

        this.mediaService.uploadMedia(formData).subscribe({
            next: (res) => {
                this.loading = false;
                this.lastUploadedMedia = res;
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Media uploaded successfully' });
                this.resetForm();
            },
            error: (err) => {
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload failed' });
                console.error(err);
            }
        });
    }

    resetForm() {
        this.title = '';
        this.description = '';
        this.mediaType = null;
        this.file = null;
        this.thumbnail = null;
        this.lyrics = null;
    }
}
