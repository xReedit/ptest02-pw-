import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompPasarelaPagoComponent } from './comp-pasarela-pago.component';

describe('CompPasarelaPagoComponent', () => {
  let component: CompPasarelaPagoComponent;
  let fixture: ComponentFixture<CompPasarelaPagoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompPasarelaPagoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompPasarelaPagoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
