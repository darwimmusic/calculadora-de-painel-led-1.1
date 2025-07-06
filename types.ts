export interface PanelTypeInfo {
  id: string;
  name: string;
  pxWidth: number;
  pxHeight: number;
  moduleWidthCm: number;
  moduleHeightCm: number;
  weightKg: number;
  powerW: number;
}

export type PanelLayoutType = 'left-strip' | 'center' | 'right-strip' | 'dj-booth';

export interface Panel {
  id: string;
  name: string;
  layoutType: PanelLayoutType;
  panelTypeId: string;
  widthM: number;
  heightM: number;
  spacingRightM: number;
  customPosition?: { x: number; y: number };
  outputPosition?: { x: number; y: number };
  outputRotation?: 0 | 90 | 180 | 270;
  hiddenModuleIndices?: number[];
  colorTheme?: string;
}

export interface PanelMetrics {
    modulesWide: number;
    modulesHigh: number;
    totalModules: number; // This will now represent VISIBLE modules
    totalPxWidth: number;
    totalPxHeight: number;
    totalWeightKg: number;
    totalKva: number;
}

export interface CablePoint {
  panelId: string;
  moduleIndex: number;
}

export interface Cable {
  id: string;
  points: CablePoint[];
}

export type CablingPattern = 
  'snake-vertical-up-down' | 
  'snake-vertical-down-up' |
  'snake-horizontal-right-left-up' |
  'snake-horizontal-right-left-down';

export type ViewMode = 'layout' | 'cabling' | 'output';