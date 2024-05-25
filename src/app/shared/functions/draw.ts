import * as d3 from 'd3';
import { ICourtLines, ICourtLocation, IDrawCourt, IShotchartSettings } from './../models/shot-chart';

// Blackbox all of this
export function appendArcPath(
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

export function drawShot(
  x: number,
  y: number,
  radius: number,
  fill: string,
  stroke: string,
  strokeWidth: number,
  node: any,
) {
  const base = d3
    .select(node)
    .append('circle')
    .attr('cx', x)
    .attr('cy', y)
    .attr('r', radius)
    .style('fill', fill)
    .style('stroke', stroke)
    .style('stroke-width', strokeWidth);

  return { base };
}

export function drawSymbol(
  symbol: d3.SymbolType,
  x: number,
  y: number,
  size: number,
  fill: string,
  stroke: string,
  strokeWidth: number,
) {
  const triangle = d3.symbol().type(symbol).size(size);
  const base = d3
    .select('svg')
    .append('path')
    .attr('d', triangle)
    .style('fill', fill)
    .style('stroke', stroke)
    .style('stroke-width', strokeWidth)
    .style('z-index', 1000)
    .attr('transform', 'translate(' + x + ',' + y + ')');
  return { base };
}

export function drawCourt(settings: IShotchartSettings, node: any): IDrawCourt {
  const courtLines = {
    threePointLineXY: [],
    restrictedAreaXY: [],
    ftOutXY: [],
    floaterXY: [],
    rimXY: [],
  };

  // Set the viewbox for the chart.
  const base = d3
    .select(node)
    .attr('width', settings.width)
    // min-x min-y width height
    .attr('viewBox', `0 0 ${settings.courtWidth} ${settings.visibleCourtLength()}`)
    .append('g')
    .attr('class', 'ng-shot-chart-court');

  // Key
  base
    .append('rect')
    .attr('class', 'ng-shot-chart-court-key')
    .attr('x', settings.courtWidth / 2 - settings.leagueSettings.keyWidth / 2)
    .attr('y', settings.visibleCourtLength() - settings.freeThrowLineLength)
    .attr('width', settings.leagueSettings.keyWidth)
    .attr('height', settings.freeThrowLineLength);

  // Baseline
  base
    .append('line')
    .attr('class', 'ng-shot-chart-court-baseline')
    .attr('x1', 0)
    .attr('y1', settings.visibleCourtLength())
    .attr('x2', settings.courtWidth)
    .attr('y2', settings.visibleCourtLength());

  // bet you though you would never use arctan for anything
  const tpAngle = Math.atan(
    settings.leagueSettings.threePointSideRadius /
      (settings.leagueSettings.threePointCutOffLength - settings.basketProtrusionLength - settings.basketDiameter / 2),
  );

  // Three point arc.
  appendArcPath(
    base,
    settings.leagueSettings.threePointRadius,
    -1 * tpAngle,
    tpAngle,
    settings.courtWidth / 2,
    settings.visibleCourtLength() - settings.basketProtrusionLength - settings.basketDiameter / 2,
    'threePointLineXY',
    courtLines,
  )
    .attr('class', 'ng-shot-chart-court-3pt-line')
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
      .attr('class', 'ng-shot-chart-court-3pt-line')
      .attr('x1', settings.courtWidth / 2 + settings.leagueSettings.threePointSideRadius * n)
      .attr('y1', settings.visibleCourtLength() - settings.leagueSettings.threePointCutOffLength)
      .attr('x2', settings.courtWidth / 2 + settings.leagueSettings.threePointSideRadius * n)
      .attr('y2', settings.visibleCourtLength());
  });

  // Restricted area
  appendArcPath(
    base,
    settings.restrictedCircleRadius,
    (-1 * Math.PI) / 2,
    Math.PI / 2,
    settings.courtWidth / 2,
    settings.visibleCourtLength() - settings.basketProtrusionLength - settings.basketDiameter / 2,
    'restrictedAreaXY',
    courtLines,
  )
    .attr('class', 'ng-shot-chart-court-restricted-area')
    .attr(
      'transform',
      'translate(' +
        settings.courtWidth / 2 +
        ', ' +
        (settings.visibleCourtLength() - settings.basketProtrusionLength - settings.basketDiameter / 2) +
        ')',
    );

  // Free throw circle
  appendArcPath(
    base,
    settings.freeThrowCircleRadius,
    (-1 * Math.PI) / 2,
    Math.PI / 2,
    settings.courtWidth / 2,
    settings.visibleCourtLength() - settings.freeThrowLineLength,
    'ftOutXY',
    courtLines,
  )
    .attr('class', 'ng-shot-chart-court-ft-circle-top')
    .attr(
      'transform',
      'translate(' +
        settings.courtWidth / 2 +
        ', ' +
        (settings.visibleCourtLength() - settings.freeThrowLineLength) +
        ')',
    );

  if (settings.leagueSettings.leagueId == 'nba') {
    appendArcPath(base, settings.freeThrowCircleRadius, Math.PI / 2, 1.5 * Math.PI)
      .attr('class', 'ng-shot-chart-court-ft-circle-bottom')
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
      .attr('class', 'ng-shot-chart-court-key-block')
      .attr('x', settings.courtWidth / 2 - settings.leagueSettings.keyWidth / 2 - 0.66)
      .attr('y', settings.visibleCourtLength() - 7)
      .attr('width', 0.66)
      .attr('height', 1)
      .style('fill', 'black');

    base
      .append('rect')
      .attr('class', 'ng-shot-chart-court-key-block')
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
        .attr('class', 'ng-shot-chart-court-key-mark')
        .attr('x1', settings.courtWidth / 2 + (settings.leagueSettings.keyWidth / 2) * n + settings.keyMarkWidth * n)
        .attr('y1', settings.visibleCourtLength() - mark)
        .attr('x2', settings.courtWidth / 2 + (settings.leagueSettings.keyWidth / 2) * n)
        .attr('y2', settings.visibleCourtLength() - mark);
    });
  });

  // Backboard
  base
    .append('line')
    .attr('class', 'ng-shot-chart-court-backboard')
    .attr('x1', settings.courtWidth / 2 - settings.basketWidth / 2)
    .attr('y1', settings.visibleCourtLength() - settings.basketProtrusionLength)
    .attr('x2', settings.courtWidth / 2 + settings.basketWidth / 2)
    .attr('y2', settings.visibleCourtLength() - settings.basketProtrusionLength);

  // Hoop
  base
    .append('circle')
    .attr('class', 'ng-shot-chart-court-hoop')
    .attr('cx', settings.courtWidth / 2)
    .attr('cy', settings.visibleCourtLength() - settings.basketProtrusionLength - settings.basketDiameter / 2)
    .attr('r', settings.basketDiameter / 2);

  return { base, courtLines };
}
