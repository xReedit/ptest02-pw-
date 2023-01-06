import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CompViewPromoComponent } from './comp-view-promo.component';

describe('CompViewPromoComponent', () => {
  let component: CompViewPromoComponent;
  let fixture: ComponentFixture<CompViewPromoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CompViewPromoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompViewPromoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
