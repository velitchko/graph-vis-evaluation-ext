import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NlAnComponent } from './nl-an.component';

describe('NlAnComponent', () => {
  let component: NlAnComponent;
  let fixture: ComponentFixture<NlAnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NlAnComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NlAnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
