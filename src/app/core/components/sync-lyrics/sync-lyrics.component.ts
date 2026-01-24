import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ElementRef,
  ViewChild
} from '@angular/core';
import { LyricsService, LyricLine } from '../../service/lyrics.service';

@Component({
  selector: 'app-sync-lyrics',
  template: `
    <div class="lyrics-container" #lyricsContainer>
      <div *ngIf="loading" class="lyrics-loading">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Loading lyrics...</span>
      </div>
      
      <div *ngIf="!loading && lyrics.length === 0" class="lyrics-empty">
        <i class="pi pi-file-o"></i>
        <span>No lyrics available</span>
      </div>
      
      <div *ngIf="!loading && lyrics.length > 0" class="lyrics-list">
        <div 
          *ngFor="let line of lyrics; let i = index"
          class="lyric-line"
          [class.active]="i === currentIndex"
          [class.past]="i < currentIndex"
          [attr.data-index]="i"
          #lyricLine>
          {{ line.text }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lyrics-container {
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      padding: 1.5rem;
      max-height: 300px;
      overflow-y: auto;
      scroll-behavior: smooth;
      position: relative;
    }

    .lyrics-container::-webkit-scrollbar {
      width: 6px;
    }

    .lyrics-container::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.1);
      border-radius: 3px;
    }

    .lyrics-container::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.3);
      border-radius: 3px;
    }

    .lyrics-loading, .lyrics-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: rgba(255,255,255,0.5);
      gap: 0.5rem;
    }

    .lyrics-loading i, .lyrics-empty i {
      font-size: 2rem;
    }

    .lyrics-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .lyric-line {
      font-size: 1.1rem;
      line-height: 1.6;
      color: rgba(255,255,255,0.4);
      transition: all 0.3s ease;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      text-align: center;
    }

    .lyric-line.past {
      color: rgba(255,255,255,0.3);
    }

    .lyric-line.active {
      color: #ffffff;
      font-size: 1.3rem;
      font-weight: 600;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
      box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
      transform: scale(1.02);
    }

    /* Karaoke-style gradient animation */
    @keyframes karaoke {
      from { background-position: -100% 0; }
      to { background-position: 100% 0; }
    }
  `]
})
export class SyncLyricsComponent implements OnChanges, OnDestroy {
  @Input() lyricsUrl: string = '';
  @Input() currentTime: number = 0;

  @ViewChild('lyricsContainer') lyricsContainer!: ElementRef<HTMLDivElement>;

  lyrics: LyricLine[] = [];
  currentIndex: number = -1;
  loading: boolean = false;

  private lastScrolledIndex: number = -1;

  constructor(private lyricsService: LyricsService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lyricsUrl'] && this.lyricsUrl) {
      this.loadLyrics();
    }

    if (changes['currentTime'] && this.lyrics.length > 0) {
      this.updateCurrentLine();
    }
  }

  private loadLyrics(): void {
    console.log('[SyncLyrics] Loading lyrics from:', this.lyricsUrl);
    this.loading = true;
    this.lyrics = [];
    this.currentIndex = -1;

    this.lyricsService.loadLyrics(this.lyricsUrl).subscribe({
      next: (lyrics) => {
        console.log('[SyncLyrics] Loaded lyrics:', lyrics.length, 'lines');
        this.lyrics = lyrics;
        this.loading = false;
      },
      error: (err) => {
        console.error('[SyncLyrics] Error loading lyrics:', err);
        this.loading = false;
      }
    });
  }

  private updateCurrentLine(): void {
    const newIndex = this.lyricsService.getCurrentLyricIndex(this.lyrics, this.currentTime);

    if (newIndex !== this.currentIndex) {
      this.currentIndex = newIndex;

      // Auto-scroll to current line
      if (newIndex !== -1 && newIndex !== this.lastScrolledIndex) {
        this.lastScrolledIndex = newIndex;
        this.scrollToCurrentLine();
      }
    }
  }

  private scrollToCurrentLine(): void {
    setTimeout(() => {
      const container = this.lyricsContainer?.nativeElement;
      if (!container) return;

      const activeElement = container.querySelector('.lyric-line.active') as HTMLElement;
      if (activeElement) {
        const containerHeight = container.clientHeight;
        const elementTop = activeElement.offsetTop;
        const elementHeight = activeElement.clientHeight;

        // Center the active line in the container
        const scrollTo = elementTop - (containerHeight / 2) + (elementHeight / 2);
        container.scrollTo({ top: scrollTo, behavior: 'smooth' });
      }
    }, 50);
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}
