import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidoConfirmadoMsjComponent } from './pedido-confirmado-msj.component';

describe('PedidoConfirmadoMsjComponent', () => {
  let component: PedidoConfirmadoMsjComponent;
  let fixture: ComponentFixture<PedidoConfirmadoMsjComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PedidoConfirmadoMsjComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PedidoConfirmadoMsjComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
