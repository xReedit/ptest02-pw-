import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ListaComerciosComponent } from './lista-comercios.component';

describe('ListaComerciosComponent', () => {
  let component: ListaComerciosComponent;
  let fixture: ComponentFixture<ListaComerciosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListaComerciosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListaComerciosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
