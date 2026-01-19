import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HlsPlayerComponent } from './hls-player.component';

describe('HlsPlayerComponent', () => {
  let component: HlsPlayerComponent;
  let fixture: ComponentFixture<HlsPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HlsPlayerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HlsPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
