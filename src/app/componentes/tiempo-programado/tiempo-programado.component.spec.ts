import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TiempoProgramadoComponent } from './tiempo-programado.component';

describe('TiempoProgramadoComponent', () => {
  let component: TiempoProgramadoComponent;
  let fixture: ComponentFixture<TiempoProgramadoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TiempoProgramadoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TiempoProgramadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
