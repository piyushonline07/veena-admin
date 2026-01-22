import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import Hls from 'hls.js';

@Component({
    selector: 'app-hls-player',
    template: `
    <div class="player-wrapper">
      <video #mediaPlayer 
             [poster]="posterUrl"
             controls 
             playsinline 
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
export class HlsPlayerComponent implements OnChanges, OnDestroy, AfterViewInit {
    @Input() url: string = '';
    @Input() posterUrl: string = '';
    @Input() mediaType: 'VIDEO' | 'AUDIO' = 'VIDEO';
    @Input() maxHeight: string = '500px';

    @ViewChild('mediaPlayer') mediaPlayer!: ElementRef<HTMLVideoElement>;

    private hls?: Hls;

    constructor() { }

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

    private initPlayer() {
        this.cleanUp();

        const video = this.mediaPlayer.nativeElement;

        if (!this.url) return;

        if (Hls.isSupported()) {
            this.hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            this.hls.loadSource(this.url);
            this.hls.attachMedia(video);
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                // Only auto-play if explicitly desired, or handle via user interaction
                // video.play(); 
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native Safari support
            video.src = this.url;
        }
    }

    private cleanUp() {
        if (this.hls) {
            this.hls.destroy();
            this.hls = undefined;
        }
        if (this.mediaPlayer) {
            const video = this.mediaPlayer.nativeElement;
            video.src = '';
            video.load();
        }
    }

    ngOnDestroy() {
        this.cleanUp();
    }
}
