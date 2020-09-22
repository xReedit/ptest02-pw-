import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompPideExpressComponent } from './comp-pide-express.component';

describe('CompPideExpressComponent', () => {
  let component: CompPideExpressComponent;
  let fixture: ComponentFixture<CompPideExpressComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompPideExpressComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompPideExpressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
