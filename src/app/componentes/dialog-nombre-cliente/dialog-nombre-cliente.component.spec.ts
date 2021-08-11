import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogNombreClienteComponent } from './dialog-nombre-cliente.component';

describe('DialogNombreClienteComponent', () => {
  let component: DialogNombreClienteComponent;
  let fixture: ComponentFixture<DialogNombreClienteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogNombreClienteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogNombreClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
