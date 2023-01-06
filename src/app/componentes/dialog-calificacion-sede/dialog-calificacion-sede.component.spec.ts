import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DialogCalificacionSedeComponent } from './dialog-calificacion-sede.component';

describe('DialogCalificacionSedeComponent', () => {
  let component: DialogCalificacionSedeComponent;
  let fixture: ComponentFixture<DialogCalificacionSedeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogCalificacionSedeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogCalificacionSedeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
