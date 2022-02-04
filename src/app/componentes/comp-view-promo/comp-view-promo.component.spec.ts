import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompViewPromoComponent } from './comp-view-promo.component';

describe('CompViewPromoComponent', () => {
  let component: CompViewPromoComponent;
  let fixture: ComponentFixture<CompViewPromoComponent>;

  beforeEach(async(() => {
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
