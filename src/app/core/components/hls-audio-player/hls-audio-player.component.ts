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
    <div class="audio-player-wrapper p-4 border-round shadow-1 bg-gray-900">
      <div class="flex align-items-center gap-3">
        <div class="thumbnail-small" *ngIf="posterUrl">
          <img [src]="posterUrl" alt="Audio Thumbnail" class="border-round" width="60" height="60">
        </div>
        <div class="flex-grow-1">
          <audio
            #audioPlayer
            controls
            crossorigin="anonymous"
            class="w-full"
            (timeupdate)="onTimeUpdate()">
          </audio>
        </div>
      </div>
      
      <!-- Synchronized Lyrics -->
      <div class="lyrics-section mt-3" *ngIf="lyricsUrl">
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
      background: #1a1a1a;
      border: 1px solid #333;
    }
    .thumbnail-small img {
      object-fit: cover;
    }
    audio {
      height: 40px;
    }
    .lyrics-section {
      border-top: 1px solid rgba(255,255,255,0.1);
      padding-top: 1rem;
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

