import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { Subject } from 'rxjs';
import { ICourtLines, ICourtLocation, IDrawCourt, IShotchartSettings } from '../models/shot-chart';

export interface SymbolClickEvent {
  event: MouseEvent;
  symbol: SVGPathElement;
}

@Injectable({
  providedIn: 'root',
})
export class ShotChartService {
  private symbolClicked$: Subject<SymbolClickEvent> = new Subject();

  readonly chartSelector = '#ngx-shotchart-svg';

  constructor() {}

  getSymbolClicked() {
    return this.symbolClicked$.asObservable();
  }

  private appendArcPath(
    base: any,
    radius: number,
    startAngle: number,
    endAngle: number,
    translateX?: number,
    translateY?: number,
    xyState?: string,
    courtLines?: ICourtLines,
  ): any {
    // amount of line segments for the arc
    const points = 1500;

    const a = d3
      .scaleLinear()
      .domain([0, points - 1])
      .range([startAngle, endAngle]);

    const temp: ICourtLocation[] = [];
    const line = d3
      .lineRadial()
      .radius(radius)
      .angle(function (d: any, i: any) {
        temp.push({
          x: (translateX === undefined ? 0 : translateX) + radius * Math.cos(a(i) - Math.PI / 2),
          y: (translateY === undefined ? 0 : translateY) + radius * Math.sin(a(i) - Math.PI / 2),
        });
        return a(i);
      });

    if (xyState !== undefined && courtLines !== undefined) {
      courtLines[xyState] = temp;
    }
    return base.append('path').datum(d3.range(points)).attr('d', line);
  }

  /**
   * Draws a symbol on the chart.
   *
   * @param symbol The type of symbol to draw.
   * @param x The x-coordinate of the symbol.
   * @param y The y-coordinate of the symbol.
   * @param size The size of the symbol.
   * @param stroke The color of the symbol's stroke.
   * @param strokeWidth The width of the symbol's stroke.
   * @returns An object containing the base element of the symbol.
   */
  drawSymbol(symbol: d3.SymbolType, x: number, y: number, size: number, stroke: string, strokeWidth: number) {
    const subject = this.symbolClicked$;
    function onClickHandler(this: SVGPathElement, event: MouseEvent) {
      subject.next({ event: event, symbol: this });
      event.stopImmediatePropagation();
    }

    const triangle = d3.symbol().type(symbol).size(size);
    const base = d3
      .select(this.chartSelector)
      .append('path')
      .attr('d', triangle)
      .attr('id', crypto.randomUUID())
      .style('fill', 'currentColor')
      .style('stroke', stroke)
      .style('stroke-width', strokeWidth)
      .style('z-index', 1000)
      .attr('transform', 'translate(' + x + ',' + y + ')');

    base.on('click', onClickHandler);
    return { base };
  }

  drawCourt(settings: IShotchartSettings): IDrawCourt {
    const courtLines = {
      threePointLineXY: [],
      restrictedAreaXY: [],
      ftOutXY: [],
      floaterXY: [],
      rimXY: [],
    };

    // Set the viewbox for the chart.
    const base = d3
      .select(this.chartSelector)
      .attr('width', settings.width)
      // min-x min-y width height
      .attr('viewBox', `0 0 ${settings.courtWidth} ${settings.visibleCourtLength()}`)
      .append('g')
      .attr('class', 'ngx-shot-chart-court');

    // Key
    base
      .append('rect')
      .attr('class', 'ngx-shot-chart-court-key')
      .attr('x', settings.courtWidth / 2 - settings.leagueSettings.keyWidth / 2)
      .attr('y', settings.visibleCourtLength() - settings.freeThrowLineLength)
      .attr('width', settings.leagueSettings.keyWidth)
      .attr('height', settings.freeThrowLineLength);

    // Baseline
    base
      .append('line')
      .attr('class', 'ngx-shot-chart-court-baseline')
      .attr('x1', 0)
      .attr('y1', settings.visibleCourtLength())
      .attr('x2', settings.courtWidth)
      .attr('y2', settings.visibleCourtLength());

    // bet you though you would never use arctan for anything
    const tpAngle = Math.atan(
      settings.leagueSettings.threePointSideRadius /
        (settings.leagueSettings.threePointCutOffLength -
          settings.basketProtrusionLength -
          settings.basketDiameter / 2),
    );

    // Three point arc.
    this.appendArcPath(
      base,
      settings.leagueSettings.threePointRadius,
      -1 * tpAngle,
      tpAngle,
      settings.courtWidth / 2,
      settings.visibleCourtLength() - settings.basketProtrusionLength - settings.basketDiameter / 2,
      'threePointLineXY',
      courtLines,
    )
      .attr('class', 'ngx-shot-chart-court-3pt-line')
      .attr(
        'transform',
        'translate(' +
          settings.courtWidth / 2 +
          ', ' +
          (settings.visibleCourtLength() - settings.basketProtrusionLength - settings.basketDiameter / 2) +
          ')',
      );

    // Corners of the three point line
    [1, -1].forEach(function (n) {
      base
        .append('line')
        .attr('class', 'ngx-shot-chart-court-3pt-line')
        .attr('x1', settings.courtWidth / 2 + settings.leagueSettings.threePointSideRadius * n)
        .attr('y1', settings.visibleCourtLength() - settings.leagueSettings.threePointCutOffLength)
        .attr('x2', settings.courtWidth / 2 + settings.leagueSettings.threePointSideRadius * n)
        .attr('y2', settings.visibleCourtLength());
    });

    // Restricted area
    this.appendArcPath(
      base,
      settings.restrictedCircleRadius,
      (-1 * Math.PI) / 2,
      Math.PI / 2,
      settings.courtWidth / 2,
      settings.visibleCourtLength() - settings.basketProtrusionLength - settings.basketDiameter / 2,
      'restrictedAreaXY',
      courtLines,
    )
      .attr('class', 'ngx-shot-chart-court-restricted-area')
      .attr(
        'transform',
        'translate(' +
          settings.courtWidth / 2 +
          ', ' +
          (settings.visibleCourtLength() - settings.basketProtrusionLength - settings.basketDiameter / 2) +
          ')',
      );

    // Free throw circle
    this.appendArcPath(
      base,
      settings.freeThrowCircleRadius,
      (-1 * Math.PI) / 2,
      Math.PI / 2,
      settings.courtWidth / 2,
      settings.visibleCourtLength() - settings.freeThrowLineLength,
      'ftOutXY',
      courtLines,
    )
      .attr('class', 'ngx-shot-chart-court-ft-circle-top')
      .attr(
        'transform',
        'translate(' +
          settings.courtWidth / 2 +
          ', ' +
          (settings.visibleCourtLength() - settings.freeThrowLineLength) +
          ')',
      );

    if (settings.leagueSettings.leagueId == 'nba') {
      this.appendArcPath(base, settings.freeThrowCircleRadius, Math.PI / 2, 1.5 * Math.PI)
        .attr('class', 'ngx-shot-chart-court-ft-circle-bottom')
        .attr(
          'transform',
          'translate(' +
            settings.courtWidth / 2 +
            ', ' +
            (settings.visibleCourtLength() - settings.freeThrowLineLength) +
            ')',
        );
    } else if (settings.leagueSettings.leagueId == 'coll') {
      // Draw the paint area for college ball
      base
        .append('rect')
        .attr('class', 'ngx-shot-chart-court-key-block')
        .attr('x', settings.courtWidth / 2 - settings.leagueSettings.keyWidth / 2 - 0.66)
        .attr('y', settings.visibleCourtLength() - 7)
        .attr('width', 0.66)
        .attr('height', 1)
        .style('fill', 'black');

      base
        .append('rect')
        .attr('class', 'ngx-shot-chart-court-key-block')
        .attr('x', settings.courtWidth / 2 + settings.leagueSettings.keyWidth / 2)
        .attr('y', settings.visibleCourtLength() - 7)
        .attr('width', 0.66)
        .attr('height', 1)
        .style('fill', 'black');
    }

    // Key marks for free throw rebound positioning
    settings.leagueSettings.keyMarks.forEach(function (mark: any) {
      [1, -1].forEach(function (n) {
        base
          .append('line')
          .attr('class', 'ngx-shot-chart-court-key-mark')
          .attr('x1', settings.courtWidth / 2 + (settings.leagueSettings.keyWidth / 2) * n + settings.keyMarkWidth * n)
          .attr('y1', settings.visibleCourtLength() - mark)
          .attr('x2', settings.courtWidth / 2 + (settings.leagueSettings.keyWidth / 2) * n)
          .attr('y2', settings.visibleCourtLength() - mark);
      });
    });

    // Backboard
    base
      .append('line')
      .attr('class', 'ngx-shot-chart-court-backboard')
      .attr('x1', settings.courtWidth / 2 - settings.basketWidth / 2)
      .attr('y1', settings.visibleCourtLength() - settings.basketProtrusionLength)
      .attr('x2', settings.courtWidth / 2 + settings.basketWidth / 2)
      .attr('y2', settings.visibleCourtLength() - settings.basketProtrusionLength);

    // Hoop
    base
      .append('circle')
      .attr('class', 'ngx-shot-chart-court-hoop')
      .attr('cx', settings.courtWidth / 2)
      .attr('cy', settings.visibleCourtLength() - settings.basketProtrusionLength - settings.basketDiameter / 2)
      .attr('r', settings.basketDiameter / 2);

    return { base, courtLines };
  }
}
