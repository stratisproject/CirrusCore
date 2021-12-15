import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsolidateWalletComponent } from './consolidate-wallet.component';

describe('ConsolidateWalletComponent', () => {
  let component: ConsolidateWalletComponent;
  let fixture: ComponentFixture<ConsolidateWalletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsolidateWalletComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsolidateWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
