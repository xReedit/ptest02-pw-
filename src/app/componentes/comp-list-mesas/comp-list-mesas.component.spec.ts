import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CompListMesasComponent } from './comp-list-mesas.component';

describe('CompListMesasComponent', () => {
  let component: CompListMesasComponent;
  let fixture: ComponentFixture<CompListMesasComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CompListMesasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompListMesasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
