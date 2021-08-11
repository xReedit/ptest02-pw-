import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompListItemPedidoClienteComponent } from './comp-list-item-pedido-cliente.component';

describe('CompListItemPedidoClienteComponent', () => {
  let component: CompListItemPedidoClienteComponent;
  let fixture: ComponentFixture<CompListItemPedidoClienteComponent>;

  beforeEach(async(() => {
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
