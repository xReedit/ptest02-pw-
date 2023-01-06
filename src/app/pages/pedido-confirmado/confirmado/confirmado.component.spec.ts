import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConfirmadoComponent } from './confirmado.component';

describe('ConfirmadoComponent', () => {
  let component: ConfirmadoComponent;
  let fixture: ComponentFixture<ConfirmadoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfirmadoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
