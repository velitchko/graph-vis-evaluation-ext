import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NlJpComponent } from './nl-jp.component';

describe('NlJpComponent', () => {
  let component: NlJpComponent;
  let fixture: ComponentFixture<NlJpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NlJpComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NlJpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
