import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import Hls from 'hls.js';
import { MediaService } from '../../service/media.service';

@Component({
  selector: 'app-hls-player',
  template: `
    <div class="player-wrapper">
      <video
        #mediaPlayer
        [poster]="posterUrl"
        controls
        playsinline
        crossorigin="anonymous"
        class="w-full h-full block"
        [style.max-height]="maxHeight"
        (play)="onPlay()">
      </video>
    </div>
  `,
  styles: [`
    .player-wrapper {
      width: 100%;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class HlsPlayerComponent
  implements OnChanges, AfterViewInit, OnDestroy {

  @Input() url: string = '';
  @Input() posterUrl: string = '';
  @Input() mediaType: 'VIDEO' | 'AUDIO' = 'VIDEO';
  @Input() maxHeight: string = '500px';
  @Input() mediaId: string = '';

  @ViewChild('mediaPlayer', { static: true })
  mediaPlayer!: ElementRef<HTMLVideoElement>;

  private hls?: Hls;
  private playRecorded: boolean = false;

  constructor(private mediaService: MediaService) {}

  ngAfterViewInit() {
    if (this.url) {
      this.initPlayer();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['url'] && !changes['url'].firstChange) {
      this.playRecorded = false; // Reset for new media
      this.initPlayer();
    }
    if (changes['mediaId']) {
      this.playRecorded = false; // Reset for new media
    }
  }

  /**
   * Called when video starts playing.
   * Records the play event to the backend API.
   */
  onPlay(): void {
    if (!this.playRecorded && this.mediaId) {
      this.playRecorded = true;
      this.mediaService.recordPlay(this.mediaId, 0).subscribe({
        next: () => console.log('Play recorded for video:', this.mediaId),
        error: (err) => console.warn('Failed to record play:', err)
      });
    }
  }

  private initPlayer(): void {
    if (!this.url) return;

    this.cleanUp();
    this.playRecorded = false;

    const video = this.mediaPlayer.nativeElement;

    // 🔹 hls.js path (Chrome, Firefox, Edge)
    if (Hls.isSupported()) {
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,

        // 🔥 CORS-SAFE CONFIG
        xhrSetup: (xhr) => {
          xhr.withCredentials = false; // VERY IMPORTANT
        }
      });

      this.hls.loadSource(this.url);
      this.hls.attachMedia(video);

      this.hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('HLS error', data);
      });

    }
    // 🔹 Native Safari / iOS
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = this.url;
      video.load();
    }
  }

  private cleanUp(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = undefined;
    }

    const video = this.mediaPlayer?.nativeElement;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
  }

  ngOnDestroy(): void {
    this.cleanUp();
  }
}
