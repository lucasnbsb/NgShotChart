import { AfterViewInit, Component, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import { IActiveSymbol } from './../shared/models/shot-chart';

import { NgxShotchartSettings } from '../shared/constants/shot-chart.constants';
import { ChartClickedEvent, IShotchartSettings } from '../shared/models/shot-chart';
import { ShotChartService } from '../shared/services/shot-chart.service';

@Component({
  selector: 'ngx-shot-chart',
  standalone: true,
  imports: [],
  providers: [ShotChartService, { provide: 'NGX_SHOT_CHART_SETTINGS', useValue: NgxShotchartSettings.Nba }],
  templateUrl: './shot-chart.component.html',
  styleUrl: './shot-chart.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ShotChartComponent implements AfterViewInit {
  @Output() ChartClicked: EventEmitter<ChartClickedEvent> = new EventEmitter<ChartClickedEvent>();
  chartSettings?: IShotchartSettings;
  activeSymbols: Map<string, IActiveSymbol> = new Map();

  symbolClicked$ = this.chart.getSymbolClicked();

  constructor(private chart: ShotChartService) {}

  ngAfterViewInit(): void {
    this.chart.drawCourt();
  }

  /**
   * Handles the click event on the shot chart.
   *
   * @param {MouseEvent} event - The click event.
   */
  handleChartClicked(event: MouseEvent): void {
    const coords = d3.pointer(event);
    const shotInfo = this.chart.calculateShotFeatures(coords[0], coords[1]);
    this.ChartClicked.emit({ event: event, shotInfo: shotInfo });
  }
}
