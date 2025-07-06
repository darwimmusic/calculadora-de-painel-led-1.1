import { Panel, PanelMetrics, PanelTypeInfo } from '../types';

export const calculatePanelMetrics = (panel: Panel, allPanelTypes: PanelTypeInfo[]): PanelMetrics | null => {
  const panelType = allPanelTypes.find(p => p.id === panel.panelTypeId);
  if (!panelType) return null;

  const moduleWidthM = panelType.moduleWidthCm / 100;
  const moduleHeightM = panelType.moduleHeightCm / 100;

  const modulesWide = Math.round(panel.widthM / moduleWidthM);
  const modulesHigh = Math.round(panel.heightM / moduleHeightM);
  const originalTotalModules = modulesWide * modulesHigh;

  const hiddenCount = panel.hiddenModuleIndices?.length || 0;
  const visibleModules = originalTotalModules - hiddenCount;

  // Total pixel dimensions are based on the original grid, as requested.
  const totalPxWidth = modulesWide * panelType.pxWidth;
  const totalPxHeight = modulesHigh * panelType.pxHeight;

  // Weight and power are based on the number of *visible* modules.
  const totalWeightKg = visibleModules * panelType.weightKg;
  
  // Using the formula: (total_watts / safety_factor) / 1000 for kVA
  // Standard safety factor is 0.8
  const totalWatts = visibleModules * panelType.powerW;
  const totalKva = (totalWatts / 0.8) / 1000;

  return {
    modulesWide,
    modulesHigh,
    totalModules: visibleModules,
    totalPxWidth,
    totalPxHeight,
    totalWeightKg,
    totalKva,
  };
};