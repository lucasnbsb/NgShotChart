import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { Subject } from 'rxjs';
import { ICourtLines, ICourtLocation, IDrawCourt, ILeagueSettings, IShotchartSettings } from '../models/shot-chart';
import { NgxShotchartSettings } from './../constants/shot-chart.constants';

export interface SymbolClickEvent {
  event: MouseEvent;
  symbol: SVGPathElement;
}

export interface SymbolCreationData {
  distanceFeet: number;
  distanceMeters: number;
  angleDegrees: number;
  isThreePointer: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ShotChartService {
  /** Observable for all click events in symbols added to the chart*/
  private symbolClicked$: Subject<SymbolClickEvent> = new Subject();

  readonly chartSelector = '#ngx-shotchart-svg';
  readonly threePointLineClass = 'ngx-shot-chart-court-3pt-line';

  /**  The calculation for the shot being a 3 pointer needs data from the settings*/
  lastRenderedSettings: IShotchartSettings = NgxShotchartSettings.Nba;

  constructor() {}

  /** Observable for all click events in symbols added to the chart*/
  getSymbolClicked() {
    return this.symbolClicked$.asObservable();
  }

  /**
   * Appends an arc path to the base element.
   *
   * @param {any} baseElement - The element receiving the chart.
   * @param {number} radius - The radius of the arc.
   * @param {number} startAngle - The starting angle of the arc in radians.
   * @param {number} endAngle - The ending angle of the arc in radians.
   * @param {number} [translateX] - The translation along the x-axis.
   * @param {number} [translateY] - The translation along the y-axis.
   * @param {string} [xyState] - The state of the XY coordinates.
   * @param {ICourtLines} [courtLines] - The court lines object.
   * @returns {any} The appended path element.
   */
  private appendArcPath(
    baseElement: any,
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
      .angle(function (d: [number, number], i: number) {
        temp.push({
          x: (translateX === undefined ? 0 : translateX) + radius * Math.cos(a(i) - Math.PI / 2),
          y: (translateY === undefined ? 0 : translateY) + radius * Math.sin(a(i) - Math.PI / 2),
        });
        return a(i);
      });

    if (xyState !== undefined && courtLines !== undefined) {
      courtLines[xyState] = temp;
    }
    return baseElement.append('path').datum(d3.range(points)).attr('d', line);
  }

  /**
   * Draws a symbol on the chart. Uses the last rendered settings
   *
   * @param symbolType The type of symbol to draw.
   * @param x The x-coordinate of the symbol.
   * @param y The y-coordinate of the symbol.
   * @param size The size of the symbol.
   * @param stroke The color of the symbol's stroke.
   * @param strokeWidth The width of the symbol's stroke.
   * @returns The uuid generated for the symbol
   */
  drawSymbol(
    symbolType: d3.SymbolType,
    x: number,
    y: number,
    size: number,
    stroke: string,
    strokeWidth: number,
  ): SymbolCreationData {
    const subject = this.symbolClicked$;
    function onClickHandler(this: SVGPathElement, event: MouseEvent) {
      subject.next({ event: event, symbol: this });
      event.stopImmediatePropagation();
    }

    const symbol = d3.symbol().type(symbolType).size(size);
    const id = crypto.randomUUID();
    const newSymbol = d3
      .select(this.chartSelector)
      .append('path')
      .attr('d', symbol)
      .attr('id', id)
      .style('fill', 'currentColor')
      .style('stroke', stroke)
      .style('stroke-width', strokeWidth)
      .style('z-index', 1000)
      .attr('transform', 'translate(' + x + ',' + y + ')');

    newSymbol.on('click', onClickHandler);
    const hoopCenter = d3.select('#ngx-shot-chart-court-hoop-center');
    const hoopCenterX = parseFloat(hoopCenter.attr('cx'));
    const hoopCenterY = parseFloat(hoopCenter.attr('cy'));
    const distance = this.euclidianDistance(x, y, hoopCenterX, hoopCenterY);
    const angleDegrees = this.angleBetweenPoints(hoopCenterX, hoopCenterY, x, y);

    const result = {
      distanceFeet: distance,
      distanceMeters: distance * 0.3048,
      angleDegrees: angleDegrees,
      isThreePointer: this.isThreePointer(distance, angleDegrees, this.lastRenderedSettings.leagueSettings),
    };
    return result;
  }

  /** Calculates if a shot is worth 3 points or 2*/
  // heavy elementary school math ahead
  isThreePointer(distance: number, angle: number, leagueSettings: ILeagueSettings) {
    const threePointArcAngles = leagueSettings.threePointArcAngles;
    const threePointArcDistance = leagueSettings.threePointRadius;
    const isInTheArc = angle > threePointArcAngles[0] && angle < threePointArcAngles[1];

    if (isInTheArc) {
      return Math.abs(distance) > Math.abs(threePointArcDistance);
    } else {
      // calculate the hypotenuse of the shot to the hoop
      const cos = Math.cos(this.degreesToRadians(angle));
      const hipotenuse = leagueSettings.threePointSideDistance / cos;
      return Math.abs(distance) > Math.abs(hipotenuse);
    }
  }

  // Angle between two points assuming a line paralel to y on the first point
  angleBetweenPoints(x1: number, y1: number, x2: number, y2: number) {
    const dy = y1 - y2;
    const dx = x1 - x2;
    const radians = Math.atan2(dy, dx); // range (-PI, PI]
    const degrees = this.radiansToDegrees(radians); // rads to degs, range (-180, 180]
    return degrees;
  }

  // more elementary school math
  euclidianDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }

  degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  /** Draws the court with the specified settings, use alongside NgxShotchartSettings for pre-configured leagues*/
  drawCourt(settings: IShotchartSettings): IDrawCourt {
    this.lastRenderedSettings = settings;
    const courtLines = {
      threePointLineXY: [],
      restrictedAreaXY: [],
      ftOutXY: [],
      floaterXY: [],
      rimXY: [],
    };

    // Set the viewbox for the chart.
    const baseElement = d3
      .select(this.chartSelector)
      .attr('width', settings.width)
      // min-x min-y width height
      .attr('viewBox', `0 0 ${settings.leagueSettings.courtWidth} ${settings.visibleCourtLength}`)
      .append('g')
      .attr('class', 'ngx-shot-chart-court');

    // Key
    baseElement
      .append('rect')
      .attr('class', 'ngx-shot-chart-court-key')
      .attr('x', settings.leagueSettings.courtWidth / 2 - settings.leagueSettings.keyWidth / 2)
      .attr('y', settings.visibleCourtLength - settings.freeThrowLineLength)
      .attr('width', settings.leagueSettings.keyWidth)
      .attr('height', settings.freeThrowLineLength);

    // Baseline
    baseElement
      .append('line')
      .attr('class', 'ngx-shot-chart-court-baseline')
      .attr('x1', 0)
      .attr('y1', settings.visibleCourtLength)
      .attr('x2', settings.leagueSettings.courtWidth)
      .attr('y2', settings.visibleCourtLength);

    // bet you though you would never use arctan for anything
    const tpAngle = Math.atan(
      settings.leagueSettings.threePointSideDistance /
        (settings.leagueSettings.threePointCutOffLength -
          settings.basketProtrusionLength -
          settings.basketDiameter / 2),
    );

    // Three point arc.
    this.appendArcPath(
      baseElement,
      settings.leagueSettings.threePointRadius,
      -1 * tpAngle,
      tpAngle,
      settings.leagueSettings.courtWidth / 2,
      settings.visibleCourtLength - settings.basketProtrusionLength - settings.basketDiameter / 2,
      'threePointLineXY',
      courtLines,
    )
      .attr('class', this.threePointLineClass)
      .attr(
        'transform',
        'translate(' +
          settings.leagueSettings.courtWidth / 2 +
          ', ' +
          (settings.visibleCourtLength - settings.basketProtrusionLength - settings.basketDiameter / 2) +
          ')',
      );

    // Corners of the three point line
    [1, -1].forEach(function (n) {
      baseElement
        .append('line')
        .attr('class', 'ngx-shot-chart-court-3pt-line')
        .attr('x1', settings.leagueSettings.courtWidth / 2 + settings.leagueSettings.threePointSideDistance * n)
        .attr('y1', settings.visibleCourtLength - settings.leagueSettings.threePointCutOffLength)
        .attr('x2', settings.leagueSettings.courtWidth / 2 + settings.leagueSettings.threePointSideDistance * n)
        .attr('y2', settings.visibleCourtLength);
    });

    // Restricted area
    this.appendArcPath(
      baseElement,
      settings.restrictedCircleRadius,
      (-1 * Math.PI) / 2,
      Math.PI / 2,
      settings.leagueSettings.courtWidth / 2,
      settings.visibleCourtLength - settings.basketProtrusionLength - settings.basketDiameter / 2,
      'restrictedAreaXY',
      courtLines,
    )
      .attr('class', 'ngx-shot-chart-court-restricted-area')
      .attr(
        'transform',
        'translate(' +
          settings.leagueSettings.courtWidth / 2 +
          ', ' +
          (settings.visibleCourtLength - settings.basketProtrusionLength - settings.basketDiameter / 2) +
          ')',
      );

    // Free throw circle
    this.appendArcPath(
      baseElement,
      settings.freeThrowCircleRadius,
      (-1 * Math.PI) / 2,
      Math.PI / 2,
      settings.leagueSettings.courtWidth / 2,
      settings.visibleCourtLength - settings.freeThrowLineLength,
      'ftOutXY',
      courtLines,
    )
      .attr('class', 'ngx-shot-chart-court-ft-circle-top')
      .attr(
        'transform',
        'translate(' +
          settings.leagueSettings.courtWidth / 2 +
          ', ' +
          (settings.visibleCourtLength - settings.freeThrowLineLength) +
          ')',
      );

    if (settings.leagueSettings.leagueId == 'nba') {
      this.appendArcPath(baseElement, settings.freeThrowCircleRadius, Math.PI / 2, 1.5 * Math.PI)
        .attr('class', 'ngx-shot-chart-court-ft-circle-bottom')
        .attr(
          'transform',
          'translate(' +
            settings.leagueSettings.courtWidth / 2 +
            ', ' +
            (settings.visibleCourtLength - settings.freeThrowLineLength) +
            ')',
        );
    } else if (settings.leagueSettings.leagueId == 'coll') {
      // Draw the paint area for college ball
      baseElement
        .append('rect')
        .attr('class', 'ngx-shot-chart-court-key-block')
        .attr('x', settings.leagueSettings.courtWidth / 2 - settings.leagueSettings.keyWidth / 2 - 0.66)
        .attr('y', settings.visibleCourtLength - 7)
        .attr('width', 0.66)
        .attr('height', 1)
        .style('fill', 'black');

      baseElement
        .append('rect')
        .attr('class', 'ngx-shot-chart-court-key-block')
        .attr('x', settings.leagueSettings.courtWidth / 2 + settings.leagueSettings.keyWidth / 2)
        .attr('y', settings.visibleCourtLength - 7)
        .attr('width', 0.66)
        .attr('height', 1)
        .style('fill', 'black');
    }

    // Key marks for free throw rebound positioning
    settings.leagueSettings.keyMarks.forEach(function (mark: number) {
      [1, -1].forEach(function (n) {
        baseElement
          .append('line')
          .attr('class', 'ngx-shot-chart-court-key-mark')
          .attr(
            'x1',
            settings.leagueSettings.courtWidth / 2 +
              (settings.leagueSettings.keyWidth / 2) * n +
              settings.keyMarkWidth * n,
          )
          .attr('y1', settings.visibleCourtLength - mark)
          .attr('x2', settings.leagueSettings.courtWidth / 2 + (settings.leagueSettings.keyWidth / 2) * n)
          .attr('y2', settings.visibleCourtLength - mark);
      });
    });

    // Backboard
    baseElement
      .append('line')
      .attr('class', 'ngx-shot-chart-court-backboard')
      .attr('x1', settings.leagueSettings.courtWidth / 2 - settings.basketWidth / 2)
      .attr('y1', settings.visibleCourtLength - settings.basketProtrusionLength)
      .attr('x2', settings.leagueSettings.courtWidth / 2 + settings.basketWidth / 2)
      .attr('y2', settings.visibleCourtLength - settings.basketProtrusionLength);

    // Hoop
    baseElement
      .append('circle')
      .attr('class', 'ngx-shot-chart-court-hoop')
      .attr('cx', settings.leagueSettings.courtWidth / 2)
      .attr('cy', settings.visibleCourtLength - settings.basketProtrusionLength - settings.basketDiameter / 2)
      .attr('r', settings.basketDiameter / 2);

    // invisible point at the center of the hoop for calculating distances
    baseElement
      .append('circle')
      .attr('id', 'ngx-shot-chart-court-hoop-center')
      .attr('cx', settings.leagueSettings.courtWidth / 2)
      .attr('cy', settings.visibleCourtLength - settings.basketProtrusionLength - settings.basketDiameter / 2)
      .attr('r', 0);

    return { baseElement: baseElement, courtLines };
  }
}
