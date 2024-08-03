import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LernsetsComponent } from './lernsets.component';

describe('LernsetsComponent', () => {
  let component: LernsetsComponent;
  let fixture: ComponentFixture<LernsetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LernsetsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LernsetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
