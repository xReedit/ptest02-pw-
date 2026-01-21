import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompListPedidosHoldingComponent } from './comp-list-pedidos-holding.component';

describe('CompListPedidosHoldingComponent', () => {
  let component: CompListPedidosHoldingComponent;
  let fixture: ComponentFixture<CompListPedidosHoldingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompListPedidosHoldingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompListPedidosHoldingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
