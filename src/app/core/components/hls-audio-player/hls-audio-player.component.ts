import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Output,
  EventEmitter
} from '@angular/core';
import Hls from 'hls.js';

@Component({
  selector: 'app-hls-audio-player',
  template: `
    <div class="audio-player-wrapper">
      <!-- Prominent Thumbnail Display -->
      <div class="thumbnail-display">
        <img *ngIf="posterUrl" [src]="posterUrl" alt="Audio Thumbnail" class="main-thumbnail">
        <div *ngIf="!posterUrl" class="thumbnail-placeholder">
          <i class="pi pi-music"></i>
        </div>
        <!-- Playing animation overlay -->
        <div class="playing-overlay" *ngIf="isPlaying">
          <div class="equalizer">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>
        <!-- Play/Pause button overlay -->
        <div class="play-overlay" (click)="togglePlayPause()">
          <i class="pi" [ngClass]="isPlaying ? 'pi-pause' : 'pi-play'"></i>
        </div>
      </div>

      <!-- Audio Controls -->
      <div class="audio-controls p-3">
        <div class="progress-container mb-2">
          <input type="range" class="progress-bar"
                 [value]="currentTime"
                 [max]="duration"
                 (input)="onSeek($event)">
          <div class="time-display">
            <span>{{formatTime(currentTime)}}</span>
            <span>{{formatTime(duration)}}</span>
          </div>
        </div>
        <div class="control-buttons flex align-items-center justify-content-center gap-3">
          <button class="control-btn" (click)="skipBackward()">
            <i class="pi pi-replay"></i>
          </button>
          <button class="control-btn play-btn" (click)="togglePlayPause()">
            <i class="pi" [ngClass]="isPlaying ? 'pi-pause' : 'pi-play'"></i>
          </button>
          <button class="control-btn" (click)="skipForward()">
            <i class="pi pi-forward"></i>
          </button>
        </div>
        <audio
          #audioPlayer
          crossorigin="anonymous"
          (timeupdate)="onTimeUpdate()"
          (loadedmetadata)="onMetadataLoaded()"
          (play)="onPlay()"
          (pause)="onPause()"
          style="display: none;">
        </audio>
      </div>

      <!-- Synchronized Lyrics -->
      <div class="lyrics-section" *ngIf="lyricsUrl">
        <app-sync-lyrics
          [lyricsUrl]="lyricsUrl"
          [currentTime]="currentTime">
        </app-sync-lyrics>
      </div>
    </div>
  `,
  styles: [`
    .audio-player-wrapper {
      width: 100%;
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.1);
    }

    .thumbnail-display {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      max-height: 400px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .main-thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumbnail-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;

      i {
        font-size: 5rem;
        color: rgba(255,255,255,0.5);
      }
    }

    .playing-overlay {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
    }

    .equalizer {
      display: flex;
      gap: 4px;
      height: 30px;
      align-items: flex-end;

      span {
        width: 6px;
        background: rgba(255,255,255,0.8);
        border-radius: 3px;
        animation: equalize 0.5s ease-in-out infinite alternate;

        &:nth-child(1) { animation-delay: 0s; height: 10px; }
        &:nth-child(2) { animation-delay: 0.1s; height: 20px; }
        &:nth-child(3) { animation-delay: 0.2s; height: 15px; }
        &:nth-child(4) { animation-delay: 0.3s; height: 25px; }
        &:nth-child(5) { animation-delay: 0.4s; height: 12px; }
      }
    }

    @keyframes equalize {
      from { height: 10px; }
      to { height: 30px; }
    }

    .play-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80px;
      height: 80px;
      background: rgba(0,0,0,0.5);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      opacity: 0;

      &:hover {
        background: rgba(0,0,0,0.7);
        transform: translate(-50%, -50%) scale(1.1);
      }

      i {
        font-size: 2rem;
        color: white;
        margin-left: 4px;
      }
    }

    .thumbnail-display:hover .play-overlay {
      opacity: 1;
    }

    .audio-controls {
      background: rgba(0,0,0,0.3);
    }

    .progress-container {
      width: 100%;
    }

    .progress-bar {
      width: 100%;
      height: 6px;
      -webkit-appearance: none;
      appearance: none;
      background: rgba(255,255,255,0.2);
      border-radius: 3px;
      cursor: pointer;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        background: #6366f1;
        border-radius: 50%;
        cursor: pointer;
      }

      &::-moz-range-thumb {
        width: 14px;
        height: 14px;
        background: #6366f1;
        border-radius: 50%;
        cursor: pointer;
        border: none;
      }
    }

    .time-display {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: rgba(255,255,255,0.7);
      margin-top: 4px;
    }

    .control-buttons {
      margin-top: 0.5rem;
    }

    .control-btn {
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255,255,255,0.1);
      }

      i {
        font-size: 1.2rem;
      }
    }

    .play-btn {
      background: #6366f1;
      width: 50px;
      height: 50px;

      &:hover {
        background: #5558e3;
      }

      i {
        font-size: 1.5rem;
      }
    }

    .lyrics-section {
      border-top: 1px solid rgba(255,255,255,0.1);
      padding: 1rem;
      background: rgba(0,0,0,0.2);
    }
  `]
})
export class HlsAudioPlayerComponent
  implements OnChanges, AfterViewInit, OnDestroy {

  @Input() url: string = '';
  @Input() posterUrl: string = '';
  @Input() lyricsUrl: string = '';

  @Output() timeUpdate = new EventEmitter<number>();

  @ViewChild('audioPlayer', { static: true })
  audioPlayer!: ElementRef<HTMLAudioElement>;

  currentTime: number = 0;
  duration: number = 0;
  isPlaying: boolean = false;
  private hls?: Hls;

  ngAfterViewInit() {
    console.log('[HlsAudioPlayer] Initialized with lyricsUrl:', this.lyricsUrl);
    if (this.url) {
      this.initPlayer();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['url'] && !changes['url'].firstChange) {
      this.initPlayer();
    }
  }

  onTimeUpdate(): void {
    const audio = this.audioPlayer.nativeElement;
    this.currentTime = audio.currentTime;
    this.timeUpdate.emit(this.currentTime);
  }

  onMetadataLoaded(): void {
    const audio = this.audioPlayer.nativeElement;
    this.duration = audio.duration || 0;
  }

  onPlay(): void {
    this.isPlaying = true;
  }

  onPause(): void {
    this.isPlaying = false;
  }

  togglePlayPause(): void {
    const audio = this.audioPlayer.nativeElement;
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }

  onSeek(event: Event): void {
    const input = event.target as HTMLInputElement;
    const audio = this.audioPlayer.nativeElement;
    audio.currentTime = parseFloat(input.value);
  }

  skipForward(): void {
    const audio = this.audioPlayer.nativeElement;
    audio.currentTime = Math.min(audio.currentTime + 10, this.duration);
  }

  skipBackward(): void {
    const audio = this.audioPlayer.nativeElement;
    audio.currentTime = Math.max(audio.currentTime - 10, 0);
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private initPlayer(): void {
    if (!this.url) return;

    this.cleanUp();

    const audio = this.audioPlayer.nativeElement;

    // 🔹 hls.js path (Chrome, Firefox, Edge)
    if (Hls.isSupported()) {
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        // 🔥 CORS-SAFE CONFIG
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        }
      });

      this.hls.loadSource(this.url);
      this.hls.attachMedia(audio);

      this.hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Fatal network error encountered, trying to recover', data);
              this.hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Fatal media error encountered, trying to recover', data);
              this.hls?.recoverMediaError();
              break;
            default:
              this.cleanUp();
              break;
          }
        }
      });

    }
    // 🔹 Native Safari / iOS
    else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      audio.src = this.url;
      audio.load();
    }
  }

  private cleanUp(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = undefined;
    }

    const audio = this.audioPlayer?.nativeElement;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
  }

  ngOnDestroy(): void {
    this.cleanUp();
  }
}

