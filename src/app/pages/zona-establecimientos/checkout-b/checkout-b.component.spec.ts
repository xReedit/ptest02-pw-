import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CheckoutBComponent } from './checkout-b.component';

describe('CheckoutBComponent', () => {
  let component: CheckoutBComponent;
  let fixture: ComponentFixture<CheckoutBComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CheckoutBComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckoutBComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
