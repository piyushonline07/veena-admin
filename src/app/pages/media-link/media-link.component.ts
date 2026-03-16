import { Component, OnInit, OnDestroy } from '@angular/core';
import { MediaService } from '../../core/service/media.service';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-media-link',
  templateUrl: './media-link.component.html',
  styleUrls: ['./media-link.component.scss'],
  providers: [MessageService]
})
export class MediaLinkComponent implements OnInit, OnDestroy {
  // Paginated media lists
  audioList: any[] = [];
  videoList: any[] = [];

  // Search queries
  audioSearchQuery = '';
  videoSearchQuery = '';

  // Selected items
  selectedAudio: any = null;
  selectedVideo: any = null;

  // Loading states
  isLoadingAudio = false;
  isLoadingVideo = false;
  isLoadingMoreAudio = false;
  isLoadingMoreVideo = false;
  isLinking = false;

  // Pagination state
  audioPage = 0;
  videoPage = 0;
  audioTotalPages = 0;
  videoTotalPages = 0;
  audioTotalElements = 0;
  videoTotalElements = 0;
  private readonly PAGE_SIZE = 30;

  // Linked/unlinked counts (from first page metadata)
  linkedCount = 0;
  unlinkedAudioCount = 0;

  // Dialog visibility
  showLinkDialog = false;

  // Debounce subjects for search
  private audioSearch$ = new Subject<string>();
  private videoSearch$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  private apiUrl = `${environment.apiBaseUrl}/api/admin/media`;

  constructor(
    private mediaService: MediaService,
    private msg: MessageService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Setup debounced search for audio
    this.audioSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.audioSearchQuery = query;
      this.resetAndLoadAudio();
    });

    // Setup debounced search for video
    this.videoSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.videoSearchQuery = query;
      this.resetAndLoadVideo();
    });

    this.loadAudioPage(0);
    this.loadVideoPage(0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Audio loading ---

  private resetAndLoadAudio(): void {
    this.audioList = [];
    this.audioPage = 0;
    this.audioTotalPages = 0;
    this.loadAudioPage(0);
  }

  loadAudioPage(page: number): void {
    if (page === 0) {
      this.isLoadingAudio = true;
    } else {
      this.isLoadingMoreAudio = true;
    }

    const query = this.audioSearchQuery?.trim() || undefined;
    this.mediaService.getMediaList(page, this.PAGE_SIZE, query, { mediaType: 'AUDIO' }).subscribe({
      next: (resp) => {
        const items = resp?.content || [];
        if (page === 0) {
          this.audioList = items;
        } else {
          this.audioList = [...this.audioList, ...items];
        }
        this.audioPage = resp?.number ?? page;
        this.audioTotalPages = resp?.totalPages ?? 0;
        this.audioTotalElements = resp?.totalElements ?? 0;
        this.updateLinkedCounts();
        this.refreshSelectedAudio();
        this.isLoadingAudio = false;
        this.isLoadingMoreAudio = false;
      },
      error: () => {
        if (page === 0) { this.audioList = []; }
        this.isLoadingAudio = false;
        this.isLoadingMoreAudio = false;
      }
    });
  }

  onAudioScroll(event: Event): void {
    const el = event.target as HTMLElement;
    // Trigger load when scrolled to within 100px of the bottom
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
      this.loadMoreAudio();
    }
  }

  loadMoreAudio(): void {
    if (this.isLoadingMoreAudio || this.isLoadingAudio) return;
    if (this.audioPage + 1 >= this.audioTotalPages) return;
    this.loadAudioPage(this.audioPage + 1);
  }

  // --- Video loading ---

  private resetAndLoadVideo(): void {
    this.videoList = [];
    this.videoPage = 0;
    this.videoTotalPages = 0;
    this.loadVideoPage(0);
  }

  loadVideoPage(page: number): void {
    if (page === 0) {
      this.isLoadingVideo = true;
    } else {
      this.isLoadingMoreVideo = true;
    }

    const query = this.videoSearchQuery?.trim() || undefined;
    this.mediaService.getMediaList(page, this.PAGE_SIZE, query, { mediaType: 'VIDEO' }).subscribe({
      next: (resp) => {
        const items = resp?.content || [];
        if (page === 0) {
          this.videoList = items;
        } else {
          this.videoList = [...this.videoList, ...items];
        }
        this.videoPage = resp?.number ?? page;
        this.videoTotalPages = resp?.totalPages ?? 0;
        this.videoTotalElements = resp?.totalElements ?? 0;
        this.refreshSelectedVideo();
        this.isLoadingVideo = false;
        this.isLoadingMoreVideo = false;
      },
      error: () => {
        if (page === 0) { this.videoList = []; }
        this.isLoadingVideo = false;
        this.isLoadingMoreVideo = false;
      }
    });
  }

  onVideoScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
      this.loadMoreVideo();
    }
  }

  loadMoreVideo(): void {
    if (this.isLoadingMoreVideo || this.isLoadingVideo) return;
    if (this.videoPage + 1 >= this.videoTotalPages) return;
    this.loadVideoPage(this.videoPage + 1);
  }

  // --- Search handlers ---

  onAudioSearch(query: string): void {
    this.audioSearch$.next(query);
  }

  onVideoSearch(query: string): void {
    this.videoSearch$.next(query);
  }

  // --- Refresh helpers ---

  private refreshSelectedAudio(): void {
    if (this.selectedAudio) {
      const fresh = this.audioList.find(a => a.id === this.selectedAudio.id);
      if (fresh) { this.selectedAudio = fresh; }
    }
  }

  private refreshSelectedVideo(): void {
    if (this.selectedVideo) {
      const fresh = this.videoList.find(v => v.id === this.selectedVideo.id);
      if (fresh) { this.selectedVideo = fresh; }
    }
  }

  private updateLinkedCounts(): void {
    this.linkedCount = this.audioList.filter(a => a.linkedMediaId).length;
    this.unlinkedAudioCount = this.audioList.filter(a => !a.linkedMediaId).length;
  }

  // Reload both panels (after link/unlink), preserving search queries
  reloadAll(): void {
    this.audioList = [];
    this.audioPage = 0;
    this.loadAudioPage(0);
    this.videoList = [];
    this.videoPage = 0;
    this.loadVideoPage(0);
  }

  // --- Selection ---

  selectAudio(audio: any): void {
    this.selectedAudio = audio;
  }

  selectVideo(video: any): void {
    this.selectedVideo = video;
  }

  // --- Dialog ---

  openLinkDialog(): void {
    this.showLinkDialog = true;
  }

  closeLinkDialog(): void {
    this.showLinkDialog = false;
  }

  // --- Linked media helpers ---

  getLinkedVideo(audio: any): any {
    if (!audio?.linkedMediaId) return null;
    // linkedMedia is populated by the backend API response
    if (audio.linkedMedia) return audio.linkedMedia;
    // Fallback: search in locally loaded video list
    return this.videoList.find(v => v.id === audio.linkedMediaId);
  }

  getLinkedAudio(video: any): any {
    if (!video) return null;
    if (video.linkedMediaId) {
      const fromList = this.audioList.find(a => a.id === video.linkedMediaId);
      if (fromList) return fromList;
    }
    return this.audioList.find(a => a.linkedMediaId === video.id);
  }

  // --- Link / Unlink ---

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
        this.reloadAll();
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
        this.reloadAll();
      },
      error: (err) => {
        this.isLinking = false;
        this.msg.add({ severity: 'error', summary: 'Failed to unlink', detail: err?.error?.message || 'An error occurred' });
      }
    });
  }

  getLinkedCount(): number {
    return this.linkedCount;
  }

  getUnlinkedAudioCount(): number {
    return this.unlinkedAudioCount;
  }
}
