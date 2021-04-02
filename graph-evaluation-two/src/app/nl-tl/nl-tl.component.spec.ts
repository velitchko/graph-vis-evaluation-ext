import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NlTlComponent } from './nl-tl.component';

describe('NlAnComponent', () => {
  let component: NlTlComponent;
  let fixture: ComponentFixture<NlTlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NlTlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NlTlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
