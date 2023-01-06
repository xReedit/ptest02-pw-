import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SelectCiudadDeliveryComponent } from './select-ciudad-delivery.component';

describe('SelectCiudadDeliveryComponent', () => {
  let component: SelectCiudadDeliveryComponent;
  let fixture: ComponentFixture<SelectCiudadDeliveryComponent>;

  beforeEach(waitForAsync(() => {
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
