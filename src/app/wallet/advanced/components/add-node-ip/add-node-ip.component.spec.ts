import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNodeIPComponent } from './add-node-ip.component';

describe('AddNodeIPComponent', () => {
  let component: AddNodeIPComponent;
  let fixture: ComponentFixture<AddNodeIPComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddNodeIPComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNodeIPComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
