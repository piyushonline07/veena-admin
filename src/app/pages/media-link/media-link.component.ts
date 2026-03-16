import { Component, OnInit } from '@angular/core';
import { MediaService } from '../../core/service/media.service';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-media-link',
  templateUrl: './media-link.component.html',
  styleUrls: ['./media-link.component.scss'],
  providers: [MessageService]
})
export class MediaLinkComponent implements OnInit {
  // All media lists
  audioList: any[] = [];
  videoList: any[] = [];

  // Filtered lists for display
  filteredAudioList: any[] = [];
  filteredVideoList: any[] = [];

  // Search queries
  audioSearchQuery = '';
  videoSearchQuery = '';

  // Selected items
  selectedAudio: any = null;
  selectedVideo: any = null;

  // Loading states
  isLoadingAudio = false;
  isLoadingVideo = false;
  isLinking = false;

  // Dialog visibility
  showLinkDialog = false;

  private apiUrl = `${environment.apiBaseUrl}/api/admin/media`;

  constructor(
    private mediaService: MediaService,
    private msg: MessageService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadAllMedia();
  }

  loadAllMedia(): void {
    this.isLoadingAudio = true;
    this.isLoadingVideo = true;

    const audio$ = this.mediaService.getMediaList(0, 1000, undefined, { mediaType: 'AUDIO' });
    const video$ = this.mediaService.getMediaList(0, 1000, undefined, { mediaType: 'VIDEO' });

    forkJoin([audio$, video$]).subscribe({
      next: ([audioPage, videoPage]) => {
        this.audioList = audioPage?.content || [];
        this.videoList = videoPage?.content || [];

        this.filteredAudioList = [...this.audioList];
        this.filteredVideoList = [...this.videoList];

        // Refresh selected items with fresh data from the reload
        if (this.selectedAudio) {
          const freshAudio = this.audioList.find(a => a.id === this.selectedAudio.id);
          this.selectedAudio = freshAudio || null;
        }
        if (this.selectedVideo) {
          const freshVideo = this.videoList.find(v => v.id === this.selectedVideo.id);
          this.selectedVideo = freshVideo || null;
        }

        this.isLoadingAudio = false;
        this.isLoadingVideo = false;
      },
      error: () => {
        this.audioList = [];
        this.videoList = [];
        this.filteredAudioList = [];
        this.filteredVideoList = [];
        this.isLoadingAudio = false;
        this.isLoadingVideo = false;
      }
    });
  }

  onAudioSearch(): void {
    const query = this.audioSearchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredAudioList = [...this.audioList];
    } else {
      this.filteredAudioList = this.audioList.filter(a =>
        a.title?.toLowerCase().includes(query) ||
        a.artist?.name?.toLowerCase().includes(query)
      );
    }
  }

  onVideoSearch(): void {
    const query = this.videoSearchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredVideoList = [...this.videoList];
    } else {
      this.filteredVideoList = this.videoList.filter(v =>
        v.title?.toLowerCase().includes(query) ||
        v.artist?.name?.toLowerCase().includes(query)
      );
    }
  }

  selectAudio(audio: any): void {
    this.selectedAudio = audio;
  }

  selectVideo(video: any): void {
    this.selectedVideo = video;
  }

  openLinkDialog(): void {
    this.showLinkDialog = true;
  }

  closeLinkDialog(): void {
    this.showLinkDialog = false;
  }

  getLinkedVideo(audio: any): any {
    if (!audio?.linkedMediaId) return null;
    // First check if linkedMedia is already in the response
    if (audio.linkedMedia) return audio.linkedMedia;
    // Fallback: search in local video list
    return this.videoList.find(v => v.id === audio.linkedMediaId);
  }

  getLinkedAudio(video: any): any {
    if (!video) return null;
    // First check if video has linkedMediaId pointing to an audio
    if (video.linkedMediaId) {
      const fromList = this.audioList.find(a => a.id === video.linkedMediaId);
      if (fromList) return fromList;
    }
    // Fallback: find audio that links to this video
    return this.audioList.find(a => a.linkedMediaId === video.id);
  }

  linkMedia(): void {
    if (!this.selectedAudio || !this.selectedVideo) {
      this.msg.add({ severity: 'warn', summary: 'Selection Required', detail: 'Select both audio and video to link' });
      return;
    }

    this.isLinking = true;
    this.http.post(`${this.apiUrl}/link`, {
      sourceId: this.selectedAudio.id,
      targetId: this.selectedVideo.id
    }).subscribe({
      next: () => {
        this.isLinking = false;
        this.msg.add({ severity: 'success', summary: 'Success', detail: `"${this.selectedAudio.title}" linked to "${this.selectedVideo.title}"` });
        this.showLinkDialog = false;
        this.loadAllMedia();
      },
      error: (err) => {
        this.isLinking = false;
        this.msg.add({ severity: 'error', summary: 'Failed to link', detail: err?.error?.message || 'An error occurred' });
      }
    });
  }

  unlinkAudio(audio: any): void {
    if (!audio) return;

    this.isLinking = true;
    this.http.post(`${this.apiUrl}/unlink`, {
      sourceId: audio.id
    }).subscribe({
      next: () => {
        this.isLinking = false;
        this.msg.add({ severity: 'info', summary: 'Unlinked', detail: `"${audio.title}" has been unlinked` });
        // loadAllMedia will refresh selectedAudio with fresh data from API
        this.loadAllMedia();
      },
      error: (err) => {
        this.isLinking = false;
        this.msg.add({ severity: 'error', summary: 'Failed to unlink', detail: err?.error?.message || 'An error occurred' });
      }
    });
  }

  getLinkedCount(): number {
    return this.audioList.filter(a => a.linkedMediaId).length;
  }

  getUnlinkedAudioCount(): number {
    return this.audioList.filter(a => !a.linkedMediaId).length;
  }
}
