import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PedidoExpressComponent } from './pedido-express.component';

describe('PedidoExpressComponent', () => {
  let component: PedidoExpressComponent;
  let fixture: ComponentFixture<PedidoExpressComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PedidoExpressComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PedidoExpressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
