import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MozoShowTraduceTextComponent } from './mozo-show-traduce-text.component';

describe('MozoShowTraduceTextComponent', () => {
  let component: MozoShowTraduceTextComponent;
  let fixture: ComponentFixture<MozoShowTraduceTextComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MozoShowTraduceTextComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MozoShowTraduceTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
