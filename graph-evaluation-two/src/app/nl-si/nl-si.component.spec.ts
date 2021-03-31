import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NlSiComponent } from './nl-si.component';

describe('NlSiComponent', () => {
  let component: NlSiComponent;
  let fixture: ComponentFixture<NlSiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NlSiComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NlSiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
