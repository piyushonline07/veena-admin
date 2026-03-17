import { Component, OnInit, OnDestroy } from '@angular/core';
import { MediaService } from '../../core/service/media.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-media-link',
  templateUrl: './media-link.component.html',
  styleUrls: ['./media-link.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class MediaLinkComponent implements OnInit, OnDestroy {
  // Paginated media lists
  audioList: any[] = [];
  videoList: any[] = [];

  // Search queries
  audioSearchQuery = '';
  videoSearchQuery = '';

  // The item selected from either panel (audio or video) to inspect in center
  selectedItem: any = null;

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

  // Dialog visibility
  showLinkDialog = false;
  // The item to link TO (chosen in the dialog)
  dialogTarget: any = null;
  // Full list of opposite-type items loaded for the dialog dropdown
  dialogOptionsList: any[] = [];
  isLoadingDialogOptions = false;

  // Debounce subjects for search
  private audioSearch$ = new Subject<string>();
  private videoSearch$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  private apiUrl = `${environment.apiBaseUrl}/api/admin/media`;

  constructor(
    private mediaService: MediaService,
    private msg: MessageService,
    private confirmService: ConfirmationService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.audioSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.audioSearchQuery = query;
      this.resetAndLoadAudio();
    });

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

  // ───── Audio loading ─────

  private resetAndLoadAudio(): void {
    this.audioList = [];
    this.audioPage = 0;
    this.audioTotalPages = 0;
    this.loadAudioPage(0);
  }

  loadAudioPage(page: number): void {
    if (page === 0) { this.isLoadingAudio = true; } else { this.isLoadingMoreAudio = true; }

    const query = this.audioSearchQuery?.trim() || undefined;
    this.mediaService.getMediaList(page, this.PAGE_SIZE, query, { mediaType: 'AUDIO' }).subscribe({
      next: (resp) => {
        const items = resp?.content || [];
        this.audioList = page === 0 ? items : [...this.audioList, ...items];
        this.audioPage = resp?.number ?? page;
        this.audioTotalPages = resp?.totalPages ?? 0;
        this.audioTotalElements = resp?.totalElements ?? 0;
        this.refreshSelectedItem();
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
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
      this.loadMoreAudio();
    }
  }

  loadMoreAudio(): void {
    if (this.isLoadingMoreAudio || this.isLoadingAudio) return;
    if (this.audioPage + 1 >= this.audioTotalPages) return;
    this.loadAudioPage(this.audioPage + 1);
  }

  // ───── Video loading ─────

  private resetAndLoadVideo(): void {
    this.videoList = [];
    this.videoPage = 0;
    this.videoTotalPages = 0;
    this.loadVideoPage(0);
  }

  loadVideoPage(page: number): void {
    if (page === 0) { this.isLoadingVideo = true; } else { this.isLoadingMoreVideo = true; }

    const query = this.videoSearchQuery?.trim() || undefined;
    this.mediaService.getMediaList(page, this.PAGE_SIZE, query, { mediaType: 'VIDEO' }).subscribe({
      next: (resp) => {
        const items = resp?.content || [];
        this.videoList = page === 0 ? items : [...this.videoList, ...items];
        this.videoPage = resp?.number ?? page;
        this.videoTotalPages = resp?.totalPages ?? 0;
        this.videoTotalElements = resp?.totalElements ?? 0;
        this.refreshSelectedItem();
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

  // ───── Search handlers ─────

  onAudioSearch(query: string): void { this.audioSearch$.next(query); }
  onVideoSearch(query: string): void { this.videoSearch$.next(query); }

  // ───── Refresh helper ─────

  private refreshSelectedItem(): void {
    if (!this.selectedItem) return;
    const list = this.selectedItem.mediaType === 'AUDIO' ? this.audioList : this.videoList;
    const fresh = list.find((m: any) => m.id === this.selectedItem.id);
    if (fresh) { this.selectedItem = fresh; }
  }

  reloadAll(): void {
    this.audioList = [];
    this.audioPage = 0;
    this.loadAudioPage(0);
    this.videoList = [];
    this.videoPage = 0;
    this.loadVideoPage(0);
  }

  // ───── Selection ─────

  selectAudio(audio: any): void { this.selectedItem = audio; }
  selectVideo(video: any): void { this.selectedItem = video; }

  // ───── Linked media helper ─────

  /** Returns the linked partner info for any item (audio or video).
   *  Uses the linkedMedia object returned by the API — works regardless of pagination. */
  getLinkedPartner(item: any): any {
    if (!item?.linkedMediaId) return null;
    if (item.linkedMedia) return item.linkedMedia;
    // Fallback: search in local lists
    return this.audioList.find((m: any) => m.id === item.linkedMediaId)
        || this.videoList.find((m: any) => m.id === item.linkedMediaId)
        || null;
  }

  // ───── Dialog ─────

  openLinkDialog(): void {
    this.dialogTarget = null;
    this.dialogOptionsList = [];
    this.showLinkDialog = true;

    if (!this.selectedItem) return;

    // Load ALL items of the opposite type for the dialog dropdown
    const oppositeType = this.selectedItem.mediaType === 'AUDIO' ? 'VIDEO' : 'AUDIO';
    this.isLoadingDialogOptions = true;
    this.mediaService.getMediaList(0, 10000, undefined, { mediaType: oppositeType }).subscribe({
      next: (resp) => {
        const items = resp?.content || [];
        // Sort: unlinked items first
        this.dialogOptionsList = items.sort((a: any, b: any) => {
          const aLinked = a.linkedMediaId ? 1 : 0;
          const bLinked = b.linkedMediaId ? 1 : 0;
          return aLinked - bLinked;
        });
        this.isLoadingDialogOptions = false;
      },
      error: () => {
        // Fallback to currently loaded panel list
        const list = this.selectedItem.mediaType === 'AUDIO' ? this.videoList : this.audioList;
        this.dialogOptionsList = [...list].sort((a: any, b: any) => {
          const aLinked = a.linkedMediaId ? 1 : 0;
          const bLinked = b.linkedMediaId ? 1 : 0;
          return aLinked - bLinked;
        });
        this.isLoadingDialogOptions = false;
      }
    });
  }

  closeLinkDialog(): void {
    this.showLinkDialog = false;
    this.dialogTarget = null;
    this.dialogOptionsList = [];
  }

  /** Returns the list of candidates to link with (opposite type, all loaded). */
  get dialogOptions(): any[] {
    if (!this.selectedItem) return [];
    // Use the fully loaded list from the API
    if (this.dialogOptionsList.length > 0) {
      return this.dialogOptionsList;
    }
    // Fallback to panel lists if dialog options haven't loaded yet
    const list = this.selectedItem.mediaType === 'AUDIO' ? this.videoList : this.audioList;
    return [...list].sort((a: any, b: any) => {
      const aLinked = a.linkedMediaId ? 1 : 0;
      const bLinked = b.linkedMediaId ? 1 : 0;
      return aLinked - bLinked;
    });
  }

  get dialogTargetTypeLabel(): string {
    return this.selectedItem?.mediaType === 'AUDIO' ? 'Video' : 'Audio';
  }

  // ───── Link / Unlink ─────

  linkMedia(): void {
    if (!this.selectedItem || !this.dialogTarget) {
      this.msg.add({ severity: 'warn', summary: 'Selection Required', detail: 'Select both items to link' });
      return;
    }

    const sourceId = this.selectedItem.id;
    const targetId = this.dialogTarget.id;

    // Check if target is already linked to something else — warn user
    if (this.dialogTarget.linkedMediaId && this.dialogTarget.linkedMediaId !== sourceId) {
      const existingName = this.dialogTarget.linkedMedia?.title || 'another song';
      this.confirmService.confirm({
        message: `"${this.dialogTarget.title}" is already linked to "${existingName}". That existing link will be replaced. Continue?`,
        header: 'Replace Existing Link',
        icon: 'pi pi-exclamation-triangle',
        accept: () => this.performLink(sourceId, targetId)
      });
      return;
    }

    // Check if source is already linked to something else
    if (this.selectedItem.linkedMediaId && this.selectedItem.linkedMediaId !== targetId) {
      const existingName = this.selectedItem.linkedMedia?.title || 'another song';
      this.confirmService.confirm({
        message: `"${this.selectedItem.title}" is already linked to "${existingName}". That existing link will be replaced. Continue?`,
        header: 'Replace Existing Link',
        icon: 'pi pi-exclamation-triangle',
        accept: () => this.performLink(sourceId, targetId)
      });
      return;
    }

    this.performLink(sourceId, targetId);
  }

  private performLink(sourceId: string, targetId: string): void {
    this.isLinking = true;
    this.http.post(`${this.apiUrl}/link`, { sourceId, targetId }).subscribe({
      next: () => {
        this.isLinking = false;
        this.msg.add({ severity: 'success', summary: 'Linked', detail: `"${this.selectedItem.title}" ↔ "${this.dialogTarget.title}"` });
        this.showLinkDialog = false;
        this.dialogTarget = null;
        this.reloadAll();
      },
      error: (err) => {
        this.isLinking = false;
        this.msg.add({ severity: 'error', summary: 'Failed to link', detail: err?.error?.message || 'An error occurred' });
      }
    });
  }

  unlinkItem(item: any): void {
    if (!item) return;
    this.isLinking = true;
    this.http.post(`${this.apiUrl}/unlink`, { sourceId: item.id }).subscribe({
      next: () => {
        this.isLinking = false;
        this.msg.add({ severity: 'info', summary: 'Unlinked', detail: `"${item.title}" has been unlinked` });
        this.reloadAll();
      },
      error: (err) => {
        this.isLinking = false;
        this.msg.add({ severity: 'error', summary: 'Failed to unlink', detail: err?.error?.message || 'An error occurred' });
      }
    });
  }

  // ───── Counts ─────

  getLinkedCount(): number {
    return this.audioList.filter((a: any) => a.linkedMediaId).length;
  }

  getUnlinkedAudioCount(): number {
    return this.audioList.filter((a: any) => !a.linkedMediaId).length;
  }
}
