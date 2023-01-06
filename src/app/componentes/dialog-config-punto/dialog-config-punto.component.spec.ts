import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DialogConfigPuntoComponent } from './dialog-config-punto.component';

describe('DialogConfigPuntoComponent', () => {
  let component: DialogConfigPuntoComponent;
  let fixture: ComponentFixture<DialogConfigPuntoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogConfigPuntoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogConfigPuntoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
