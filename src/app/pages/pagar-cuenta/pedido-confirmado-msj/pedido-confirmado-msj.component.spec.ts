import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PedidoConfirmadoMsjComponent } from './pedido-confirmado-msj.component';

describe('PedidoConfirmadoMsjComponent', () => {
  let component: PedidoConfirmadoMsjComponent;
  let fixture: ComponentFixture<PedidoConfirmadoMsjComponent>;

  beforeEach(waitForAsync(() => {
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
