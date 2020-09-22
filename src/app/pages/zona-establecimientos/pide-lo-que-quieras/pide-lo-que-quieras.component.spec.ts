import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PideLoQueQuierasComponent } from './pide-lo-que-quieras.component';

describe('PideLoQueQuierasComponent', () => {
  let component: PideLoQueQuierasComponent;
  let fixture: ComponentFixture<PideLoQueQuierasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PideLoQueQuierasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PideLoQueQuierasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
