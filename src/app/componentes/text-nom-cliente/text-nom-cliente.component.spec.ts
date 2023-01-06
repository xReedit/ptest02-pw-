import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TextNomClienteComponent } from './text-nom-cliente.component';

describe('TextNomClienteComponent', () => {
  let component: TextNomClienteComponent;
  let fixture: ComponentFixture<TextNomClienteComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TextNomClienteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextNomClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
