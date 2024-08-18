import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HilfeComponent } from './hilfe.component';

describe('HilfeComponent', () => {
  let component: HilfeComponent;
  let fixture: ComponentFixture<HilfeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HilfeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HilfeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
