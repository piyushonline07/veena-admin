import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import Hls from "hls.js";



@Component({
  selector: 'app-hls-player',
  templateUrl: './hls-player.component.html',
  styleUrls: ['./hls-player.component.scss']
})
export class HlsPlayerComponent
  implements AfterViewInit, OnDestroy {

  @Input() src!: string;   // HLS (.m3u8) URL
  @Input() autoplay = false;

  @ViewChild('video', { static: true })
  videoRef!: ElementRef<HTMLVideoElement>;

  private hls?: Hls;

  ngAfterViewInit() {
    const video = this.videoRef.nativeElement;

    if (!this.src) return;

    // Safari (native HLS)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = this.src;
    }
    // Other browsers
    else if (Hls.isSupported()) {
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });

      this.hls.loadSource(this.src);
      this.hls.attachMedia(video);
    }
  }

  ngOnDestroy() {
    this.hls?.destroy();
  }
}
