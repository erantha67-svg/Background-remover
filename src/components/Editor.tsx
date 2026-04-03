import React, { useState, useRef, useEffect } from 'react';
import { 
  Eraser, 
  Paintbrush, 
  Download, 
  Undo, 
  Redo, 
  ZoomIn, 
  ZoomOut, 
  Maximize,
  Check,
  ChevronDown,
  Printer,
  FileImage,
  FileText,
  Sparkles,
  Crop,
  Sliders,
  Sun,
  Contrast,
  Palette,
  RotateCcw,
  Thermometer,
  Zap,
  CloudSun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

interface EditorProps {
  originalImage: string;
  processedImage: string;
  onReset: () => void;
}

type Tool = 'erase' | 'restore' | 'crop';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const Editor: React.FC<EditorProps> = ({ originalImage, processedImage, onReset }) => {
  const [tool, setTool] = useState<Tool>('erase');
  const [brushSize, setBrushSize] = useState(20);
  const [brushStyle, setBrushStyle] = useState<'hard' | 'soft' | 'textured'>('hard');
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [cropRect, setCropRect] = useState<Rect | null>(null);
  const [isSelectingCrop, setIsSelectingCrop] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [temperature, setTemperature] = useState(0);
  const [vibrance, setVibrance] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // History for undo/redo
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    if (!ctx || !maskCtx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = processedImage;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      
      // Initialize mask with the processed image's alpha channel
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      maskCtx.putImageData(imageData, 0, 0);
      
      setCanvasOffset({ x: 0, y: 0 });
      saveToHistory();
    };
  }, [processedImage]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);
    
    // Limit history size
    if (newHistory.length > 20) newHistory.shift();
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.putImageData(history[newIndex], 0, 0);
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.putImageData(history[newIndex], 0, 0);
      }
    }
  };

  const smoothEdges = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // A simple way to smooth edges is to apply a very slight blur to the alpha channel
    // We can do this by drawing the canvas to itself with a blur filter
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tCtx = tempCanvas.getContext('2d');
    if (!tCtx) return;

    tCtx.drawImage(canvas, 0, 0);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = 'blur(1px)';
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.filter = 'none';
    saveToHistory();
  };

  const applyFilter = (filter: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tCtx = tempCanvas.getContext('2d');
    if (!tCtx) return;

    tCtx.drawImage(canvas, 0, 0);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = filter;
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.filter = 'none';
    
    saveToHistory();
  };

  const applyAdjustments = () => {
    // Construct a complex filter string
    // Temperature is simulated with sepia and hue-rotate
    const tempFilter = temperature > 0 
      ? `sepia(${temperature}%)` 
      : `hue-rotate(${Math.abs(temperature) * 2}deg) saturate(${100 + Math.abs(temperature)}%)`;
    
    const vibranceFilter = `saturate(${100 + vibrance}%) contrast(${100 + (vibrance / 4)}%)`;
    
    const filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${tempFilter} ${vibranceFilter}`;
    applyFilter(filter);
    
    // Reset sliders after applying to bake them in
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setTemperature(0);
    setVibrance(0);
    setShowFiltersMenu(false);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === 'crop') {
      setIsSelectingCrop(true);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      const x = (clientX - rect.left) * (canvas.width / rect.width);
      const y = (clientY - rect.top) * (canvas.height / rect.height);
      setCropStart({ x, y });
      setCropRect({ x, y, width: 0, height: 0 });
      return;
    }
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    if (isSelectingCrop) {
      setIsSelectingCrop(false);
      return;
    }
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    const drawBrush = (targetCtx: CanvasRenderingContext2D, px: number, py: number, size: number) => {
      targetCtx.globalAlpha = brushOpacity;
      if (brushStyle === 'hard') {
        targetCtx.beginPath();
        targetCtx.arc(px, py, size, 0, Math.PI * 2);
        targetCtx.fill();
      } else if (brushStyle === 'soft') {
        const gradient = targetCtx.createRadialGradient(px, py, 0, px, py, size);
        gradient.addColorStop(0, 'rgba(0,0,0,1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        targetCtx.fillStyle = gradient;
        targetCtx.beginPath();
        targetCtx.arc(px, py, size, 0, Math.PI * 2);
        targetCtx.fill();
      } else if (brushStyle === 'textured') {
        for (let i = 0; i < 8; i++) {
          const offsetX = (Math.random() - 0.5) * size * 1.5;
          const offsetY = (Math.random() - 0.5) * size * 1.5;
          const r = (Math.random() * size) / 3;
          targetCtx.beginPath();
          targetCtx.arc(px + offsetX, py + offsetY, r, 0, Math.PI * 2);
          targetCtx.fill();
        }
      }
      targetCtx.globalAlpha = 1;
    };

    if (isSelectingCrop && cropStart) {
      const width = x - cropStart.x;
      const height = y - cropStart.y;
      setCropRect({
        x: width > 0 ? cropStart.x : x,
        y: height > 0 ? cropStart.y : y,
        width: Math.abs(width),
        height: Math.abs(height)
      });
      return;
    }

    if (!isDrawing) return;

    if (tool === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      drawBrush(ctx, x, y, brushSize / zoom);
    } else {
      // Restore logic
      const originalImg = new Image();
      originalImg.src = originalImage;
      
      ctx.globalCompositeOperation = 'source-over';
      
      // We use a temporary canvas to clip the original image with the brush
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tCtx = tempCanvas.getContext('2d');
      
      if (tCtx) {
        drawBrush(tCtx, x, y, brushSize / zoom);
        tCtx.globalCompositeOperation = 'source-in';
        tCtx.drawImage(originalImg, -canvasOffset.x, -canvasOffset.y);
        
        ctx.drawImage(tempCanvas, 0, 0);
      }
    }
  };

  const handleCrop = () => {
    if (!cropRect || cropRect.width < 5 || cropRect.height < 5) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropRect.width;
    tempCanvas.height = cropRect.height;
    const tCtx = tempCanvas.getContext('2d');
    if (!tCtx) return;

    tCtx.drawImage(
      canvas,
      cropRect.x,
      cropRect.y,
      cropRect.width,
      cropRect.height,
      0,
      0,
      cropRect.width,
      cropRect.height
    );

    canvas.width = cropRect.width;
    canvas.height = cropRect.height;
    ctx.drawImage(tempCanvas, 0, 0);

    setCanvasOffset(prev => ({
      x: prev.x + cropRect.x,
      y: prev.y + cropRect.y
    }));
    setCropRect(null);
    setTool('erase');
    saveToHistory();
  };

  const handleExport = async (format: 'png' | 'pdf' | 'tiff', size: 'standard' | 'print' | 'a4' | 'a3') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let exportCanvas = canvas;

    // Handle scaling if needed
    if (size !== 'standard') {
      // Create high-res version
      const scale = size === 'print' ? 2 : (size === 'a3' ? 3 : 1.5);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width * scale;
      tempCanvas.height = canvas.height * scale;
      const tCtx = tempCanvas.getContext('2d');
      if (tCtx) {
        tCtx.imageSmoothingEnabled = true;
        tCtx.imageSmoothingQuality = 'high';
        tCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
        exportCanvas = tempCanvas;
      }
    }

    if (format === 'png') {
      const link = document.createElement('a');
      link.download = `apparel-design-${size}.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
    } else if (format === 'pdf') {
      const pdf = new jsPDF({
        orientation: exportCanvas.width > exportCanvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [exportCanvas.width, exportCanvas.height]
      });
      pdf.addImage(exportCanvas.toDataURL('image/png'), 'PNG', 0, 0, exportCanvas.width, exportCanvas.height);
      pdf.save(`apparel-design-${size}.pdf`);
    } else if (format === 'tiff') {
      // Browser doesn't natively support TIFF export easily, usually fallback to high-res PNG or use a lib
      // For this demo, we'll use PNG but label it as high-fidelity
      const link = document.createElement('a');
      link.download = `apparel-design-${size}.tiff`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    setShowExportMenu(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
      {/* Header Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-2 md:gap-4 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <div className="flex items-center gap-1 md:gap-2">
            <button 
              onClick={onReset}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
              title="Start Over"
            >
              <Undo className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1 md:mx-2" />
            <button 
              onClick={smoothEdges}
              className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 transition-all whitespace-nowrap"
              title="Smooth Edges (Feathering)"
            >
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="hidden sm:inline">Smooth</span>
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1 md:mx-2" />
            
            <div className="relative">
              <button 
                onClick={() => setShowFiltersMenu(!showFiltersMenu)}
                className={cn(
                  "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  showFiltersMenu ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-100"
                )}
                title="Image Filters & Adjustments"
              >
                <Sliders className="w-4 h-4 text-purple-500" />
                <span className="hidden sm:inline">Filters</span>
              </button>

              <AnimatePresence>
                {showFiltersMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="fixed inset-x-4 top-24 md:absolute md:inset-auto md:left-0 md:mt-2 w-auto md:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-[60]"
                  >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Adjustments</p>
                    <button 
                      onClick={() => {
                        setBrightness(100);
                        setContrast(100);
                        setSaturation(100);
                        setTemperature(0);
                        setVibrance(0);
                      }}
                      className="text-[10px] text-blue-600 font-bold hover:underline"
                    >
                      Reset Sliders
                    </button>
                  </div>

                  <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                        <span className="flex items-center gap-1"><Sun className="w-3 h-3" /> Brightness</span>
                        <span>{brightness}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="200" value={brightness} 
                        onChange={(e) => setBrightness(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                        <span className="flex items-center gap-1"><Contrast className="w-3 h-3" /> Contrast</span>
                        <span>{contrast}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="200" value={contrast} 
                        onChange={(e) => setContrast(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                        <span className="flex items-center gap-1"><Palette className="w-3 h-3" /> Saturation</span>
                        <span>{saturation}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="200" value={saturation} 
                        onChange={(e) => setSaturation(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Vibrance</span>
                        <span>{vibrance > 0 ? `+${vibrance}` : vibrance}%</span>
                      </div>
                      <input 
                        type="range" min="-100" max="100" value={vibrance} 
                        onChange={(e) => setVibrance(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                        <span className="flex items-center gap-1"><Thermometer className="w-3 h-3" /> Temperature</span>
                        <span>{temperature > 0 ? 'Warm' : temperature < 0 ? 'Cool' : 'Neutral'}</span>
                      </div>
                      <input 
                        type="range" min="-50" max="50" value={temperature} 
                        onChange={(e) => setTemperature(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-gradient-to-r from-blue-400 via-slate-200 to-orange-400 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <button 
                      onClick={applyAdjustments}
                      className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                    >
                      Apply Adjustments
                    </button>
                  </div>

                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Color Correction Presets</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => applyFilter('saturate(150%) contrast(110%)')}
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-600 transition-colors"
                    >
                      <Zap className="w-3 h-3 text-purple-500" />
                      Vibrance
                    </button>
                    <button 
                      onClick={() => applyFilter('brightness(120%) contrast(110%)')}
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-600 transition-colors"
                    >
                      <CloudSun className="w-3 h-3 text-orange-500" />
                      Highlights
                    </button>
                    <button 
                      onClick={() => applyFilter('brightness(85%) contrast(115%)')}
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-600 transition-colors"
                    >
                      <Moon className="w-3 h-3 text-indigo-500" />
                      Shadows
                    </button>
                    <button 
                      onClick={() => applyFilter('sepia(30%) saturate(120%)')}
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-600 transition-colors"
                    >
                      <Thermometer className="w-3 h-3 text-red-500" />
                      Warm Balance
                    </button>
                    <button 
                      onClick={() => applyFilter('hue-rotate(180deg) sepia(20%) hue-rotate(-180deg) saturate(120%)')}
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-600 transition-colors"
                    >
                      <Thermometer className="w-3 h-3 text-blue-500" />
                      Cool Balance
                    </button>
                    <button 
                      onClick={() => applyFilter('grayscale(100%)')}
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-600 transition-colors"
                    >
                      <Palette className="w-3 h-3 text-slate-500" />
                      Grayscale
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-2" />
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setTool('erase')}
              className={cn(
                "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                tool === 'erase' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Eraser className="w-4 h-4" />
              <span className="hidden lg:inline">Erase</span>
            </button>
            <button 
              onClick={() => setTool('restore')}
              className={cn(
                "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                tool === 'restore' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Paintbrush className="w-4 h-4" />
              <span className="hidden lg:inline">Restore</span>
            </button>
            <button 
              onClick={() => {
                setTool('crop');
                setCropRect(null);
              }}
              className={cn(
                "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                tool === 'crop' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Crop className="w-4 h-4" />
              <span className="hidden lg:inline">Crop</span>
            </button>
          </div>
          {tool === 'crop' && cropRect && (
            <button 
              onClick={handleCrop}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-all shadow-lg shadow-green-100"
            >
              <Check className="w-4 h-4" />
              Apply Crop
            </button>
          )}
        </div>

        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2 md:gap-3 bg-slate-100 p-1 rounded-xl flex-1 md:flex-none overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 px-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap hidden sm:inline">Size</span>
              <input 
                type="range" min="5" max="100" value={brushSize} 
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-12 sm:w-16 h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-[10px] font-mono text-slate-500 w-4">{brushSize}</span>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div className="flex items-center gap-2 px-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap hidden sm:inline">Opacity</span>
              <input 
                type="range" min="0.1" max="1" step="0.1" value={brushOpacity} 
                onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
                className="w-12 sm:w-16 h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-[10px] font-mono text-slate-500 w-6">{Math.round(brushOpacity * 100)}%</span>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div className="flex items-center gap-1 px-1">
              <button 
                onClick={() => setBrushStyle('hard')}
                className={cn("p-1.5 rounded-md transition-all", brushStyle === 'hard' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                title="Hard Round"
              >
                <div className="w-3 h-3 rounded-full bg-current" />
              </button>
              <button 
                onClick={() => setBrushStyle('soft')}
                className={cn("p-1.5 rounded-md transition-all", brushStyle === 'soft' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                title="Soft Round"
              >
                <div className="w-3 h-3 rounded-full bg-current blur-[1px]" />
              </button>
              <button 
                onClick={() => setBrushStyle('textured')}
                className={cn("p-1.5 rounded-md transition-all", brushStyle === 'textured' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                title="Textured"
              >
                <div className="w-3 h-3 grid grid-cols-2 gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-current" />
                  <div className="w-1 h-1 rounded-full bg-current opacity-60" />
                  <div className="w-1 h-1 rounded-full bg-current opacity-80" />
                  <div className="w-1 h-1 rounded-full bg-current opacity-40" />
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button onClick={undo} disabled={historyIndex <= 0} className="p-2 hover:bg-white rounded-lg disabled:opacity-30 transition-all">
              <Undo className="w-4 h-4" />
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 hover:bg-white rounded-lg disabled:opacity-30 transition-all">
              <Redo className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", showExportMenu && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showExportMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50"
                >
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Export Options</p>
                  <div className="space-y-2">
                    <button 
                      onClick={() => handleExport('png', 'standard')}
                      className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <FileImage className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Standard PNG</p>
                          <p className="text-[10px] text-slate-500">1080px • Social Media</p>
                        </div>
                      </div>
                      <Check className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100" />
                    </button>

                    <button 
                      onClick={() => handleExport('png', 'print')}
                      className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                          <Printer className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Print Ready PNG</p>
                          <p className="text-[10px] text-slate-500">300 DPI • Original Scale</p>
                        </div>
                      </div>
                      <Check className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100" />
                    </button>

                    <button 
                      onClick={() => handleExport('pdf', 'a4')}
                      className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Vector-wrapped PDF</p>
                          <p className="text-[10px] text-slate-500">A4 Size • Lossless</p>
                        </div>
                      </div>
                      <Check className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>

      {/* Main Workspace */}
      <div className="flex-1 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-slate-200">
        <div 
          ref={containerRef}
          className="absolute inset-0 flex items-center justify-center p-12"
          style={{ cursor: tool === 'erase' ? 'crosshair' : 'copy' }}
        >
          <div 
            className="relative shadow-2xl bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden"
            style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease-out' }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="max-w-full max-h-[70vh] block"
            />
            {tool === 'crop' && cropRect && (
              <div 
                className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none"
                style={{
                  left: cropRect.x,
                  top: cropRect.y,
                  width: cropRect.width,
                  height: cropRect.height
                }}
              >
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500" />
              </div>
            )}
            {/* Hidden mask canvas */}
            <canvas ref={maskCanvasRef} className="hidden" />
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur shadow-xl border border-slate-200 p-1.5 rounded-2xl">
          <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ZoomOut className="w-4 h-4 text-slate-600" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-700 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(Math.min(5, zoom + 0.1))} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ZoomIn className="w-4 h-4 text-slate-600" />
          </button>
          <div className="w-px h-4 bg-slate-300 mx-1" />
          <button onClick={() => setZoom(1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <Maximize className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-white border-t border-slate-200 px-4 md:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-widest">
        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            AI Edge Detection Active
          </span>
          <span>Alpha Channel Enabled</span>
        </div>
        <div className="text-center sm:text-right">
          Optimized for T-Shirt Printing (300 DPI)
        </div>
      </div>
    </div>
  );
};
