import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CompDatosReservaComponent } from './comp-datos-reserva.component';

describe('CompDatosReservaComponent', () => {
  let component: CompDatosReservaComponent;
  let fixture: ComponentFixture<CompDatosReservaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CompDatosReservaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompDatosReservaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
