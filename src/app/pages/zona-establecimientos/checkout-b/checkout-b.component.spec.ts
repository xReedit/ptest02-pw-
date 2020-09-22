import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckoutBComponent } from './checkout-b.component';

describe('CheckoutBComponent', () => {
  let component: CheckoutBComponent;
  let fixture: ComponentFixture<CheckoutBComponent>;

  beforeEach(async(() => {
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
