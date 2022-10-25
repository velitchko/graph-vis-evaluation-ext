import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NlAncComponent } from './nl-anc.component';

describe('NlAnComponent', () => {
  let component: NlAncComponent;
  let fixture: ComponentFixture<NlAncComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NlAncComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NlAncComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
