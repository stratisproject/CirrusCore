import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { RewindNodeComponent } from './rewind-node.component';

describe('RewindNodeComponent', () => {
  let component: RewindNodeComponent;
  let fixture: ComponentFixture<RewindNodeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RewindNodeComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RewindNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
