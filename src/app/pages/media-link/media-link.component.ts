import { Component, OnInit } from '@angular/core';
import { MediaService } from '../../core/service/media.service';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-media-link',
  templateUrl: './media-link.component.html',
  styleUrls: ['./media-link.component.scss'],
  providers: [MessageService]
})
export class MediaLinkComponent implements OnInit {
  queryA = '';
  queryB = '';
  listA: any[] = [];
  listB: any[] = [];
  selectedA: any = null; // AUDIO
  selectedB: any = null; // VIDEO
  isLoadingA = false;
  isLoadingB = false;
  isLinking = false;

  private apiUrl = `${environment.apiBaseUrl}/api/admin/media`;

  constructor(
    private mediaService: MediaService,
    private msg: MessageService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.searchA();
    this.searchB();
  }

  searchA() {
    this.isLoadingA = true;
    this.mediaService.getMediaList(0, 50, this.queryA).subscribe({
      next: (page) => {
        const items = page?.content || [];
        this.listA = items.filter((m: any) => m.mediaType === 'AUDIO');
        this.isLoadingA = false;
      },
      error: () => { this.listA = []; this.isLoadingA = false; }
    });
  }

  searchB() {
    this.isLoadingB = true;
    this.mediaService.getMediaList(0, 50, this.queryB).subscribe({
      next: (page) => {
        const items = page?.content || [];
        this.listB = items.filter((m: any) => m.mediaType === 'VIDEO');
        this.isLoadingB = false;
      },
      error: () => { this.listB = []; this.isLoadingB = false; }
    });
  }

  link() {
    if (!this.selectedA || !this.selectedB) {
      this.msg.add({ severity: 'warn', summary: 'Selection Required', detail: 'Select an audio (left) and a video (right)' });
      return;
    }
    // Basic client-side validation
    if (this.selectedA.mediaType !== 'AUDIO' || this.selectedB.mediaType !== 'VIDEO') {
      this.msg.add({ severity: 'error', summary: 'Invalid Selection', detail: 'Left must be audio and right must be video' });
      return;
    }

    this.isLinking = true;
    this.http.post(`${this.apiUrl}/link`, {
      sourceId: this.selectedA.id,
      targetId: this.selectedB.id
    }).subscribe({
      next: () => {
        this.isLinking = false;
        this.msg.add({ severity: 'success', summary: 'Success', detail: 'Media linked successfully' });
        // Refresh lists to show updated links
        this.searchA();
        this.searchB();
      },
      error: (err) => {
        this.isLinking = false;
        this.msg.add({ severity: 'error', summary: 'Failed to link', detail: err?.error?.message || 'An error occurred' });
      }
    });
  }

  unlink() {
    if (!this.selectedA) {
      this.msg.add({ severity: 'warn', summary: 'Selection Required', detail: 'Select audio (left) to unlink' });
      return;
    }

    this.isLinking = true;
    this.http.post(`${this.apiUrl}/unlink`, {
      sourceId: this.selectedA.id
    }).subscribe({
      next: () => {
        this.isLinking = false;
        this.msg.add({ severity: 'info', summary: 'Success', detail: 'Media unlinked successfully' });
        // Refresh lists
        this.searchA();
        this.searchB();
      },
      error: (err) => {
        this.isLinking = false;
        this.msg.add({ severity: 'error', summary: 'Failed to unlink', detail: err?.error?.message || 'An error occurred' });
      }
    });
  }
}
