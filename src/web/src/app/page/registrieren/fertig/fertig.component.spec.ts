import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FertigComponent } from './fertig.component';

describe('FertigComponent', () => {
  let component: FertigComponent;
  let fixture: ComponentFixture<FertigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FertigComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FertigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
