import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import Hls from 'hls.js';

@Component({
  selector: 'app-hls-audio-player',
  template: `
    <audio
      #audio
      controls
      autoplay
      style="width: 100%">
    </audio>
  `,
})
export class HlsAudioPlayerComponent
  implements AfterViewInit, OnDestroy {

  @Input() src!: string;
  @ViewChild('audio', { static: false })
  audioRef!: ElementRef<HTMLAudioElement>;

  private hls?: Hls;

  ngAfterViewInit() {
    const audio = this.audioRef.nativeElement;

    if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari / iOS (native HLS)
      audio.src = this.src;
    } else if (Hls.isSupported()) {
      this.hls = new Hls();
      this.hls.loadSource(this.src);
      this.hls.attachMedia(audio);
    }
  }

  ngOnDestroy() {
    this.hls?.destroy();
  }
}
