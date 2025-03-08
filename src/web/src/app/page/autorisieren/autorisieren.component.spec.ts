import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutorisierenComponent } from './autorisieren.component';

describe('AuthComponent', () => {
  let component: AutorisierenComponent;
  let fixture: ComponentFixture<AutorisierenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutorisierenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutorisierenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
