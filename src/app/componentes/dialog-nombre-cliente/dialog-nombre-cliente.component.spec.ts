import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DialogNombreClienteComponent } from './dialog-nombre-cliente.component';

describe('DialogNombreClienteComponent', () => {
  let component: DialogNombreClienteComponent;
  let fixture: ComponentFixture<DialogNombreClienteComponent>;

  beforeEach(waitForAsync(() => {
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
