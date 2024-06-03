import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeiterComponent } from './weiter.component';

describe('WeiterComponent', () => {
  let component: WeiterComponent;
  let fixture: ComponentFixture<WeiterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeiterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WeiterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
