import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VorschauComponent } from './vorschau.component';

describe('VorschauComponent', () => {
  let component: VorschauComponent;
  let fixture: ComponentFixture<VorschauComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VorschauComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VorschauComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
