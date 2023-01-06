import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CompCheckComponent } from './comp-check.component';

describe('CompCheckComponent', () => {
  let component: CompCheckComponent;
  let fixture: ComponentFixture<CompCheckComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CompCheckComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
