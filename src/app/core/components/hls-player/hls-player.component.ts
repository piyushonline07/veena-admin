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
        [style.max-height]="maxHeight">
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

  @ViewChild('mediaPlayer', { static: true })
  mediaPlayer!: ElementRef<HTMLVideoElement>;

  private hls?: Hls;

  ngAfterViewInit() {
    if (this.url) {
      this.initPlayer();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['url'] && !changes['url'].firstChange) {
      this.initPlayer();
    }
  }

  private initPlayer(): void {
    if (!this.url) return;

    this.cleanUp();

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
