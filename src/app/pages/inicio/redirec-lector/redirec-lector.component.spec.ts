import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RedirecLectorComponent } from './redirec-lector.component';

describe('RedirecLectorComponent', () => {
  let component: RedirecLectorComponent;
  let fixture: ComponentFixture<RedirecLectorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RedirecLectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RedirecLectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
