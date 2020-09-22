import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompOpCostoEstimadoComponent } from './comp-op-costo-estimado.component';

describe('CompOpCostoEstimadoComponent', () => {
  let component: CompOpCostoEstimadoComponent;
  let fixture: ComponentFixture<CompOpCostoEstimadoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompOpCostoEstimadoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompOpCostoEstimadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
