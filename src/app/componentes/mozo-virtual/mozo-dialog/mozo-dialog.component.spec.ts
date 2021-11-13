import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MozoDialogComponent } from './mozo-dialog.component';

describe('MozoDialogComponent', () => {
  let component: MozoDialogComponent;
  let fixture: ComponentFixture<MozoDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MozoDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MozoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
