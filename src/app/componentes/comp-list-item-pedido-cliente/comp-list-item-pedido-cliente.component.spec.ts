import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CompListItemPedidoClienteComponent } from './comp-list-item-pedido-cliente.component';

describe('CompListItemPedidoClienteComponent', () => {
  let component: CompListItemPedidoClienteComponent;
  let fixture: ComponentFixture<CompListItemPedidoClienteComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CompListItemPedidoClienteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompListItemPedidoClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
