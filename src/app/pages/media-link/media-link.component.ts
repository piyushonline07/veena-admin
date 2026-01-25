import { Component, OnInit } from '@angular/core';
import { MediaService } from '../../core/service/media.service';
import { MessageService } from 'primeng/api';

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

  constructor(private mediaService: MediaService, private msg: MessageService) {}

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
      this.msg.add({ severity: 'warn', summary: 'Select an audio (left) and a video (right)' });
      return;
    }
    // Basic client-side validation
    if (this.selectedA.mediaType !== 'AUDIO' || this.selectedB.mediaType !== 'VIDEO') {
      this.msg.add({ severity: 'error', summary: 'Left must be audio and right must be video' });
      return;
    }

    fetch('/api/admin/media/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId: this.selectedA.id, targetId: this.selectedB.id })
    }).then(res => {
      if (res.ok) {
        this.msg.add({ severity: 'success', summary: 'Linked successfully' });
      } else {
        res.text().then(t => this.msg.add({ severity: 'error', summary: 'Failed to link', detail: t || undefined }));
      }
    }).catch(() => this.msg.add({ severity: 'error', summary: 'Failed to link' }));
  }

  unlink() {
    if (!this.selectedA) {
      this.msg.add({ severity: 'warn', summary: 'Select audio (left) to unlink' });
      return;
    }
    fetch('/api/admin/media/unlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId: this.selectedA.id })
    }).then(res => {
      if (res.ok) {
        this.msg.add({ severity: 'info', summary: 'Unlinked successfully' });
      } else {
        res.text().then(t => this.msg.add({ severity: 'error', summary: 'Failed to unlink', detail: t || undefined }));
      }
    }).catch(() => this.msg.add({ severity: 'error', summary: 'Failed to unlink' }));
  }
}
