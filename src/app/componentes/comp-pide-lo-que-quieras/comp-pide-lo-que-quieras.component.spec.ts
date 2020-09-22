import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompPideLoQueQuierasComponent } from './comp-pide-lo-que-quieras.component';

describe('CompPideLoQueQuierasComponent', () => {
  let component: CompPideLoQueQuierasComponent;
  let fixture: ComponentFixture<CompPideLoQueQuierasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompPideLoQueQuierasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompPideLoQueQuierasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
