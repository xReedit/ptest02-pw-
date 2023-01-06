import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DatosFacturacionClienteComponent } from './datos-facturacion-cliente.component';

describe('DatosFacturacionClienteComponent', () => {
  let component: DatosFacturacionClienteComponent;
  let fixture: ComponentFixture<DatosFacturacionClienteComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DatosFacturacionClienteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatosFacturacionClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
