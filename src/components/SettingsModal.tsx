import React, { useState } from 'react';
import { Settings, X, Key, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKey);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
      window.location.reload(); // Reload to apply new key
    }, 1000);
  };

  const handleReset = () => {
    localStorage.removeItem('GEMINI_API_KEY');
    setApiKey('');
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
      window.location.reload();
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Settings className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Settings</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Key className="w-3 h-3" />
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Your API key is stored locally in your browser and is never sent to our servers.
                  Get one at <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ai.google.dev</a>.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaved}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                    isSaved ? "bg-green-600 text-white" : "bg-slate-900 text-white hover:bg-slate-800"
                  )}
                >
                  {isSaved ? (
                    <>
                      <Check className="w-5 h-5" />
                      Saved Successfully
                    </>
                  ) : (
                    "Save Settings"
                  )}
                </button>

                <button
                  onClick={handleReset}
                  className="w-full py-3 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Reset to Default Key
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
