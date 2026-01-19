import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HlsAudioPlayerComponent } from './hls-audio-player.component';

describe('HlsAudioPlayerComponent', () => {
  let component: HlsAudioPlayerComponent;
  let fixture: ComponentFixture<HlsAudioPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HlsAudioPlayerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HlsAudioPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
