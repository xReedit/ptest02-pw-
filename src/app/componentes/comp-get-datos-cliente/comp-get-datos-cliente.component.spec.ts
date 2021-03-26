import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompGetDatosClienteComponent } from './comp-get-datos-cliente.component';

describe('CompGetDatosClienteComponent', () => {
  let component: CompGetDatosClienteComponent;
  let fixture: ComponentFixture<CompGetDatosClienteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompGetDatosClienteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompGetDatosClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
