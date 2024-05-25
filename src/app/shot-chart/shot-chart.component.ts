import { AfterViewInit, Component } from '@angular/core';
import * as d3 from 'd3';

import { NBA_SETTINGS, SHOTCHART_SETTINGS } from '../shared/constants/shot-chart.constants';
import { drawCourt, drawShot, drawSymbol } from '../shared/functions/draw';
import { IShotchartSettings } from '../shared/models/shot-chart';

@Component({
  selector: 'ng-shot-chart',
  standalone: true,
  imports: [],
  templateUrl: './shot-chart.component.html',
  styleUrl: './shot-chart.component.css',
})
export class ShotChartComponent implements AfterViewInit {
  svgId = 'shotchart';
  chartSettings?: IShotchartSettings;
  points: { x: number; y: number }[] = [] as { x: number; y: number }[];
  constructor() {}

  ngAfterViewInit(): void {
    this.chartSettings = SHOTCHART_SETTINGS(NBA_SETTINGS, 1);

    drawCourt(this.chartSettings, 'svg');
    drawShot(17, 11, 0.2, 'red', 'black', 0.1, 'svg');
    drawSymbol(d3.symbolCross, 17, 11, 5, 'red', 'black', 0.1);
  }

  redraw() {
    if (this.chartSettings) {
      drawCourt(this.chartSettings, 'svg');
    }

    this.points.forEach((point) => {
      drawShot(point.x, point.y, 0.2, 'red', 'black', 0.1, 'svg');
    });
  }

  //d3.pointer converts the click event into coordinates.
  logEvent(event: any): void {
    const coords = d3.pointer(event);
    this.points.push({ x: coords[0], y: coords[1] });
    this.redraw();
  }
}
