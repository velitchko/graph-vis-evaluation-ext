import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MJpComponent } from './m-jp.component';

describe('MJpComponent', () => {
  let component: MJpComponent;
  let fixture: ComponentFixture<MJpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MJpComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MJpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
