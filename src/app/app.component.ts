import { AfterViewInit, Component, ViewChild, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { drawCourt } from './shared/functions/draw';
import { IShotchartSettings } from './shared/models/shot-chart';
import { NBA_SETTINGS, SHOTCHART_SETTINGS } from './shared/constants/shot-chart.constants';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements AfterViewInit {


  svgId = 'shotchart'
  chartSettings?: IShotchartSettings; 
  constructor() {
  }

  ngAfterViewInit(): void {
    this.chartSettings = SHOTCHART_SETTINGS(
      NBA_SETTINGS,
      1
    );

    drawCourt(this.chartSettings, 'svg');
    
  }  
}
