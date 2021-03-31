import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MAnComponent } from './m-an.component';

describe('MAnComponent', () => {
  let component: MAnComponent;
  let fixture: ComponentFixture<MAnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MAnComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MAnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
