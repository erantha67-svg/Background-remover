import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shirt, Sparkles, Layers, MousePointer2, Download, AlertCircle } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { Editor } from './components/Editor';
import { removeBackground } from './services/gemini';
import { cn } from './lib/utils';

export default function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setOriginalImage(base64);
      setIsProcessing(true);
      setError(null);

      try {
        const result = await removeBackground(base64, file.type);
        setProcessedImage(result);
      } catch (err) {
        console.error(err);
        setError("Failed to remove background. Please try again with a clearer image.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Shirt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Apparel BG Remover</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Print-Ready AI Tool</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-blue-600 transition-colors">Templates</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#" className="hover:text-blue-600 transition-colors">API</a>
          </div>

          <button className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all">
            Sign In
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {!originalImage ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center max-w-3xl mx-auto mt-12"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-6">
                <Sparkles className="w-3 h-3" />
                Powered by Gemini AI
              </div>
              
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-6 leading-[1.1]">
                Professional Background Removal for <span className="text-blue-600">Apparel Design.</span>
              </h2>
              
              <p className="text-lg text-slate-500 mb-12 max-w-2xl">
                Upload your T-shirt designs and get high-fidelity, print-ready transparency in seconds. Optimized for fabric textures and complex edges.
              </p>

              <ImageUploader onImageSelect={handleImageSelect} className="w-full max-w-xl" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 w-full">
                <Feature 
                  icon={<Layers className="w-5 h-5" />}
                  title="Alpha Channel"
                  description="True PNG transparency for flawless printing on any fabric color."
                />
                <Feature 
                  icon={<MousePointer2 className="w-5 h-5" />}
                  title="Manual Touch-up"
                  description="Refine edges with our professional brush tools for perfect results."
                />
                <Feature 
                  icon={<Download className="w-5 h-5" />}
                  title="Print Ready"
                  description="Export in 300 DPI, TIFF, or PDF formats for professional production."
                />
              </div>
            </motion.div>
          ) : isProcessing ? (
            <motion.div 
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shirt className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mt-8 mb-2">Analyzing Apparel...</h3>
              <p className="text-slate-500">Our AI is detecting edges and removing background.</p>
              
              <div className="mt-12 flex gap-3">
                {['Segmenting', 'Feathering', 'Alpha Mapping'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <div className={cn("w-1.5 h-1.5 rounded-full", i === 0 ? "bg-blue-600" : "bg-slate-300")} />
                    {step}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Something went wrong</h3>
              <p className="text-slate-500 mb-8 max-w-md">{error}</p>
              <button 
                onClick={reset}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                Try Another Image
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-[calc(100vh-12rem)]"
            >
              <Editor 
                originalImage={originalImage} 
                processedImage={processedImage!} 
                onReset={reset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">© 2026 Apparel BG Remover. Professional grade design tools.</p>
          <div className="flex gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
        {icon}
      </div>
      <h4 className="text-lg font-bold mb-2">{title}</h4>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}
