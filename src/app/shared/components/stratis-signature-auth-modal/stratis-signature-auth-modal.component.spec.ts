import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StratisSignatureAuthModalComponent } from './stratis-signature-auth-modal.component';

describe('StratisSignatureAuthModalComponent', () => {
  let component: StratisSignatureAuthModalComponent;
  let fixture: ComponentFixture<StratisSignatureAuthModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StratisSignatureAuthModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StratisSignatureAuthModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
