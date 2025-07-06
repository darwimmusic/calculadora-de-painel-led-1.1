
import { PanelTypeInfo } from './types';

export const PANEL_TYPES: PanelTypeInfo[] = [
  { id: 'p3', name: 'P3 - 128x128 px', pxWidth: 128, pxHeight: 128, moduleWidthCm: 50, moduleHeightCm: 50, weightKg: 11, powerW: 180 },
  { id: 'p2', name: 'P2 - 168x168 px', pxWidth: 168, pxHeight: 168, moduleWidthCm: 50, moduleHeightCm: 50, weightKg: 11, powerW: 180 },
  { id: 'p4', name: 'P4 - 104x104 px', pxWidth: 104, pxHeight: 104, moduleWidthCm: 50, moduleHeightCm: 50, weightKg: 11, powerW: 180 },
  { id: 'glass', name: 'GLASS - 256x128 px', pxWidth: 256, pxHeight: 128, moduleWidthCm: 50, moduleHeightCm: 50, weightKg: 11, powerW: 180 },
];

export const CONTENT_MANUAL_DEFAULT = `Software de Vídeo: Resolume Arena

Especificações de Vídeo:
• Arquivo de Vídeo: Quicktime .MOV
• Codec de Vídeo: DXV3 Normal Quality
• Taxa de Quadros: 30 fps
• Varredura: Progressiva
• Aspecto do Pixel: Square Pixel
`;
