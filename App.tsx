
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Panel, PanelLayoutType, PanelMetrics, PanelTypeInfo, Cable, CablePoint, CablingPattern, ViewMode } from './types';
import { PANEL_TYPES, CONTENT_MANUAL_DEFAULT } from './constants';
import { calculatePanelMetrics } from './services/calculationService';
import { CalculatorIcon, ExportIcon, GridIcon, DimensionsIcon, WeightIcon, PowerIcon, ResolutionIcon, PlusIcon, TrashIcon, BookOpenIcon, ZoomInIcon, ZoomOutIcon, RefreshIcon, EditIcon, EraserIcon, ImageUploadIcon, CableIcon, MonitorIcon, RotateCwIcon, RotateCcwIcon } from './components/icons';
import CustomSelect from './components/CustomSelect';

declare const jspdf: any;
declare const html2canvas: any;

const COLOR_THEMES: Record<string, { name: string; light: string; medium: string; border: string; }> = {
  violet: { name: 'Violeta', light: 'bg-violet-200', medium: 'bg-violet-300', border: 'border-violet-500' },
  red: { name: 'Vermelho', light: 'bg-red-200', medium: 'bg-red-300', border: 'border-red-500' },
  yellow: { name: 'Amarelo', light: 'bg-yellow-200', medium: 'bg-yellow-300', border: 'border-yellow-500' },
  green: { name: 'Verde', light: 'bg-green-200', medium: 'bg-green-300', border: 'border-green-500' },
  blue: { name: 'Azul', light: 'bg-blue-200', medium: 'bg-blue-300', border: 'border-blue-500' },
  orange: { name: 'Laranja', light: 'bg-orange-200', medium: 'bg-orange-300', border: 'border-orange-500' },
  magenta: { name: 'Magenta', light: 'bg-pink-200', medium: 'bg-pink-300', border: 'border-pink-500' },
  cyan: { name: 'Ciano', light: 'bg-cyan-200', medium: 'bg-cyan-300', border: 'border-cyan-500' },
};
const DEFAULT_COLOR_THEME = 'violet';


const DisplayPanel = React.memo(({
  panel,
  metrics,
  style,
  isSelected,
  isSelectedForCabling,
  onClick,
  isExporting = false,
  viewMode,
  isEditMode,
  isEraseMode,
  onModuleClick,
  onPanelDragStart
}: {
  panel: Panel,
  metrics: PanelMetrics | null,
  style: React.CSSProperties,
  isSelected: boolean,
  isSelectedForCabling: boolean,
  onClick: () => void,
  isExporting?: boolean,
  viewMode: ViewMode,
  isEditMode: boolean,
  isEraseMode: boolean,
  onModuleClick: (panelId: string, moduleIndex: number) => void;
  onPanelDragStart: (panelId: string, e: React.MouseEvent) => void;
}) => {
    if (!metrics) return null;

    const theme = COLOR_THEMES[panel.colorTheme || DEFAULT_COLOR_THEME] || COLOR_THEMES[DEFAULT_COLOR_THEME];

    const gridStyle = {
        '--cols': metrics.modulesWide,
        '--rows': metrics.modulesHigh,
    } as React.CSSProperties;
    
    const totalPossibleModules = metrics.modulesWide * metrics.modulesHigh;
    
    const getCursor = () => {
      if (viewMode === 'cabling') {
        return 'cursor-pointer';
      }
      if (isEditMode) {
        return isEraseMode ? 'cursor-default' : 'cursor-move';
      }
      return 'cursor-pointer';
    };
    
    const panelCursor = getCursor();
    const borderClass = 
      viewMode === 'cabling' && isSelectedForCabling && !isExporting
      ? 'border-blue-500 border-dashed border-2 shadow-lg ring-2 ring-offset-2 ring-blue-500'
      : isSelected && !isExporting && viewMode === 'layout' 
      ? `${theme.border} shadow-lg ring-2 ring-offset-2 ${theme.border}` 
      : `${theme.border}`;


    return (
        <div 
            className={`absolute transition-transform duration-200 group ${panelCursor} z-10`}
            style={style}
            onClick={onClick}
            onMouseDown={viewMode === 'layout' && isEditMode && !isEraseMode ? (e) => onPanelDragStart(panel.id, e) : undefined}
        >
            {/* Main panel body with grid */}
            <div 
                className={`w-full h-full grid grid-cols-[repeat(var(--cols),_1fr)] grid-rows-[repeat(var(--rows),_1fr)] border ${borderClass}`}
                style={gridStyle}
            >
                {Array.from({ length: totalPossibleModules }).map((_, i) => {
                    const isHidden = panel.hiddenModuleIndices?.includes(i);
                    const row = Math.floor(i / metrics.modulesWide);
                    const col = i % metrics.modulesWide;
                    
                    const finalBgColor = isHidden 
                        ? (isExporting ? 'bg-transparent' : 'bg-slate-100')
                        : (row + col) % 2 === 0 ? theme.light : theme.medium;
                        
                    const interactiveClasses = viewMode === 'layout' && isEditMode && isEraseMode && !isHidden ? 'cursor-crosshair hover:ring-2 ring-red-500/80 ring-inset' : '';

                    return <div 
                        key={i} 
                        className={`${finalBgColor} transition-colors duration-200 ${interactiveClasses}`}
                        onClick={viewMode === 'layout' && isEditMode && isEraseMode ? (e) => { e.stopPropagation(); onModuleClick(panel.id, i); } : undefined}
                   />;
                })}
            </div>
            
            {/* Horizontal Dimension Text - ALWAYS VISIBLE */}
            <div className={`absolute -bottom-7 left-0 w-full h-6 flex items-center justify-center`}>
                <span className="text-xs bg-brand-gray-light px-1 text-brand-gray-text underline decoration-brand-gray-dark decoration-1 underline-offset-2">{panel.widthM}m / {metrics.totalPxWidth}px</span>
            </div>

            {/* Vertical Dimension Text - ALWAYS VISIBLE */}
            <div className={`absolute -left-16 top-0 h-full w-14 flex items-center justify-center`}>
                <span className="text-xs bg-brand-gray-light px-1 text-brand-gray-text underline decoration-brand-gray-dark decoration-1 underline-offset-2 transform -rotate-90 whitespace-nowrap">{panel.heightM}m / {metrics.totalPxHeight}px</span>
            </div>
        </div>
    );
});


const OutputPanel = React.memo(({
    panel,
    metrics,
    style,
    isSelected,
    onPanelDragStart,
    isExporting = false,
    panelNumber,
}: {
    panel: Panel,
    metrics: PanelMetrics | null,
    style: React.CSSProperties,
    isSelected: boolean,
    onPanelDragStart: (panelId: string, e: React.MouseEvent) => void;
    isExporting?: boolean;
    panelNumber: number;
}) => {
    if (!metrics) return null;
    const theme = COLOR_THEMES[panel.colorTheme || DEFAULT_COLOR_THEME] || COLOR_THEMES[DEFAULT_COLOR_THEME];
    
    const rotation = panel.outputRotation || 0;
    
    const finalStyle = {
      ...style,
      transform: `${style.transform || ''} rotate(${rotation}deg)`
    };
    
    const gridStyle = {
        '--cols': metrics.modulesWide,
        '--rows': metrics.modulesHigh,
    } as React.CSSProperties;

    const totalPossibleModules = metrics.modulesWide * metrics.modulesHigh;

    return (
        <div
            className={`absolute shadow-lg border transition-all duration-150 ${!isExporting ? 'cursor-move' : ''} ${isSelected && !isExporting ? 'ring-2 ring-amber-400 z-20' : 'z-10'} ${theme.border}`}
            style={finalStyle}
            onMouseDown={(e) => { e.stopPropagation(); onPanelDragStart(panel.id, e); }}
        >
            {/* Grid for modules */}
            <div
                className="w-full h-full grid grid-cols-[repeat(var(--cols),_1fr)] grid-rows-[repeat(var(--rows),_1fr)]"
                style={gridStyle}
            >
                {Array.from({ length: totalPossibleModules }).map((_, i) => {
                    const isHidden = panel.hiddenModuleIndices?.includes(i);
                    const row = Math.floor(i / metrics.modulesWide);
                    const col = i % metrics.modulesWide;
                    
                    const finalBgColor = isHidden 
                        ? 'bg-transparent'
                        : (row + col) % 2 === 0 ? theme.light : theme.medium;
                        
                    return <div key={i} className={`${finalBgColor} transition-colors duration-200`} />;
                })}
            </div>

            {/* Number Display */}
            <div className={`absolute top-1 left-1 bg-brand-purple text-white rounded-full flex items-center justify-center font-bold shadow-md z-10 ${isExporting ? 'w-8 h-8 text-lg' : 'w-5 h-5 text-xs'}`}>
                {panelNumber}
            </div>

            {/* Overlay for text information */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                 <div className="text-center text-white p-1 overflow-hidden bg-black/40 rounded-md">
                    <p className="text-xs font-bold truncate">{panel.name}</p>
                    <p className="text-[10px] font-mono leading-tight">{metrics.totalPxWidth}x{metrics.totalPxHeight}px</p>
                </div>
            </div>
        </div>
    );
});


const PanelConfigurationCard: React.FC<{
  panel: Panel;
  onUpdate: (id: string, newConfig: Partial<Panel>) => void;
  onRemove: (id: string) => void;
  isEditMode: boolean;
  allPanelTypes: PanelTypeInfo[];
  onOpenCreatePanelType: (panelId: string) => void;
}> = React.memo(({ panel, onUpdate, onRemove, isEditMode, allPanelTypes, onOpenCreatePanelType }) => {
  const panelTypeOptions = useMemo(() => [
    ...allPanelTypes.map(pt => ({ value: pt.id, label: pt.name })),
    { value: 'CREATE_NEW', label: '✨ Criar novo tipo de painel...' }
  ], [allPanelTypes]);


  return (
    <div className="bg-white p-6 rounded-xl border border-brand-gray shadow-sm">
      <div className="flex justify-between items-center mb-4 gap-4">
        <input
          type="text"
          value={panel.name}
          onChange={(e) => onUpdate(panel.id, { name: e.target.value })}
          className="text-xl font-bold text-brand-gray-text bg-transparent focus:bg-white focus:ring-1 focus:ring-brand-purple rounded-md -ml-2 px-2 py-1 w-full transition-all"
          aria-label="Nome do Painel"
        />
        <button onClick={() => onRemove(panel.id)} className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0">
          <TrashIcon className="w-6 h-6" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-brand-gray-dark mb-1">Tipo do Painel</label>
          <CustomSelect
            icon={<GridIcon className="w-5 h-5" />}
            options={panelTypeOptions}
            value={panel.panelTypeId}
            onChange={(value) => {
              if (value === 'CREATE_NEW') {
                onOpenCreatePanelType(panel.id);
              } else {
                onUpdate(panel.id, { panelTypeId: value });
              }
            }}
          />
        </div>
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
           <div>
              <label htmlFor={`width-${panel.id}`} className="block text-sm font-medium text-brand-gray-dark mb-1">Largura (metros)</label>
              <input
                type="number"
                id={`width-${panel.id}`}
                step="0.5"
                min="0.5"
                value={panel.widthM}
                onChange={(e) => onUpdate(panel.id, { widthM: parseFloat(e.target.value) || 0.5 })}
                className="w-full px-3 py-2 bg-white border border-brand-gray rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
           </div>
           <div>
              <label htmlFor={`height-${panel.id}`} className="block text-sm font-medium text-brand-gray-dark mb-1">Altura (metros)</label>
              <input
                type="number"
                id={`height-${panel.id}`}
                step="0.5"
                min="0.5"
                value={panel.heightM}
                onChange={(e) => onUpdate(panel.id, { heightM: parseFloat(e.target.value) || 0.5 })}
                className="w-full px-3 py-2 bg-white border border-brand-gray rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
           </div>
        </div>
      </div>
      {isEditMode && (
        <div className="mt-6 pt-4 border-t border-brand-gray">
          <label className="block text-sm font-medium text-brand-gray-dark mb-2">Tema de Cor</label>
          <div className="flex flex-wrap items-center gap-3">
            {Object.entries(COLOR_THEMES).map(([key, theme]) => (
              <button
                key={key}
                type="button"
                onClick={() => onUpdate(panel.id, { colorTheme: key })}
                title={theme.name}
                className={`w-7 h-7 rounded-full transition-all duration-150 focus:outline-none ${
                  (panel.colorTheme || DEFAULT_COLOR_THEME) === key
                    ? 'ring-2 ring-offset-2 ring-brand-purple scale-110'
                    : 'ring-1 ring-gray-300 hover:scale-110'
                }`}
              >
                <div className={`w-full h-full rounded-full ${theme.medium} border border-black/10`}></div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

const SummaryCard: React.FC<{ icon: React.ReactNode; title: string; value: string; unit: string; }> = ({ icon, title, value, unit }) => (
    <div className="bg-white p-4 rounded-xl border border-brand-gray shadow-sm flex items-center space-x-4">
        <div className="bg-brand-purple-light p-3 rounded-lg">
            {icon}
        </div>
        <div>
            <p className="text-sm text-brand-gray-dark">{title}</p>
            <p className="text-xl font-bold text-brand-gray-text">
                {value} <span className="text-base font-normal">{unit}</span>
            </p>
        </div>
    </div>
);

const CreatePanelTypeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (panelType: Omit<PanelTypeInfo, 'id'>) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [formState, setFormState] = useState({
        name: '',
        pxWidth: 0,
        pxHeight: 0,
        moduleWidthCm: 0,
        moduleHeightCm: 0,
        weightKg: 0,
        powerW: 0,
    });

    useEffect(() => {
        if (isOpen) {
            setFormState({
                name: '', pxWidth: 0, pxHeight: 0, moduleWidthCm: 0,
                moduleHeightCm: 0, weightKg: 0, powerW: 0,
            });
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: name === 'name' ? value : parseFloat(value) || 0 }));
    };

    const isFormValid = useMemo(() => {
        return Object.values(formState).every(value => (typeof value === 'string' ? value.trim() !== '' : value > 0));
    }, [formState]);
    
    const handleSubmit = () => {
        if (isFormValid) {
            onSave(formState);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4 transition-opacity">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-full overflow-y-auto">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-brand-gray-text">Criar Novo Tipo de Painel</h2>
                    <p className="text-sm text-brand-gray-dark mt-1">Defina as especificações do novo módulo de LED.</p>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-brand-gray-dark mb-1">Nome do Painel</label>
                        <input type="text" id="name" name="name" value={formState.name} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-brand-gray rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" placeholder="Ex: Painel Curvo P5"/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <h3 className="md:col-span-2 text-lg font-semibold text-brand-gray-text flex items-center gap-2"><ResolutionIcon className="w-5 h-5 text-brand-purple" /> Resolução do Módulo</h3>
                        <div className="pl-7">
                            <label htmlFor="pxWidth" className="block text-sm font-medium text-brand-gray-dark mb-1">Largura (pixels)</label>
                            <input type="number" id="pxWidth" name="pxWidth" value={formState.pxWidth} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-brand-gray rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" />
                        </div>
                        <div className="pl-7">
                            <label htmlFor="pxHeight" className="block text-sm font-medium text-brand-gray-dark mb-1">Altura (pixels)</label>
                            <input type="number" id="pxHeight" name="pxHeight" value={formState.pxHeight} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-brand-gray rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" />
                        </div>

                        <h3 className="md:col-span-2 text-lg font-semibold text-brand-gray-text flex items-center gap-2 pt-4"><DimensionsIcon className="w-5 h-5 text-brand-purple" /> Dimensões Físicas</h3>
                         <div className="pl-7">
                            <label htmlFor="moduleWidthCm" className="block text-sm font-medium text-brand-gray-dark mb-1">Largura do Módulo (cm)</label>
                            <input type="number" id="moduleWidthCm" name="moduleWidthCm" value={formState.moduleWidthCm} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-brand-gray rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" />
                        </div>
                         <div className="pl-7">
                            <label htmlFor="moduleHeightCm" className="block text-sm font-medium text-brand-gray-dark mb-1">Altura do Módulo (cm)</label>
                            <input type="number" id="moduleHeightCm" name="moduleHeightCm" value={formState.moduleHeightCm} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-brand-gray rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" />
                        </div>

                        <h3 className="md:col-span-2 text-lg font-semibold text-brand-gray-text flex items-center gap-2 pt-4"><WeightIcon className="w-5 h-5 text-brand-purple" /> Peso e Energia</h3>
                        <div className="pl-7">
                            <label htmlFor="weightKg" className="block text-sm font-medium text-brand-gray-dark mb-1">Peso por Módulo (kg)</label>
                            <input type="number" id="weightKg" name="weightKg" value={formState.weightKg} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-brand-gray rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" />
                        </div>
                        <div className="pl-7">
                            <label htmlFor="powerW" className="block text-sm font-medium text-brand-gray-dark mb-1">Consumo por Módulo (Watts)</label>
                            <input type="number" id="powerW" name="powerW" value={formState.powerW} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-brand-gray rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end items-center p-6 bg-brand-gray-light rounded-b-xl space-x-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-brand-gray-text hover:bg-brand-gray transition-colors">Cancelar</button>
                    <button onClick={handleSubmit} disabled={!isFormValid} className="flex items-center space-x-2 bg-brand-purple text-white px-5 py-2 rounded-lg hover:bg-brand-purple-dark transition-colors shadow-sm disabled:bg-brand-gray-dark disabled:cursor-not-allowed">
                        <span>Salvar Painel</span>
                    </button>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [content, setContent] = useState(CONTENT_MANUAL_DEFAULT);
  const [isContentEditable, setIsContentEditable] = useState(false);
  
  const [viewMode, setViewMode] = useState<ViewMode>('layout');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEraseMode, setIsEraseMode] = useState(false);
  const [draggingPanel, setDraggingPanel] = useState<{ id: string, offset: { x: number, y: number } } | null>(null);
  const [draggingOutputPanel, setDraggingOutputPanel] = useState<{ id: string, offset: { x: number, y: number } } | null>(null);
  const [selectedOutputPanelId, setSelectedOutputPanelId] = useState<string | null>(null);
  const [draggingSidebarPanelId, setDraggingSidebarPanelId] = useState<string | null>(null);
  const [sidebarDropTargetId, setSidebarDropTargetId] = useState<string | null>(null);

  const displayAreaRef = useRef<HTMLDivElement>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    eventName: '',
    client: '',
    fileName: `pixelmap_${new Date().toISOString().slice(0, 10)}`,
    docDate: new Date().toLocaleDateString('pt-BR'),
    logoSrc: ''
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgressMessage, setExportProgressMessage] = useState('');
  const [exportRenderData, setExportRenderData] = useState<{
    config: typeof exportConfig;
    view: ViewMode;
    viewport: { zoom: number; pan: { x: number; y: number } };
  } | null>(null);
  
  const [customPanelTypes, setCustomPanelTypes] = useState<PanelTypeInfo[]>([]);
  const allPanelTypes = useMemo(() => [...PANEL_TYPES, ...customPanelTypes], [customPanelTypes]);
  const [isCreatePanelTypeModalOpen, setIsCreatePanelTypeModalOpen] = useState(false);
  const [panelIdToUpdateWithNewType, setPanelIdToUpdateWithNewType] = useState<string | null>(null);

  const [cables, setCables] = useState<Cable[]>([]);
  const [drawingState, setDrawingState] = useState<{ active: boolean; points: CablePoint[] }>({ active: false, points: [] });
  const [snapPoint, setSnapPoint] = useState<(CablePoint & { x: number, y: number }) | null>(null);
  const [selectedCableId, setSelectedCableId] = useState<string | null>(null);
  const lastClickTime = useRef(0);
  const DOUBLE_CLICK_THRESHOLD = 300; // ms
  const [isDeleteCableMode, setIsDeleteCableMode] = useState(false);
  
  const [outputResolution, setOutputResolution] = useState({ width: 1920, height: 1080 });

  // Auto-cabling state
  const [selectedPanelsForCabling, setSelectedPanelsForCabling] = useState<string[]>([]);
  const [autoCablingSettings, setAutoCablingSettings] = useState({
      limit: 16,
      pattern: 'snake-vertical-up-down' as CablingPattern,
  });
  
  const PIXELS_PER_METER = 50;

  const addPanel = useCallback((layoutType: PanelLayoutType, name: string) => {
    const newPanel: Panel = {
      id: `panel_${Date.now()}`,
      name: `${name} ${panels.filter(p => p.layoutType === layoutType).length + 1}`,
      layoutType,
      panelTypeId: 'p3',
      widthM: 2,
      heightM: 2,
      spacingRightM: layoutType === 'dj-booth' ? 0 : 1.5,
      hiddenModuleIndices: [],
      colorTheme: DEFAULT_COLOR_THEME,
      outputPosition: { x: 20, y: 20 },
      outputRotation: 0,
    };
    
    setPanels(prev => {
        const left = prev.filter(p => p.layoutType === 'left-strip');
        const center = prev.filter(p => p.layoutType === 'center');
        const right = prev.filter(p => p.layoutType === 'right-strip');
        const dj = prev.filter(p => p.layoutType === 'dj-booth');

        switch(layoutType) {
            case 'left-strip':
                return [...left, newPanel, ...center, ...right, ...dj];
            case 'center':
                return [...left, ...center, newPanel, ...right, ...dj];
            case 'right-strip':
                 return [...left, ...center, ...right, newPanel, ...dj];
            case 'dj-booth':
                return [...left, ...center, ...right, ...dj, newPanel];
            default:
                return [...prev, newPanel];
        }
    });
  }, [panels]);

  const updatePanel = useCallback((id: string, newConfig: Partial<Panel>) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, ...newConfig } : p));
  }, []);

  const removePanel = useCallback((id: string) => {
    setPanels(prev => prev.filter(p => p.id !== id));
    if (selectedPanelId === id) {
      setSelectedPanelId(null);
    }
    if (selectedOutputPanelId === id) {
        setSelectedOutputPanelId(null);
    }
    // Remove any cables connected to the deleted panel
    setCables(prevCables => {
      const nextCables = prevCables
        .map(cable => {
          const newPoints = cable.points.filter(p => p.panelId !== id);
          return { ...cable, points: newPoints };
        })
        .filter(cable => cable.points.length >= 2); // Remove cables that are now too short or invalid
      
      if (selectedCableId && !nextCables.some(c => c.id === selectedCableId)) {
        setSelectedCableId(null);
      }
      
      return nextCables;
    });
    // Remove from auto-cabling selection
    setSelectedPanelsForCabling(prev => prev.filter(panelId => panelId !== id));
  }, [selectedPanelId, selectedOutputPanelId, selectedCableId]);
  
  const handleModuleClick = useCallback((panelId: string, moduleIndex: number) => {
    if (viewMode === 'layout' && isEditMode && isEraseMode) {
      setPanels(prev => prev.map(p => {
          if (p.id === panelId) {
              const hidden = p.hiddenModuleIndices || [];
              const newHidden = hidden.includes(moduleIndex)
                  ? hidden.filter(i => i !== moduleIndex)
                  : [...hidden, moduleIndex];
              return { ...p, hiddenModuleIndices: newHidden };
          }
          return p;
      }));
    }
  }, [viewMode, isEditMode, isEraseMode]);
  
  const handlePanelClick = useCallback((panelId: string) => {
      if (viewMode === 'layout') {
          if (!isEditMode) {
              setSelectedPanelId(panelId);
              setSelectedOutputPanelId(null);
          }
      } else if (viewMode === 'cabling') {
          if (drawingState.active || isDeleteCableMode) return; // Don't select panels while drawing or deleting
          setSelectedCableId(null);
          setSelectedOutputPanelId(null);
          setSelectedPanelsForCabling(prev => 
              prev.includes(panelId) 
              ? prev.filter(id => id !== panelId) 
              : [...prev, panelId]
          );
      } else if (viewMode === 'output') {
          setSelectedPanelId(null);
          setSelectedOutputPanelId(panelId);
      }
  }, [viewMode, isEditMode, drawingState.active, isDeleteCableMode]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
       if (event.key === 'Escape') {
        if (drawingState.active) {
            setDrawingState({ active: false, points: [] });
            setSnapPoint(null);
        }
        if (isDeleteCableMode) {
          setIsDeleteCableMode(false);
        }
        if (selectedCableId) {
            setSelectedCableId(null);
        }
        if (selectedPanelsForCabling.length > 0) {
            setSelectedPanelsForCabling([]);
        }
        if (selectedOutputPanelId) {
            setSelectedOutputPanelId(null);
        }
       }
       if (selectedCableId && (event.key === 'Delete' || event.key === 'Backspace')) {
          setCables(prev => prev.filter(c => c.id !== selectedCableId));
          setSelectedCableId(null);
       }
       if (selectedOutputPanelId && (event.key === 'Delete' || event.key === 'Backspace')) {
          const panelToRemove = panels.find(p => p.id === selectedOutputPanelId);
          if (panelToRemove) {
            removePanel(panelToRemove.id);
          }
       }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawingState.active, selectedCableId, selectedPanelsForCabling.length, isDeleteCableMode, selectedOutputPanelId, panels, removePanel]);

  const panelMetrics = useMemo(() => {
    const metricsMap = new Map<string, PanelMetrics>();
    let totalModules = 0;
    let totalWeight = 0;
    let totalKva = 0;

    panels.forEach(panel => {
      const metrics = calculatePanelMetrics(panel, allPanelTypes);
      if (metrics) {
        metricsMap.set(panel.id, metrics);
        totalModules += metrics.totalModules;
        totalWeight += metrics.totalWeightKg;
        totalKva += metrics.totalKva;
      }
    });

    return {
      metricsMap,
      totalModules,
      totalWeight,
      totalKva,
    };
  }, [panels, allPanelTypes]);

  const summaryData = useMemo(() => {
    if (selectedPanelId && panelMetrics.metricsMap.has(selectedPanelId)) {
        const selectedMetrics = panelMetrics.metricsMap.get(selectedPanelId)!;
        return {
            modules: selectedMetrics.totalModules,
            weight: selectedMetrics.totalWeightKg,
            kva: selectedMetrics.totalKva,
            resolution: `${selectedMetrics.totalPxWidth}x${selectedMetrics.totalPxHeight}`,
            resolutionTitle: "Resolução (Selecionada)",
        };
    }
    // Totals
    return {
        modules: panelMetrics.totalModules,
        weight: panelMetrics.totalWeight,
        kva: panelMetrics.totalKva,
        resolution: panels.length > 0 ? "N/A" : "-",
        resolutionTitle: "Resolução",
    };
  }, [selectedPanelId, panelMetrics, panels.length]);

  const exportSummaryData = useMemo(() => {
    const { totalModules, totalWeight, totalKva } = panelMetrics;

    let resolution = 'N/A';
    let shouldShowResolution = false;

    if (panels.length === 1 && panels[0].layoutType === 'center') {
      const singlePanelMetrics = panelMetrics.metricsMap.get(panels[0].id);
      if (singlePanelMetrics) {
        resolution = `${singlePanelMetrics.totalPxWidth}x${singlePanelMetrics.totalPxHeight}`;
        shouldShowResolution = true;
      }
    }

    return {
      modules: totalModules,
      weight: totalWeight,
      kva: totalKva,
      resolution,
      shouldShowResolution,
    };
  }, [panels, panelMetrics]);

  const allPanelLayouts = useMemo(() => {
    const layouts: { [key: string]: { left: number; top: number; width: number; height: number; } } = {};
    let currentX = 0;

    const mainPanels = panels.filter(p => p.layoutType !== 'dj-booth');
    const mainRowHeightM = Math.max(0, ...mainPanels.map(p => p.heightM));

    mainPanels.forEach(panel => {
        const widthPx = panel.widthM * PIXELS_PER_METER;
        const heightPx = panel.heightM * PIXELS_PER_METER;
        
        const topPosition = (mainRowHeightM - panel.heightM) / 2 * PIXELS_PER_METER;
        const leftPosition = currentX;
        
        layouts[panel.id] = {
            left: panel.customPosition?.x ?? leftPosition,
            top: panel.customPosition?.y ?? topPosition,
            width: widthPx,
            height: heightPx,
        };

        if (!panel.customPosition) {
            currentX += widthPx + (panel.spacingRightM * PIXELS_PER_METER);
        }
    });

    const centerPanels = panels.filter(p => p.layoutType === 'center');
    let djBoothCenterX;

    if (centerPanels.length > 0) {
        const centerPanelLayouts = centerPanels.map(p => layouts[p.id]).filter(Boolean);
        const firstCenterLeft = Math.min(...centerPanelLayouts.map(l => l.left));
        const lastCenterRight = Math.max(...centerPanelLayouts.map(l => l.left + l.width));
        djBoothCenterX = firstCenterLeft + (lastCenterRight - firstCenterLeft) / 2;
    } else {
        const mainPanelLayouts = mainPanels.map(p => layouts[p.id]).filter(Boolean);
        if (mainPanelLayouts.length > 0) {
            const firstLeft = Math.min(...mainPanelLayouts.map(l => l.left));
            const lastRight = Math.max(...mainPanelLayouts.map(l => l.left + l.width));
            djBoothCenterX = firstLeft + (lastRight - firstLeft) / 2;
        } else {
            djBoothCenterX = 0;
        }
    }

    const djBoothPanels = panels.filter(p => p.layoutType === 'dj-booth');
    let djBoothCurrentY = (mainRowHeightM * PIXELS_PER_METER) + 50;

    djBoothPanels.forEach(panel => {
        const widthPx = panel.widthM * PIXELS_PER_METER;
        const heightPx = panel.heightM * PIXELS_PER_METER;
        
        const leftPosition = djBoothCenterX - (widthPx / 2);
        const topPosition = djBoothCurrentY;

        layouts[panel.id] = {
            left: panel.customPosition?.x ?? leftPosition,
            top: panel.customPosition?.y ?? topPosition,
            width: widthPx,
            height: heightPx,
        };

        if(!panel.customPosition) {
            djBoothCurrentY += heightPx + 10;
        }
    });
    
    return layouts;
  }, [panels]);

  const contentBounds = useMemo(() => {
    if (panels.length === 0) return { minX: 0, minY: 0, width: 0, height: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    panels.forEach(panel => {
      const layout = allPanelLayouts[panel.id];
      if (layout) {
        minX = Math.min(minX, layout.left);
        minY = Math.min(minY, layout.top);
        maxX = Math.max(maxX, layout.left + layout.width);
        maxY = Math.max(maxY, layout.top + layout.height);
      }
    });
    if (minX === Infinity) return { minX: 0, minY: 0, width: 0, height: 0 };
    return { minX, minY, width: maxX - minX, height: maxY - minY };
  }, [panels, allPanelLayouts]);
  
  const allModuleCenters = useMemo(() => {
    const centers: (CablePoint & { x: number; y: number })[] = [];
    panels.forEach(panel => {
        const layout = allPanelLayouts[panel.id];
        const metrics = panelMetrics.metricsMap.get(panel.id);
        const panelType = allPanelTypes.find(p => p.id === panel.panelTypeId);
        if (!layout || !metrics || !panelType) return;

        const moduleWidthPx = (panelType.moduleWidthCm / 100) * PIXELS_PER_METER;
        const moduleHeightPx = (panelType.moduleHeightCm / 100) * PIXELS_PER_METER;
        
        const totalPossibleModules = metrics.modulesWide * metrics.modulesHigh;
        for (let i = 0; i < totalPossibleModules; i++) {
            if (panel.hiddenModuleIndices?.includes(i)) continue;

            const row = Math.floor(i / metrics.modulesWide);
            const col = i % metrics.modulesWide;
            
            const centerX = layout.left + (col * moduleWidthPx) + (moduleWidthPx / 2);
            const centerY = layout.top + (row * moduleHeightPx) + (moduleHeightPx / 2);
            centers.push({ x: centerX, y: centerY, panelId: panel.id, moduleIndex: i });
        }
    });
    return centers;
  }, [panels, allPanelLayouts, panelMetrics.metricsMap, allPanelTypes]);

  const moduleCenterCoords = useMemo(() => {
      const coordMap = new Map<string, {x: number, y: number}>();
      allModuleCenters.forEach(center => {
          coordMap.set(`${center.panelId}-${center.moduleIndex}`, {x: center.x, y: center.y});
      });
      return coordMap;
  }, [allModuleCenters]);

  const renderPanelsForDisplay = useCallback((isExporting = false) => {
    return panels.map(panel => {
        const metrics = panelMetrics.metricsMap.get(panel.id);
        const layout = allPanelLayouts[panel.id];
        if (!metrics || !layout) return null;

        return (
            <DisplayPanel
                key={panel.id}
                panel={panel}
                metrics={metrics}
                style={{
                    width: `${layout.width}px`,
                    height: `${layout.height}px`,
                    transform: `translate(${layout.left}px, ${layout.top}px)`
                }}
                isSelected={selectedPanelId === panel.id}
                isSelectedForCabling={selectedPanelsForCabling.includes(panel.id)}
                onClick={() => handlePanelClick(panel.id)}
                isExporting={isExporting}
                viewMode={viewMode}
                isEditMode={isEditMode}
                isEraseMode={isEraseMode}
                onModuleClick={handleModuleClick}
                onPanelDragStart={handlePanelDragStart}
            />
        );
    });
  }, [panels, panelMetrics, allPanelLayouts, selectedPanelId, selectedPanelsForCabling, viewMode, isEditMode, isEraseMode, handlePanelClick, handleModuleClick]);

  const centerAndFit = useCallback(() => {
    if (!displayAreaRef.current) return;

    const BORDER_PADDING = 150;
    const container = displayAreaRef.current;
    const availableWidth = viewMode === 'output' ? container.clientWidth - 256 : container.clientWidth; // 256px for sidebar
    const containerHeight = container.clientHeight;

    if (viewMode === 'output') {
        const scaleX = (availableWidth - BORDER_PADDING) / outputResolution.width;
        const scaleY = (containerHeight - BORDER_PADDING) / outputResolution.height;
        const newZoom = Math.min(scaleX, scaleY, 2);

        const newPanX = (availableWidth / newZoom - outputResolution.width) / 2;
        const newPanY = (containerHeight / newZoom - outputResolution.height) / 2;
        
        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
        return;
    }
    
    if (contentBounds.width <= 0 || contentBounds.height <= 0) {
        if (panels.length === 0) {
          setPan({ x: 0, y: 0 });
          setZoom(1);
        }
        return;
    }

    const scaleX = (container.clientWidth - BORDER_PADDING) / contentBounds.width;
    const scaleY = (container.clientHeight - BORDER_PADDING) / contentBounds.height;
    const newZoom = Math.min(scaleX, scaleY, 1.2);

    const newPanX = (container.clientWidth / newZoom - contentBounds.width) / 2 - contentBounds.minX;
    const newPanY = (container.clientHeight / newZoom - contentBounds.height) / 2 - contentBounds.minY;
    
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [contentBounds, panels.length, viewMode, outputResolution]);

  useEffect(() => {
      centerAndFit();
  }, [centerAndFit, viewMode]);
  
  const handleResetLayout = () => {
    setPanels(prev => prev.map(p => ({ ...p, customPosition: undefined, hiddenModuleIndices: [] })));
  };

  const handlePanelDragStart = (panelId: string, e: React.MouseEvent) => {
    if (viewMode !== 'layout' || !isEditMode || isEraseMode || !displayAreaRef.current) return;
    const displayAreaRect = displayAreaRef.current.getBoundingClientRect();
    const panelLayout = allPanelLayouts[panelId];
    if (!panelLayout) return;
    const startXInContent = (e.clientX - displayAreaRect.left) / zoom - pan.x;
    const startYInContent = (e.clientY - displayAreaRect.top) / zoom - pan.y;
    const offsetX = startXInContent - panelLayout.left;
    const offsetY = startYInContent - panelLayout.top;
    setDraggingPanel({ id: panelId, offset: { x: offsetX, y: offsetY } });
  };
  
  const getOutputPanelBoundingBox = useCallback((panel: Panel, metrics: PanelMetrics | null) => {
      if (!metrics || !panel.outputPosition) return null;
      const { x, y } = panel.outputPosition;
      const rotation = panel.outputRotation || 0;

      let width = metrics.totalPxWidth;
      let height = metrics.totalPxHeight;

      if (rotation === 90 || rotation === 270) {
          [width, height] = [height, width];
      }
      return { left: x, right: x + width, top: y, bottom: y + height, width, height };
  }, []);
  
  const handleOutputPanelDragStart = (panelId: string, e: React.MouseEvent) => {
    if (viewMode !== 'output' || !displayAreaRef.current) return;
    const displayAreaRect = displayAreaRef.current.getBoundingClientRect();
    const panel = panels.find(p => p.id === panelId);
    
    if (!panel || !panel.outputPosition) return;

    const startXInContent = (e.clientX - displayAreaRect.left) / zoom - pan.x;
    const startYInContent = (e.clientY - displayAreaRect.top) / zoom - pan.y;

    const offsetX = startXInContent - panel.outputPosition.x;
    const offsetY = startYInContent - panel.outputPosition.y;
    setDraggingOutputPanel({ id: panelId, offset: { x: offsetX, y: offsetY } });
};

  const handleDisplayMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
        const newX = (e.clientX - panStart.current.x) / zoom;
        const newY = (e.clientY - panStart.current.y) / zoom;
        setPan({ x: newX, y: newY });
        return;
    }
    
    if (viewMode === 'output' && draggingOutputPanel && displayAreaRef.current) {
        const displayAreaRect = displayAreaRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - displayAreaRect.left) / zoom - pan.x;
        const mouseY = (e.clientY - displayAreaRect.top) / zoom - pan.y;
        
        const rawX = mouseX - draggingOutputPanel.offset.x;
        const rawY = mouseY - draggingOutputPanel.offset.y;

        const SNAP_THRESHOLD = 10 / zoom;
        const draggingP = panels.find(p => p.id === draggingOutputPanel.id)!;
        const draggingM = panelMetrics.metricsMap.get(draggingP.id)!;
        
        const draggingBox = getOutputPanelBoundingBox({ ...draggingP, outputPosition: {x: rawX, y: rawY}}, draggingM)!;
        
        const targetXEdges = [0, outputResolution.width];
        const targetYEdges = [0, outputResolution.height];
        panels.forEach(p => {
            if (p.id === draggingOutputPanel.id) return;
            const staticM = panelMetrics.metricsMap.get(p.id);
            const staticBox = getOutputPanelBoundingBox(p, staticM);
            if (staticBox) {
                targetXEdges.push(staticBox.left, staticBox.right);
                targetYEdges.push(staticBox.top, staticBox.bottom);
            }
        });

        let bestSnapX = { delta: Infinity, position: rawX };
        let bestSnapY = { delta: Infinity, position: rawY };

        // Find best snap for X
        for (const target of targetXEdges) {
            let delta = Math.abs(draggingBox.left - target);
            if (delta < bestSnapX.delta) {
                bestSnapX = { delta, position: target };
            }
            delta = Math.abs(draggingBox.right - target);
            if (delta < bestSnapX.delta) {
                bestSnapX = { delta, position: target - draggingBox.width };
            }
        }

        // Find best snap for Y
        for (const target of targetYEdges) {
            let delta = Math.abs(draggingBox.top - target);
            if (delta < bestSnapY.delta) {
                bestSnapY = { delta, position: target };
            }
            delta = Math.abs(draggingBox.bottom - target);
            if (delta < bestSnapY.delta) {
                bestSnapY = { delta, position: target - draggingBox.height };
            }
        }
        
        const finalX = bestSnapX.delta < SNAP_THRESHOLD ? bestSnapX.position : rawX;
        const finalY = bestSnapY.delta < SNAP_THRESHOLD ? bestSnapY.position : rawY;
        
        updatePanel(draggingOutputPanel.id, { outputPosition: { x: Math.round(finalX), y: Math.round(finalY) } });
        return;
    }

    if (viewMode === 'layout' && draggingPanel && isEditMode && !isEraseMode && displayAreaRef.current) {
        const panelBeingDragged = panels.find(p => p.id === draggingPanel.id);
        const panelType = panelBeingDragged ? allPanelTypes.find(pt => pt.id === panelBeingDragged.panelTypeId) : null;
        if (!panelType) return;
        const moduleWidthPx = (panelType.moduleWidthCm / 100) * PIXELS_PER_METER;
        const moduleHeightPx = (panelType.moduleHeightCm / 100) * PIXELS_PER_METER;
        const displayAreaRect = displayAreaRef.current.getBoundingClientRect();
        const rawX = (e.clientX - displayAreaRect.left) / zoom - pan.x - draggingPanel.offset.x;
        const rawY = (e.clientY - displayAreaRect.top) / zoom - pan.y - draggingPanel.offset.y;
        const snappedX = Math.round(rawX / moduleWidthPx) * moduleWidthPx;
        const snappedY = Math.round(rawY / moduleHeightPx) * moduleHeightPx;
        updatePanel(draggingPanel.id, { customPosition: { x: snappedX, y: snappedY } });
        return;
    }
    
    if (viewMode === 'cabling' && drawingState.active && displayAreaRef.current) {
        const displayAreaRect = displayAreaRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - displayAreaRect.left) / zoom - pan.x;
        const mouseY = (e.clientY - displayAreaRect.top) / zoom - pan.y;
        
        let closestPoint: (CablePoint & {x: number, y: number}) | null = null;
        let minDistance = (20 / zoom) ** 2; // Snap within a 20px radius

        for(const center of allModuleCenters) {
            const distance = (mouseX - center.x)**2 + (mouseY - center.y)**2;
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = center;
            }
        }
        setSnapPoint(closestPoint);
    } else if (snapPoint) {
        setSnapPoint(null);
    }
  };

  const handleDisplayMouseUp = (e: React.MouseEvent) => {
    if (draggingOutputPanel) {
        e.stopPropagation();
    }
    setIsPanning(false);
    setDraggingPanel(null);
    setDraggingOutputPanel(null);
  };
  
  const handleDisplayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only pan if clicking on the background, not on panels or other interactive elements.
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.pan-zoom-content > .absolute') === null) {
        e.preventDefault();
        setIsPanning(true);
        panStart.current = { x: e.clientX - pan.x * zoom, y: e.clientY - pan.y * zoom };
    }
  };
  
  const handleDisplayClick = (e: React.MouseEvent) => {
    if (viewMode === 'cabling') {
        if (drawingState.active) {
            const now = new Date().getTime();
            if (now - lastClickTime.current < DOUBLE_CLICK_THRESHOLD) {
                if (drawingState.points.length >= 2) {
                    const newCable: Cable = { id: `cable_${Date.now()}`, points: drawingState.points };
                    setCables(prev => [...prev, newCable]);
                }
                setDrawingState({ active: false, points: [] });
                setSnapPoint(null);
            } else {
                if (snapPoint) {
                    setDrawingState(prev => ({ ...prev, points: [...prev.points, {panelId: snapPoint.panelId, moduleIndex: snapPoint.moduleIndex}] }));
                }
            }
            lastClickTime.current = now;
            return;
        }
    }
    
    // Clear selections if clicking the background
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.pan-zoom-content > .absolute') === null && (e.target as HTMLElement).tagName !== 'svg' && (e.target as HTMLElement).tagName !== 'polyline') {
        setSelectedCableId(null);
        setSelectedPanelsForCabling([]);
        setSelectedOutputPanelId(null);
        setSelectedPanelId(null);
    }
  };

  const calculateExportViewport = useCallback((view: ViewMode) => {
    const EXPORT_CONTAINER_WIDTH = 1472; // 1600px container - (p-16 * 2) = 1472px
    const EXPORT_DISPLAY_HEIGHT = 800;

    if (view === 'output') {
        const EXPORT_OUTPUT_SIDEBAR_WIDTH = 384; // w-96
        const EXPORT_OUTPUT_CANVAS_AREA_WIDTH = EXPORT_CONTAINER_WIDTH - 64 - EXPORT_OUTPUT_SIDEBAR_WIDTH; // 1408 - 384 = 1024
        const BORDER_PADDING = 50;

        if (outputResolution.width <= 0 || outputResolution.height <= 0) return { zoom: 1, pan: { x: 0, y: 0 }};
        const scaleX = (EXPORT_OUTPUT_CANVAS_AREA_WIDTH - BORDER_PADDING) / outputResolution.width;
        const scaleY = (EXPORT_DISPLAY_HEIGHT - BORDER_PADDING) / outputResolution.height;
        const newZoom = Math.min(scaleX, scaleY);
        
        const newPanX = ((EXPORT_OUTPUT_CANVAS_AREA_WIDTH / newZoom) - outputResolution.width) / 2;
        const newPanY = ((EXPORT_DISPLAY_HEIGHT / newZoom) - outputResolution.height) / 2;
        return { zoom: newZoom, pan: { x: newPanX, y: newPanY } };
    }
    
    // layout and cabling
    const EXPORT_DISPLAY_WIDTH = EXPORT_CONTAINER_WIDTH - 64; // 1408px
    const BORDER_PADDING = 200; // Increased padding for dimension lines

    if (contentBounds.width <= 0 || contentBounds.height <= 0) return { zoom: 1, pan: { x: 0, y: 0 }};
    const scaleX = (EXPORT_DISPLAY_WIDTH - BORDER_PADDING) / contentBounds.width;
    const scaleY = (EXPORT_DISPLAY_HEIGHT - BORDER_PADDING) / contentBounds.height;
    const newZoom = Math.min(scaleX, scaleY);
    const newPanX = ((EXPORT_DISPLAY_WIDTH / newZoom) - contentBounds.width) / 2 - contentBounds.minX;
    const newPanY = ((EXPORT_DISPLAY_HEIGHT / newZoom) - contentBounds.height) / 2 - contentBounds.minY;
    return { zoom: newZoom, pan: { x: newPanX, y: newPanY } };
  }, [contentBounds, outputResolution]);

  const handleGeneratePdf = async () => {
    setIsExportModalOpen(false);
    setIsExporting(true);

    const { jsPDF } = jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px' });
    
    const viewsToExport: ViewMode[] = ['layout', 'cabling', 'output'];
    const exportTitles: Record<ViewMode, string> = {
      layout: 'Disposição dos Painéis',
      cabling: 'Mapa de Cabeamento',
      output: 'Mapa de Output de Vídeo'
    };

    try {
      for (let i = 0; i < viewsToExport.length; i++) {
        const view = viewsToExport[i];
        setExportProgressMessage(`Gerando ${exportTitles[view]} (${i + 1} de ${viewsToExport.length})...`);
        
        const viewport = calculateExportViewport(view);

        setExportRenderData({
            config: exportConfig,
            view: view,
            viewport: viewport,
        });

        await new Promise(resolve => setTimeout(resolve, 200));

        const exportNode = exportContainerRef.current;
        if (!exportNode) throw new Error("Export container not found.");

        const canvas = await html2canvas(exportNode, {
            scale: 2,
            backgroundColor: '#f8fafc',
            useCORS: true,
        });
        
        const imgData = canvas.toDataURL('image/png');

        if (i === 0) {
            pdf.internal.pageSize.width = canvas.width;
            pdf.internal.pageSize.height = canvas.height;
        } else {
            pdf.addPage([canvas.width, canvas.height], 'landscape');
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      }

      pdf.save(`${exportConfig.fileName}.pdf`);

    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.");
    } finally {
      setIsExporting(false);
      setExportProgressMessage('');
      setExportRenderData(null);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setExportConfig(prev => ({ ...prev, logoSrc: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const toggleEditMode = () => {
    const nextState = !isEditMode;
    setIsEditMode(nextState);
    if (!nextState) setIsEraseMode(false);
  };
  
  const toggleDrawingMode = () => {
      setDrawingState(prev => ({ active: !prev.active, points: [] }));
      if (!drawingState.active) { // entering draw mode
          setSelectedCableId(null);
          setSelectedPanelsForCabling([]);
          setIsDeleteCableMode(false);
      }
  };
  
  const toggleDeleteCableMode = () => {
      const nextState = !isDeleteCableMode;
      setIsDeleteCableMode(nextState);
      if (nextState) { // entering delete mode
          setDrawingState({ active: false, points: [] });
          setSelectedCableId(null);
          setSelectedPanelsForCabling([]);
      }
  };

  const handleOpenCreatePanelTypeModal = (panelId: string) => {
    setPanelIdToUpdateWithNewType(panelId);
    setIsCreatePanelTypeModalOpen(true);
  };

  const handleSaveCustomPanelType = (newPanelType: Omit<PanelTypeInfo, 'id'>) => {
    const newId = `${newPanelType.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    const finalNewPanelType = { ...newPanelType, id: newId };
    
    setCustomPanelTypes(prev => [...prev, finalNewPanelType]);

    if (panelIdToUpdateWithNewType) {
        updatePanel(panelIdToUpdateWithNewType, { panelTypeId: newId });
    }
    
    setIsCreatePanelTypeModalOpen(false);
    setPanelIdToUpdateWithNewType(null);
  };
  
  const isAutoCablingValid = useMemo(() => {
    if (selectedPanelsForCabling.length === 0) return false;
    const selectedPanelData = selectedPanelsForCabling
        .map(id => panels.find(p => p.id === id))
        .filter((p): p is Panel => !!p);

    if (selectedPanelData.length !== selectedPanelsForCabling.length) return false;

    const firstPanelType = allPanelTypes.find(pt => pt.id === selectedPanelData[0].panelTypeId);
    if (!firstPanelType) return false;
    
    const { moduleWidthCm, moduleHeightCm } = firstPanelType;

    return selectedPanelData.every(panel => {
        const panelType = allPanelTypes.find(pt => pt.id === panel.panelTypeId);
        return panelType && panelType.moduleWidthCm === moduleWidthCm && panelType.moduleHeightCm === moduleHeightCm;
    });
  }, [selectedPanelsForCabling, panels, allPanelTypes]);

  const handleGenerateAutoCables = () => {
    if (!isAutoCablingValid) return;

    const selectedPanelData = selectedPanelsForCabling
      .map(id => panels.find(p => p.id === id))
      .filter((p): p is Panel => !!p);

    const firstPanel = selectedPanelData[0];
    const firstPanelType = allPanelTypes.find(pt => pt.id === firstPanel.panelTypeId)!;
    const moduleWidthPx = (firstPanelType.moduleWidthCm / 100) * PIXELS_PER_METER;
    const moduleHeightPx = (firstPanelType.moduleHeightCm / 100) * PIXELS_PER_METER;

    let minGridX = Infinity;
    let minGridY = Infinity;

    const modulesToSort: { panelId: string; moduleIndex: number; gridX: number; gridY: number; }[] = [];
    selectedPanelData.forEach(panel => {
      const layout = allPanelLayouts[panel.id];
      const metrics = panelMetrics.metricsMap.get(panel.id);
      if (!layout || !metrics) return;

      const totalPossibleModules = metrics.modulesWide * metrics.modulesHigh;
      for (let i = 0; i < totalPossibleModules; i++) {
        if (panel.hiddenModuleIndices?.includes(i)) continue;

        const moduleRow = Math.floor(i / metrics.modulesWide);
        const moduleCol = i % metrics.modulesWide;

        const globalX = layout.left + (moduleCol * moduleWidthPx);
        const globalY = layout.top + (moduleRow * moduleHeightPx);
        
        const gridX = Math.round(globalX / moduleWidthPx);
        const gridY = Math.round(globalY / moduleHeightPx);

        minGridX = Math.min(minGridX, gridX);
        minGridY = Math.min(minGridY, gridY);

        modulesToSort.push({ panelId: panel.id, moduleIndex: i, gridX, gridY });
      }
    });

    const normalizedModules = modulesToSort.map(m => ({ ...m, gridX: m.gridX - minGridX, gridY: m.gridY - minGridY }));

    const pattern = autoCablingSettings.pattern;
    normalizedModules.sort((a, b) => {
      if (pattern === 'snake-vertical-up-down') {
        if (a.gridX !== b.gridX) return a.gridX - b.gridX;
        return a.gridX % 2 === 0 ? b.gridY - a.gridY : a.gridY - b.gridY;
      }
      if (pattern === 'snake-vertical-down-up') {
        if (a.gridX !== b.gridX) return a.gridX - b.gridX;
        return a.gridX % 2 === 0 ? a.gridY - b.gridY : b.gridY - a.gridY;
      }
      if (pattern === 'snake-horizontal-right-left-up') {
        if (a.gridY !== b.gridY) return b.gridY - a.gridY;
        const maxY = Math.max(...normalizedModules.map(m => m.gridY));
        const isRowEvenFromBottom = (maxY - a.gridY) % 2 === 0;
        return isRowEvenFromBottom ? a.gridX - b.gridX : b.gridX - a.gridX;
      }
      if (pattern === 'snake-horizontal-right-left-down') {
        if (a.gridY !== b.gridY) return a.gridY - b.gridY;
        return a.gridY % 2 === 0 ? a.gridX - b.gridX : b.gridX - a.gridX;
      }
      return 0;
    });

    const newCables: Cable[] = [];
    const limit = autoCablingSettings.limit;
    for (let i = 0; i < normalizedModules.length; i += limit) {
      const chunk = normalizedModules.slice(i, i + limit);
      if (chunk.length > 1) {
        const cablePoints: CablePoint[] = chunk.map(m => ({ panelId: m.panelId, moduleIndex: m.moduleIndex }));
        newCables.push({ id: `cable_auto_${Date.now()}_${i}`, points: cablePoints });
      }
    }
    
    const remainingCables = cables.filter(cable => !cable.points.some(point => selectedPanelsForCabling.includes(point.panelId)));
    setCables([...remainingCables, ...newCables]);
    setSelectedPanelsForCabling([]);
  };
  
  const handleRotateOutputPanel = (panelId: string, direction: 'cw' | 'ccw') => {
      setPanels(prev => prev.map(p => {
          if (p.id === panelId) {
              const currentRotation = p.outputRotation || 0;
              const nextRotation = direction === 'cw'
                  ? (currentRotation + 90) % 360
                  : (currentRotation - 90 + 360) % 360;
              return { ...p, outputRotation: nextRotation as Panel['outputRotation'] };
          }
          return p;
      }));
  };

  const renderExportContent = (view: ViewMode) => {
    switch (view) {
      case 'output':
        return (
          <div className="relative bg-gray-900 border border-gray-700 shadow-inner" style={{ width: outputResolution.width, height: outputResolution.height }}>
            {panels.map((panel, index) => {
              if (!panel.outputPosition) return null;
              const metrics = panelMetrics.metricsMap.get(panel.id);
              const pos = panel.outputPosition;
              if (!metrics) return null;
              return (
                <OutputPanel
                  key={panel.id}
                  panel={panel}
                  metrics={metrics}
                  isSelected={false}
                  isExporting={true}
                  style={{
                    width: metrics.totalPxWidth,
                    height: metrics.totalPxHeight,
                    transform: `translate(${pos.x}px, ${pos.y}px)`,
                    transformOrigin: 'top left',
                  }}
                  onPanelDragStart={() => {}}
                  panelNumber={index + 1}
                />
              );
            })}
          </div>
        );
      default:
        return null;
    }
  };

  const handleSidebarDrop = (dropTargetId: string) => {
    if (!draggingSidebarPanelId || draggingSidebarPanelId === dropTargetId) {
        setSidebarDropTargetId(null);
        return;
    }

    const draggedIndex = panels.findIndex(p => p.id === draggingSidebarPanelId);
    const targetIndex = panels.findIndex(p => p.id === dropTargetId);

    if (draggedIndex === -1 || targetIndex === -1) {
        setSidebarDropTargetId(null);
        return;
    }

    const newPanels = [...panels];
    const [draggedItem] = newPanels.splice(draggedIndex, 1);
    newPanels.splice(targetIndex, 0, draggedItem);
    
    setPanels(newPanels);
    setDraggingSidebarPanelId(null);
    setSidebarDropTargetId(null);
  };

  return (
    <div className="bg-brand-gray-light min-h-screen font-sans text-brand-gray-text">
      {isExporting && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center text-white">
            <div className="w-16 h-16 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
            <p className="mt-4 text-lg font-semibold">{exportProgressMessage}</p>
        </div>
      )}
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-3">
                    <CalculatorIcon className="w-8 h-8 text-brand-purple"/>
                    <h1 className="text-2xl font-bold text-brand-gray-text">Calculadora de Painel LED</h1>
                </div>
                <button 
                  onClick={() => setIsExportModalOpen(true)}
                  disabled={isExporting}
                  className="flex items-center space-x-2 bg-brand-purple text-white px-4 py-2 rounded-lg hover:bg-brand-purple-dark transition-colors shadow-sm disabled:bg-brand-gray-dark disabled:cursor-not-allowed">
                    <ExportIcon className="w-5 h-5"/>
                    <span>Exportar</span>
                </button>
            </div>
        </div>
      </header>
      
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-full overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-brand-gray-text">Configurar Exportação</h2>
              <p className="text-sm text-brand-gray-dark mt-1">Preencha os detalhes para o cabeçalho do seu PDF.</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="eventName" className="block text-sm font-medium text-brand-gray-dark mb-1">Nome do Evento</label>
                  <input type="text" id="eventName" value={exportConfig.eventName} onChange={(e) => setExportConfig(c => ({...c, eventName: e.target.value}))} className="w-full px-3 py-2 bg-white border border-brand-gray rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" />
                </div>
                <div>
                  <label htmlFor="clientName" className="block text-sm font-medium text-brand-gray-dark mb-1">Cliente</label>
                  <input type="text" id="clientName" value={exportConfig.client} onChange={(e) => setExportConfig(c => ({...c, client: e.target.value}))} className="w-full px-3 py-2 bg-white border border-brand-gray rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" />
                </div>
                <div>
                  <label htmlFor="fileName" className="block text-sm font-medium text-brand-gray-dark mb-1">Nome do Arquivo</label>
                  <input type="text" id="fileName" value={exportConfig.fileName} onChange={(e) => setExportConfig(c => ({...c, fileName: e.target.value}))} className="w-full px-3 py-2 bg-white border border-brand-gray rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" />
                </div>
                <div>
                  <label htmlFor="docDate" className="block text-sm font-medium text-brand-gray-dark mb-1">Data do Documento</label>
                  <input type="text" id="docDate" value={exportConfig.docDate} onChange={(e) => setExportConfig(c => ({...c, docDate: e.target.value}))} className="w-full px-3 py-2 bg-white border border-brand-gray rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-gray-dark mb-1">Logo Personalizado (PNG/JPG)</label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="w-24 h-24 border-2 border-dashed border-brand-gray rounded-lg flex items-center justify-center bg-brand-gray-light">
                    {exportConfig.logoSrc ? <img src={exportConfig.logoSrc} alt="Preview do Logo" className="max-w-full max-h-full object-contain" /> : <ImageUploadIcon className="w-10 h-10 text-brand-gray-dark" />}
                  </div>
                  <label htmlFor="logo-upload" className="cursor-pointer bg-white text-brand-purple-dark font-semibold py-2 px-4 border border-brand-purple rounded-lg hover:bg-brand-purple-light transition-colors">
                    Escolher Arquivo
                  </label>
                  <input id="logo-upload" name="logo-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleLogoChange} />
                  {exportConfig.logoSrc && <button onClick={() => setExportConfig(c => ({...c, logoSrc: ''}))} className="text-sm text-red-600 hover:underline">Remover</button>}
                </div>
                <p className="text-xs text-brand-gray-dark mt-2">Tamanho recomendado: 300x300px</p>
              </div>
            </div>
            <div className="flex justify-end items-center p-6 bg-brand-gray-light rounded-b-xl space-x-4">
              <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 rounded-lg text-brand-gray-text hover:bg-brand-gray transition-colors">Cancelar</button>
              <button onClick={handleGeneratePdf} className="flex items-center space-x-2 bg-brand-purple text-white px-5 py-2 rounded-lg hover:bg-brand-purple-dark transition-colors shadow-sm">
                <span>Exportar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <CreatePanelTypeModal
        isOpen={isCreatePanelTypeModalOpen}
        onClose={() => setIsCreatePanelTypeModalOpen(false)}
        onSave={handleSaveCustomPanelType}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Panel Controller */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => addPanel('left-strip', 'Tira Lateral Esquerda')} className="bg-white p-4 rounded-xl border border-brand-gray hover:border-brand-purple hover:shadow-lg transition-all flex items-center justify-center space-x-2">
                <PlusIcon className="w-5 h-5 text-brand-purple"/> <span>Tira Esquerda</span>
            </button>
            <button onClick={() => addPanel('center', 'Painel Central')} className="bg-white p-4 rounded-xl border border-brand-gray hover:border-brand-purple hover:shadow-lg transition-all flex items-center justify-center space-x-2">
                <PlusIcon className="w-5 h-5 text-brand-purple"/> <span>Painel Central</span>
            </button>
            <button onClick={() => addPanel('right-strip', 'Tira Lateral Direita')} className="bg-white p-4 rounded-xl border border-brand-gray hover:border-brand-purple hover:shadow-lg transition-all flex items-center justify-center space-x-2">
                <PlusIcon className="w-5 h-5 text-brand-purple"/> <span>Tira Direita</span>
            </button>
            <button onClick={() => addPanel('dj-booth', 'Boot de DJ')} className="bg-white p-4 rounded-xl border border-brand-gray hover:border-brand-purple hover:shadow-lg transition-all flex items-center justify-center space-x-2">
                <PlusIcon className="w-5 h-5 text-brand-purple"/> <span>Boot de DJ</span>
            </button>
        </div>

        {panels.length > 0 && <div className="space-y-6">
          {panels.map(panel => (
            <PanelConfigurationCard 
              key={panel.id} 
              panel={panel} 
              onUpdate={updatePanel} 
              onRemove={removePanel} 
              isEditMode={isEditMode}
              allPanelTypes={allPanelTypes}
              onOpenCreatePanelType={handleOpenCreatePanelTypeModal}
            />
          ))}
        </div>}
        
        <div className="fixed -left-[9999px] top-0" ref={exportContainerRef}>
          {exportRenderData && (
            <div className="p-16 bg-brand-gray-light w-[1600px]">
                <div className="flex justify-between items-start mb-8 border-b-2 border-gray-300 pb-6">
                    <div className="flex items-center space-x-8">
                        {exportRenderData.config.logoSrc && <img src={exportRenderData.config.logoSrc} alt="Logo" className="h-24 object-contain max-w-[300px]" />}
                        <div>
                            <h2 className="text-4xl font-bold text-gray-800">{exportRenderData.config.eventName}</h2>
                            <p className="text-xl text-gray-600 mt-1">Cliente: {exportRenderData.config.client}</p>
                        </div>
                    </div>
                    <div className="text-right text-gray-600">
                        <p className="font-semibold text-lg">{exportRenderData.config.fileName}</p>
                        <p>Data: {exportRenderData.config.docDate}</p>
                    </div>
                </div>
                 
                 {exportRenderData.view === 'layout' && (
                    <div className="bg-white p-8 rounded-xl border border-brand-gray shadow-sm mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <SummaryCard icon={<GridIcon className="w-7 h-7 text-brand-purple" />} title="Total de Placas" value={exportSummaryData.modules.toLocaleString('pt-BR')} unit="unidades" />
                            <SummaryCard icon={<WeightIcon className="w-7 h-7 text-brand-purple" />} title="Peso Total" value={exportSummaryData.weight.toLocaleString('pt-BR', {minimumFractionDigits: 1})} unit="kg" />
                            <SummaryCard icon={<PowerIcon className="w-7 h-7 text-brand-purple" />} title="Consumo de Energia" value={exportSummaryData.kva.toLocaleString('pt-BR', {minimumFractionDigits: 2})} unit="kVA" />
                            {exportSummaryData.shouldShowResolution && (
                              <SummaryCard icon={<ResolutionIcon className="w-7 h-7 text-brand-purple" />} title="Resolução" value={exportSummaryData.resolution} unit="px" />
                            )}
                        </div>
                    </div>
                 )}

                {exportRenderData.view === 'output' ? (
                  <div className="bg-white rounded-xl border border-brand-gray shadow-sm">
                    <div className="flex" style={{ height: '864px' }}> {/* Give flex container a fixed height */}
                      {/* Sidebar for Output Export */}
                      <div className="w-96 p-8 pt-6 border-r border-brand-gray bg-brand-gray-light flex-shrink-0 flex flex-col">
                        <h3 className="text-2xl font-bold text-brand-gray-text mb-2">
                          Mapa de Output de Vídeo
                        </h3>
                        <h4 className="text-lg font-semibold text-gray-700">Resolução do Output</h4>
                        <p className="font-mono text-gray-500 mb-6">{outputResolution.width}x{outputResolution.height}px</p>
                        <h4 className="text-lg font-semibold text-gray-700 mb-3">Painéis Mapeados</h4>
                        <div className="space-y-2 overflow-y-auto flex-1">
                          {panels.map((panel, index) => {
                            const metrics = panelMetrics.metricsMap.get(panel.id);
                            const hasPosition = !!panel.outputPosition;
                            return (
                              <div key={panel.id} className={`bg-white p-3 rounded-md border border-gray-200 ${!hasPosition && 'opacity-50 bg-gray-100'}`}>
                                <p className="font-semibold text-gray-800 text-sm truncate">
                                  <span className="font-bold w-8 inline-block text-center">{index + 1}.</span>{panel.name}
                                </p>
                                <div className="pl-8">
                                  <p className="text-xs text-gray-600">Res: {metrics?.totalPxWidth}x{metrics?.totalPxHeight}px</p>
                                  <p className="text-xs text-gray-600">Rot: {panel.outputRotation || 0}°</p>
                                  {!hasPosition && <p className="text-xs text-red-500 font-medium">Não posicionado</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* Canvas for Output Export */}
                      <div className="flex-1 relative bg-gray-800 overflow-hidden">
                        <div className="absolute top-0 left-0" style={{ transform: `scale(${exportRenderData.viewport.zoom}) translate(${exportRenderData.viewport.pan.x}px, ${exportRenderData.viewport.pan.y}px)`, transformOrigin: 'top left' }}>
                          {renderExportContent('output')}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-xl border border-brand-gray shadow-sm">
                      <h3 className="text-2xl font-bold text-brand-gray-text mb-6">
                        { exportRenderData.view === 'layout' ? 'Disposição dos Painéis' : 'Mapa de Cabeamento' }
                      </h3>
                      <div className={`relative w-full h-[800px] rounded-lg overflow-hidden border border-brand-gray bg-slate-100`}>
                         <div className="absolute top-0 left-0" style={{ transform: `scale(${exportRenderData.viewport.zoom}) translate(${exportRenderData.viewport.pan.x}px, ${exportRenderData.viewport.pan.y}px)`, transformOrigin: 'top left' }}>
                           {renderPanelsForDisplay(true)}
                         </div>
                         {exportRenderData.view === 'cabling' && (
                            <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none z-20">
                                <defs>
                                    <marker id="arrowhead-export-fix" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                                    </marker>
                                </defs>
                                <g style={{ transform: `scale(${exportRenderData.viewport.zoom}) translate(${exportRenderData.viewport.pan.x}px, ${exportRenderData.viewport.pan.y}px)`, transformOrigin: 'top left' }}>
                                    {cables.map(cable => {
                                        const pointsStr = cable.points
                                            .map(p => moduleCenterCoords.get(`${p.panelId}-${p.moduleIndex}`))
                                            .filter(Boolean)
                                            .map(coord => `${coord!.x},${coord!.y}`)
                                            .join(' ');
                                        if (pointsStr.split(' ').length < 2) return null;
                                        return (
                                            <polyline
                                                key={cable.id}
                                                points={pointsStr}
                                                fill="none"
                                                stroke="#3b82f6"
                                                strokeWidth={3 / (exportRenderData?.viewport.zoom || 1)}
                                                markerEnd="url(#arrowhead-export-fix)"
                                                strokeLinejoin='round'
                                                strokeLinecap='round'
                                            />
                                        );
                                    })}
                                </g>
                            </svg>
                         )}
                      </div>
                  </div>
                )}
                
                {exportRenderData.view === 'layout' && (
                  <div className="mt-8 bg-white p-8 rounded-xl border border-brand-gray shadow-sm">
                      <h3 className="text-2xl font-bold text-brand-gray-text mb-6 flex items-center space-x-3">
                          <BookOpenIcon className="w-7 h-7 text-brand-purple"/>
                          <span>Manual de Conteúdo</span>
                      </h3>
                      <pre className="w-full p-4 bg-brand-gray-light rounded-lg border border-brand-gray font-mono text-sm whitespace-pre-wrap">
                          {content}
                      </pre>
                  </div>
                )}
            </div>
          )}
        </div>

        {panels.length > 0 && (
          <div className="bg-white p-6 rounded-xl border border-brand-gray shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <SummaryCard icon={<GridIcon className="w-6 h-6 text-brand-purple" />} title="Total de Placas" value={summaryData.modules.toLocaleString('pt-BR')} unit="unidades" />
                  <SummaryCard icon={<WeightIcon className="w-6 h-6 text-brand-purple" />} title="Peso Total" value={summaryData.weight.toLocaleString('pt-BR', {minimumFractionDigits: 1})} unit="kg" />
                  <SummaryCard icon={<PowerIcon className="w-6 h-6 text-brand-purple" />} title="Consumo de Energia" value={summaryData.kva.toLocaleString('pt-BR', {minimumFractionDigits: 2})} unit="kVA" />
                  <SummaryCard icon={<ResolutionIcon className="w-6 h-6 text-brand-purple" />} title={summaryData.resolutionTitle} value={summaryData.resolution} unit="px" />
              </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl border border-brand-gray shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-xl font-bold text-brand-gray-text">Disposição dos Painéis</h3>
                <div className="flex items-center border border-brand-gray rounded-lg p-0.5 bg-brand-gray-light">
                  <button onClick={() => setViewMode('layout')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors flex items-center space-x-2 ${viewMode === 'layout' ? 'bg-white text-brand-purple shadow-sm' : 'text-gray-600 hover:bg-brand-gray'}`}>
                    <GridIcon className="w-4 h-4" /><span>Layout</span>
                  </button>
                  <button onClick={() => setViewMode('cabling')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors flex items-center space-x-2 ${viewMode === 'cabling' ? 'bg-white text-brand-purple shadow-sm' : 'text-gray-600 hover:bg-brand-gray'}`}>
                    <CableIcon className="w-4 h-4" /><span>Cabeamento</span>
                  </button>
                  <button onClick={() => setViewMode('output')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors flex items-center space-x-2 ${viewMode === 'output' ? 'bg-white text-brand-purple shadow-sm' : 'text-gray-600 hover:bg-brand-gray'}`}>
                    <MonitorIcon className="w-4 h-4" /><span>Output</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                 {viewMode === 'layout' && (
                    <button onClick={toggleEditMode} className={`p-2 rounded-md ${isEditMode ? 'bg-brand-purple-light text-brand-purple ring-2 ring-brand-purple' : 'hover:bg-brand-gray'}`} title="Modo Edição">
                        <EditIcon className="w-5 h-5"/>
                    </button>
                 )}
                 {viewMode === 'layout' && isEditMode && (
                    <>
                    <button onClick={() => setIsEraseMode(!isEraseMode)} className={`p-2 rounded-md ${isEraseMode ? 'bg-red-200 text-red-700 ring-2 ring-red-500' : 'hover:bg-brand-gray'}`} title="Modo Borracha">
                        <EraserIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={handleResetLayout} className="p-2 rounded-md hover:bg-brand-gray" title="Resetar Layout">
                        <RefreshIcon className="w-5 h-5 text-red-500"/>
                    </button>
                    </>
                 )}
                 {viewMode === 'cabling' && (
                  <>
                    <button onClick={toggleDrawingMode} disabled={isDeleteCableMode} className={`p-2 rounded-md ${drawingState.active ? 'bg-blue-200 text-blue-700 ring-2 ring-blue-500' : 'hover:bg-brand-gray disabled:opacity-50'}`} title="Adicionar Cabo (Clique para adicionar pontos, clique duplo para finalizar)">
                        <PlusIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={toggleDeleteCableMode} className={`p-2 rounded-md ${isDeleteCableMode ? 'bg-red-200 text-red-700 ring-2 ring-red-500' : 'hover:bg-brand-gray'}`} title="Modo Excluir Cabo">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                  </>
                 )}
                 <div className="h-6 w-px bg-brand-gray"></div>
                 <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-2 rounded-md hover:bg-brand-gray"><ZoomOutIcon className="w-5 h-5"/></button>
                 <button onClick={centerAndFit} className="p-2 rounded-md hover:bg-brand-gray"><RefreshIcon className="w-5 h-5"/></button>
                 <button onClick={() => setZoom(z => z + 0.1)} className="p-2 rounded-md hover:bg-brand-gray"><ZoomInIcon className="w-5 h-5"/></button>
                 <span className="text-sm text-brand-gray-dark font-mono bg-brand-gray-light px-2 py-1 rounded-md">{(zoom * 100).toFixed(0)}%</span>
              </div>
            </div>
            {viewMode === 'cabling' && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-brand-gray space-y-3">
                    <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold text-brand-gray-text">Assistente de Auto Cabeamento</h4>
                        <button
                            onClick={() => setSelectedPanelsForCabling([])}
                            className="text-sm text-brand-purple hover:underline disabled:text-gray-400 disabled:no-underline"
                            disabled={selectedPanelsForCabling.length === 0}
                        >
                            Limpar Seleção
                        </button>
                    </div>
                    <p className="text-sm text-brand-gray-dark -mt-2">Selecione um ou mais painéis no visualizador para começar.</p>
                    
                    {!isAutoCablingValid && selectedPanelsForCabling.length > 0 && (
                        <p className="text-sm text-red-600">Erro: Os painéis selecionados devem ter módulos do mesmo tamanho.</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                        <div>
                            <label htmlFor="cabling-limit" className="block text-sm font-medium text-brand-gray-dark mb-1">Limite de Módulos</label>
                            <input
                                type="number"
                                id="cabling-limit"
                                value={autoCablingSettings.limit}
                                onChange={(e) => setAutoCablingSettings(s => ({ ...s, limit: parseInt(e.target.value, 10) || 1 }))}
                                className="w-full px-3 py-2 bg-white border border-brand-gray rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-gray-dark mb-1">Padrão de Cabeamento</label>
                            <CustomSelect
                                options={[
                                    { value: 'snake-vertical-up-down', label: 'Serpente Vertical (Sobe > Desce)' },
                                    { value: 'snake-vertical-down-up', label: 'Serpente Vertical (Desce > Sobe)' },
                                    { value: 'snake-horizontal-right-left-up', label: 'Serpente Horizontal (Sobe)' },
                                    { value: 'snake-horizontal-right-left-down', label: 'Serpente Horizontal (Desce)' },
                                ]}
                                value={autoCablingSettings.pattern}
                                onChange={(val) => setAutoCablingSettings(s => ({ ...s, pattern: val as CablingPattern }))}
                            />
                        </div>
                        <button
                            onClick={handleGenerateAutoCables}
                            disabled={!isAutoCablingValid}
                            className="w-full lg:w-auto justify-center flex items-center space-x-2 bg-brand-purple text-white px-5 py-2 rounded-lg hover:bg-brand-purple-dark transition-colors shadow-sm disabled:bg-brand-gray-dark disabled:cursor-not-allowed"
                        >
                            <span>Gerar Cabos</span>
                        </button>
                    </div>
                </div>
            )}
            {viewMode === 'output' && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-brand-gray space-y-3">
                <h4 className="text-lg font-semibold text-brand-gray-text">Configuração do Output de Vídeo</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="output-width" className="block text-sm font-medium text-brand-gray-dark mb-1">Largura (px)</label>
                        <input type="number" id="output-width" value={outputResolution.width} onChange={e => setOutputResolution(r => ({...r, width: parseInt(e.target.value) || 0}))} className="w-full px-3 py-2 bg-white border border-brand-gray rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" />
                    </div>
                    <div>
                        <label htmlFor="output-height" className="block text-sm font-medium text-brand-gray-dark mb-1">Altura (px)</label>
                        <input type="number" id="output-height" value={outputResolution.height} onChange={e => setOutputResolution(r => ({...r, height: parseInt(e.target.value) || 0}))} className="w-full px-3 py-2 bg-white border border-brand-gray rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-purple" />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                        <button onClick={() => setOutputResolution({width: 1280, height: 720})} className="text-xs font-semibold px-3 py-1 bg-brand-gray rounded-full hover:bg-brand-gray-dark hover:text-white transition-colors">HD</button>
                        <button onClick={() => setOutputResolution({width: 1920, height: 1080})} className="text-xs font-semibold px-3 py-1 bg-brand-gray rounded-full hover:bg-brand-gray-dark hover:text-white transition-colors">Full HD</button>
                        <button onClick={() => setOutputResolution({width: 3840, height: 2160})} className="text-xs font-semibold px-3 py-1 bg-brand-gray rounded-full hover:bg-brand-gray-dark hover:text-white transition-colors">4K</button>
                    </div>
                 </div>
              </div>
            )}
            <div className={`flex ${viewMode === 'output' ? 'flex-row' : ''}`}>
                 {viewMode === 'output' && (
                    <div className="w-64 flex-shrink-0 bg-white border border-brand-gray rounded-lg p-3 mr-4">
                        <h4 className="font-semibold text-brand-gray-text mb-2 px-1">Painéis no Output</h4>
                        <div className="space-y-1 max-h-[450px] overflow-y-auto">
                           {panels.map((panel, index) => {
                               const isSelected = panel.id === selectedOutputPanelId;
                               const isDropTarget = sidebarDropTargetId === panel.id && sidebarDropTargetId !== draggingSidebarPanelId;
                               const isDragging = draggingSidebarPanelId === panel.id;
                               return (
                                   <div key={panel.id}
                                       draggable
                                       onDragStart={(e) => {
                                           e.dataTransfer.effectAllowed = 'move';
                                           setDraggingSidebarPanelId(panel.id);
                                       }}
                                       onDragOver={(e) => {
                                           e.preventDefault();
                                           if (panel.id !== draggingSidebarPanelId) {
                                               setSidebarDropTargetId(panel.id);
                                           }
                                       }}
                                       onDragLeave={() => {
                                           if(sidebarDropTargetId === panel.id) setSidebarDropTargetId(null);
                                       }}
                                       onDrop={(e) => {
                                           e.preventDefault();
                                           handleSidebarDrop(panel.id);
                                       }}
                                       onDragEnd={() => {
                                           setDraggingSidebarPanelId(null);
                                           setSidebarDropTargetId(null);
                                       }}
                                       onClick={() => setSelectedOutputPanelId(panel.id)}
                                       className={`p-2 rounded-md cursor-pointer transition-all duration-150 relative ${
                                           isDropTarget ? 'border-t-2 border-brand-purple' : ''
                                       } ${
                                           isDragging ? 'opacity-50 bg-brand-gray-light' : ''
                                       } ${
                                           isSelected ? 'bg-brand-purple-light' : 'hover:bg-gray-100'
                                       }`}
                                   >
                                       <p className={`font-medium text-sm truncate ${isSelected ? 'text-brand-purple-dark' : 'text-brand-gray-text'}`}>
                                          <span className="font-bold w-6 inline-block">{index + 1}.</span> {panel.name}
                                       </p>
                                       <div className="flex items-center justify-between mt-2 pl-6">
                                           <span className="text-xs text-brand-gray-dark">Rot: {panel.outputRotation || 0}°</span>
                                           <div className="flex items-center space-x-1">
                                               <button onClick={(e) => { e.stopPropagation(); handleRotateOutputPanel(panel.id, 'ccw'); }} className="p-1 rounded hover:bg-gray-200 text-gray-600">
                                                  <RotateCcwIcon className="w-4 h-4" />
                                               </button>
                                               <button onClick={(e) => { e.stopPropagation(); handleRotateOutputPanel(panel.id, 'cw'); }} className="p-1 rounded hover:bg-gray-200 text-gray-600">
                                                   <RotateCwIcon className="w-4 h-4" />
                                               </button>
                                           </div>
                                       </div>
                                   </div>
                               );
                           })}
                        </div>
                    </div>
                 )}
                <div 
                    ref={displayAreaRef} 
                    className={`h-[500px] rounded-lg overflow-hidden border border-brand-gray relative flex-1 
                        ${!isEditMode && !drawingState.active && viewMode !== 'output' ? 'cursor-grab active:cursor-grabbing' : ''} 
                        ${viewMode === 'output' && !draggingOutputPanel ? 'cursor-grab active:cursor-grabbing' : ''}
                        ${drawingState.active || isDeleteCableMode ? 'cursor-crosshair' : ''}
                        ${viewMode === 'output' ? 'bg-gray-800' : 'bg-slate-100'}
                    `}
                    onMouseDown={handleDisplayMouseDown}
                    onMouseMove={handleDisplayMouseMove}
                    onMouseUp={handleDisplayMouseUp}
                    onMouseLeave={handleDisplayMouseUp}
                    onClick={handleDisplayClick}
                >
                    <div 
                        className="pan-zoom-content absolute top-0 left-0"
                        style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, transformOrigin: 'top left', willChange: 'transform' }}>
                      
                      {(viewMode === 'layout' || viewMode === 'cabling') && renderPanelsForDisplay(false)}

                      {viewMode === 'output' && (
                        <div className="relative bg-gray-900 border border-gray-700 shadow-inner" style={{ width: outputResolution.width, height: outputResolution.height }}>
                            {panels.map((panel, index) => {
                                const metrics = panelMetrics.metricsMap.get(panel.id);
                                const pos = panel.outputPosition || { x: 0, y: 0 };
                                if (!metrics) return null;

                                return <OutputPanel
                                    key={panel.id}
                                    panel={panel}
                                    metrics={metrics}
                                    isSelected={selectedOutputPanelId === panel.id}
                                    style={{
                                        width: metrics.totalPxWidth,
                                        height: metrics.totalPxHeight,
                                        transform: `translate(${pos.x}px, ${pos.y}px)`,
                                        transformOrigin: 'top left',
                                    }}
                                    onPanelDragStart={handleOutputPanelDragStart}
                                    panelNumber={index + 1}
                                />
                            })}
                        </div>
                      )}
                    </div>
                      
                    {viewMode === 'cabling' && (
                      <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none z-20">
                          <defs>
                              <marker id="arrowhead" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                              </marker>
                          </defs>
                          <g style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, transformOrigin: 'top left' }}>
                           {cables.map(cable => {
                              const pointsStr = cable.points
                                .map(p => moduleCenterCoords.get(`${p.panelId}-${p.moduleIndex}`))
                                .filter(Boolean)
                                .map(coord => `${coord!.x},${coord!.y}`)
                                .join(' ');

                              if (pointsStr.split(' ').length < 2) return null;

                              const isSelected = cable.id === selectedCableId;
                              return (
                                <g key={cable.id} className="pointer-events-auto">
                                  <polyline
                                    points={pointsStr}
                                    fill="none"
                                    stroke="transparent"
                                    strokeWidth={15 / zoom}
                                    strokeLinejoin='round'
                                    strokeLinecap='round'
                                    className={isDeleteCableMode ? 'cursor-crosshair' : 'cursor-pointer'}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isDeleteCableMode) {
                                            setCables(prev => prev.filter(c => c.id !== cable.id));
                                            if (selectedCableId === cable.id) setSelectedCableId(null);
                                        } else {
                                            setSelectedCableId(cable.id);
                                            setDrawingState({ active: false, points: [] });
                                            setSelectedPanelsForCabling([]);
                                        }
                                    }}
                                  />
                                  <polyline
                                      points={pointsStr}
                                      fill="none"
                                      stroke={isSelected ? '#f59e0b' : '#3b82f6'}
                                      strokeWidth={3 / zoom} 
                                      markerEnd="url(#arrowhead)"
                                      strokeLinejoin='round'
                                      strokeLinecap='round'
                                      className="pointer-events-none"
                                  />
                                </g>
                              )
                           })}
                           {drawingState.active && drawingState.points.length > 0 && (
                               <polyline
                                   points={[
                                     ...drawingState.points.map(p => moduleCenterCoords.get(`${p.panelId}-${p.moduleIndex}`)).filter(Boolean).map(c => `${c!.x},${c!.y}`),
                                     ...(snapPoint ? [`${snapPoint.x},${snapPoint.y}`] : [])
                                   ].join(' ')}
                                   fill="none"
                                   stroke="#60a5fa"
                                   strokeWidth={2 / zoom}
                                   strokeDasharray={`${6 / zoom} ${3 / zoom}`}
                                   markerEnd="url(#arrowhead)"
                                   strokeLinejoin='round'
                                   strokeLinecap='round'
                                   className="pointer-events-none"
                               />
                           )}
                          </g>
                      </svg>
                    )}
                    {viewMode === 'cabling' && drawingState.active && snapPoint && (
                      <div 
                        className="absolute rounded-full border-2 border-blue-500 bg-blue-500/30 w-4 h-4 -translate-x-2 -translate-y-2 pointer-events-none z-30"
                        style={{ 
                          transform: `scale(${zoom}) translate(${pan.x + snapPoint.x}px, ${pan.y + snapPoint.y}px)`,
                          transformOrigin: 'top left',
                        }}
                      />
                    )}
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-brand-gray shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-brand-gray-text flex items-center space-x-2">
                    <BookOpenIcon className="w-6 h-6 text-brand-purple"/>
                    <span>Manual de Conteúdo</span>
                </h3>
                <button
                    onClick={() => setIsContentEditable(!isContentEditable)}
                    className="flex items-center space-x-2 bg-white text-brand-purple-dark font-semibold py-2 px-4 border border-brand-purple rounded-lg hover:bg-brand-purple-light transition-colors"
                >
                    <EditIcon className="w-5 h-5"/>
                    <span>{isContentEditable ? 'Salvar' : 'Editar'}</span>
                </button>
            </div>
            <textarea
                className={`w-full h-64 p-4 rounded-lg border font-mono text-sm transition-colors duration-200 focus:outline-none ${isContentEditable ? 'bg-white border-brand-purple ring-2 ring-brand-purple' : 'bg-brand-gray-light border-brand-gray read-only:cursor-default'}`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                readOnly={!isContentEditable}
            />
        </div>

      </main>
    </div>
  );
};

export default App;
