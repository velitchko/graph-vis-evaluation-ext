import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MSiComponent } from './m-si.component';

describe('MSiComponent', () => {
  let component: MSiComponent;
  let fixture: ComponentFixture<MSiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MSiComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MSiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
