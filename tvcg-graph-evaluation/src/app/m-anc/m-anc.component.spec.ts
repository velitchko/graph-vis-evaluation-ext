import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MAncComponent } from './m-anc.component';

describe('MAncComponent', () => {
  let component: MAncComponent;
  let fixture: ComponentFixture<MAncComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MAncComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MAncComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
