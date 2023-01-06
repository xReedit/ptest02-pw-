import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CompListCallClientComponent } from './comp-list-call-client.component';

describe('CompListCallClientComponent', () => {
  let component: CompListCallClientComponent;
  let fixture: ComponentFixture<CompListCallClientComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CompListCallClientComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompListCallClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
