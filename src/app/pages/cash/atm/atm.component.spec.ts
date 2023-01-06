import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AtmComponent } from './atm.component';

describe('AtmComponent', () => {
  let component: AtmComponent;
  let fixture: ComponentFixture<AtmComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AtmComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AtmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
