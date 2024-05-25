import { TestBed } from '@angular/core/testing';

import { ShotChartService } from './shot-chart.service';

describe('ShotChartService', () => {
  let service: ShotChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShotChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
