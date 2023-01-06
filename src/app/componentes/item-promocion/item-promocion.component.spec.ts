import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ItemPromocionComponent } from './item-promocion.component';

describe('ItemPromocionComponent', () => {
  let component: ItemPromocionComponent;
  let fixture: ComponentFixture<ItemPromocionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemPromocionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemPromocionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
