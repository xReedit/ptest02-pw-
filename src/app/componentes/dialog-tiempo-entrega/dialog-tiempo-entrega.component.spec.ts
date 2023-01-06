import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DialogTiempoEntregaComponent } from './dialog-tiempo-entrega.component';

describe('DialogTiempoEntregaComponent', () => {
  let component: DialogTiempoEntregaComponent;
  let fixture: ComponentFixture<DialogTiempoEntregaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogTiempoEntregaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogTiempoEntregaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
