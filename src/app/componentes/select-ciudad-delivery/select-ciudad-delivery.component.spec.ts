import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectCiudadDeliveryComponent } from './select-ciudad-delivery.component';

describe('SelectCiudadDeliveryComponent', () => {
  let component: SelectCiudadDeliveryComponent;
  let fixture: ComponentFixture<SelectCiudadDeliveryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectCiudadDeliveryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectCiudadDeliveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
