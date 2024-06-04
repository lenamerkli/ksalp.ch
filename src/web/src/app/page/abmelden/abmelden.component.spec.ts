import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbmeldenComponent } from './abmelden.component';

describe('AbmeldenComponent', () => {
  let component: AbmeldenComponent;
  let fixture: ComponentFixture<AbmeldenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AbmeldenComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AbmeldenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
