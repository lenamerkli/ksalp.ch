import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NeuComponent } from './neu.component';

describe('NeuComponent', () => {
  let component: NeuComponent;
  let fixture: ComponentFixture<NeuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NeuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
