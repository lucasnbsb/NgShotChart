import { AfterViewInit, Component, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';

import { NgxShotchartSettings } from '../shared/constants/shot-chart.constants';
import { IShotchartSettings } from '../shared/models/shot-chart';
import { ShotChartService } from '../shared/services/shot-chart.service';

@Component({
  selector: 'ngx-shot-chart',
  standalone: true,
  imports: [],
  templateUrl: './shot-chart.component.html',
  styleUrl: './shot-chart.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ShotChartComponent implements AfterViewInit {
  @Output() ChartClicked: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();
  chartSettings?: IShotchartSettings;
  points: { x: number; y: number }[] = [] as { x: number; y: number }[];

  symbolClicked$ = this.chart.getSymbolClicked();

  constructor(private chart: ShotChartService) {}

  ngAfterViewInit(): void {
    this.symbolClicked$.subscribe((event) => {});

    this.chartSettings = NgxShotchartSettings.Fiba;

    this.chart.drawCourt(this.chartSettings);
  }

  redraw() {
    if (this.chartSettings) {
      this.chart.drawCourt(this.chartSettings);
    }

    this.points.forEach((point) => {
      this.chart.drawSymbol(d3.symbolCircle, point.x, point.y, 0.2, 'black', 0.1);
    });
  }

  //d3.pointer converts the click event into coordinates.
  logEvent(event: any): void {
    const coords = d3.pointer(event);
    this.points.push({ x: coords[0], y: coords[1] });
    this.redraw();
  }
}
