import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SendInterfluxTokenComponent } from './send-interflux-token.component';

describe('SendInterfluxTokenComponent', () => {
  let component: SendInterfluxTokenComponent;
  let fixture: ComponentFixture<SendInterfluxTokenComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SendInterfluxTokenComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SendInterfluxTokenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
