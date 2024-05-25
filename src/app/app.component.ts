import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShotChartComponent } from './shot-chart/shot-chart.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ShotChartComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {}
