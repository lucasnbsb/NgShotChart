export interface ICourtLocation {
  x: number;
  y: number;
}

export interface ILeagueSettings {
  leagueId: string;
  keyWidth: number;
  keyMarks: number[];
  threePointCutOffLength: number;
  threePointRadius: number;
  threePointSideRadius: number;
  leftThreeInside: ICourtLocation;
  rightThreeInside: ICourtLocation;
}

export interface IShotchartSettings {
  basketDiameter: number;
  basketProtrusionLength: number;
  basketWidth: number;
  courtLength: number;
  courtWidth: number;
  freeThrowLineLength: number;
  freeThrowCircleRadius: number;
  keyMarkWidth: number;
  restrictedCircleRadius: number;
  leagueSettings: ILeagueSettings;
  width: string;
  floaterRange: number;
  rimRange: number;
  leftBaselineMidrangeInside: ICourtLocation;
  rightBaselineMidrangeInside: ICourtLocation;
  rightWingMidrangeInside: ICourtLocation;
  leftWingMidrangeInside: ICourtLocation;
  rightFloaterInside: ICourtLocation;
  leftFloaterInside: ICourtLocation;
  visibleCourtLength(): number;
  shotchartNumber: number;
}

export interface ICourt {
  id: number;
  courtType: CourtType;
}

export interface IDrawCourt {
  base: any;
  courtLines: ICourtLines;
}

export interface IZonedShotchart extends ICourt {
  data: IZoneData[];
  theme: ThemeType;
  backgroundTheme: ShotchartBackgroundTheme;
}

export interface IZonePoints {
  labeledZones: ILabeledZones;
  zones: IZones[];
}

export interface ILabeledZones {
  [index: string]: ICourtLocation[];
}

export interface IZones {
  className: string;
  points: ICourtLocation[];
}

export interface ICourtLines {
  [index: string]: ICourtLocation[];
}

export interface IZoneData {
  bucket: ShotchartZone;
  fgm: number;
  fga: number;
  percentile: number;
}

export type ShotchartBackgroundTheme = "Dark" | "Light";
export type CourtType = "NBA" | "COLL" | "FIBA";
export declare type ThemeType = "B/O" | "R/G";

export type ShotchartZoneCSS =
  | "right-corner-three-zone"
  | "left-corner-three-zone"
  | "right-three-zone"
  | "left-three-zone"
  | "middle-three-zone"
  | "right-baseline-midrange-zone"
  | "left-baseline-midrange-zone"
  | "right-wing-midrange-zone"
  | "left-wing-midrange-zone"
  | "middle-midrange-zone"
  | "left-floater-zone"
  | "right-floater-zone"
  | "middle-floater-zone"
  | "rim-zone";

export type ShotchartZone =
  | "R-C3"
  | "L-C3"
  | "R-ATB"
  | "L-ATB"
  | "M-ATB"
  | "RB-MR"
  | "LB-MR"
  | "RW-MR"
  | "LW-MR"
  | "M-MR"
  | "L-FL"
  | "R-FL"
  | "M-FL"
  | "RIM";
