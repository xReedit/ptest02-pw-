import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MozoVirtualOnSpeechComponent } from './mozo-virtual-on-speech.component';

describe('MozoVirtualOnSpeechComponent', () => {
  let component: MozoVirtualOnSpeechComponent;
  let fixture: ComponentFixture<MozoVirtualOnSpeechComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MozoVirtualOnSpeechComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MozoVirtualOnSpeechComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
