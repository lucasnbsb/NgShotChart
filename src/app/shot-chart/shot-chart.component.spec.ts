import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShotChartComponent } from './shot-chart.component';

describe('ShotChartComponent', () => {
  let component: ShotChartComponent;
  let fixture: ComponentFixture<ShotChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShotChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShotChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
