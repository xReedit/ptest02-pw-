import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogDireccionClienteDeliveryComponent } from './dialog-direccion-cliente-delivery.component';

describe('DialogDireccionClienteDeliveryComponent', () => {
  let component: DialogDireccionClienteDeliveryComponent;
  let fixture: ComponentFixture<DialogDireccionClienteDeliveryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogDireccionClienteDeliveryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogDireccionClienteDeliveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
