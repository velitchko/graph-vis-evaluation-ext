import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MTlComponent } from './m-tl.component';

describe('MTlComponent', () => {
  let component: MTlComponent;
  let fixture: ComponentFixture<MTlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MTlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MTlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
