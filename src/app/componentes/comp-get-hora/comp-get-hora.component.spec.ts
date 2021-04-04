import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompGetHoraComponent } from './comp-get-hora.component';

describe('CompGetHoraComponent', () => {
  let component: CompGetHoraComponent;
  let fixture: ComponentFixture<CompGetHoraComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompGetHoraComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompGetHoraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
