import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuellcodeComponent } from './quellcode.component';

describe('QuellcodeComponent', () => {
  let component: QuellcodeComponent;
  let fixture: ComponentFixture<QuellcodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuellcodeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QuellcodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
