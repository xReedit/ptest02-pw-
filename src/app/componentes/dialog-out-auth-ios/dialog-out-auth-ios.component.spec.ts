import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogOutAuthIosComponent } from './dialog-out-auth-ios.component';

describe('DialogOutAuthIosComponent', () => {
  let component: DialogOutAuthIosComponent;
  let fixture: ComponentFixture<DialogOutAuthIosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogOutAuthIosComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogOutAuthIosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
