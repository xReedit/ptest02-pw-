import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CompCajaTextoComponent } from './comp-caja-texto.component';

describe('CompCajaTextoComponent', () => {
  let component: CompCajaTextoComponent;
  let fixture: ComponentFixture<CompCajaTextoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CompCajaTextoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompCajaTextoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
