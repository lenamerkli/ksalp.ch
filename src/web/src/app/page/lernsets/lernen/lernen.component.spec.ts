import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LernenComponent } from './lernen.component';

describe('LernenComponent', () => {
  let component: LernenComponent;
  let fixture: ComponentFixture<LernenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LernenComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LernenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
