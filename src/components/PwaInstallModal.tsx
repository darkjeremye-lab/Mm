import React from 'react';
import {
  X,
  Smartphone,
  Download,
  Share,
  PlusSquare,
  Sparkles,
  CheckCircle2,
  WifiOff,
  Layers,
} from 'lucide-react';
import { isIosDevice } from '../utils/pwaService';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNativeInstall?: () => void;
  canNativeInstall: boolean;
  isStandalone: boolean;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  onNativeInstall,
  canNativeInstall,
  isStandalone,
}) => {
  if (!isOpen) return null;

  const isIos = isIosDevice();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl w-full max-w-lg overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.35)] text-stone-900 dark:text-stone-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Luxury Gold/Obsidian Header */}
        <div className="bg-[#1C1917] p-5 sm:p-6 text-stone-100 border-b border-[#352D24] relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-md bg-[#2A241E] text-stone-400 hover:text-white border border-[#453A2D] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B88939] via-[#D4AF37] to-[#8C6826] text-[#1C1917] font-serif font-black text-xl flex items-center justify-center border border-[#F5E6BE]/50 shadow-md">
              MW
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-[#FDFBF7] tracking-tight">
                  Install "My Week"
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                  PWA Ready
                </span>
              </div>
              <p className="text-xs font-sans text-stone-300">
                100% Offline Access • Fullscreen Standalone App
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 flex flex-col gap-5">
          {/* Key Advantages Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-lg bg-[#F8F5EE] dark:bg-[#24201C] border border-[#E5DCB] dark:border-[#3D352B] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100 block">
                  Zero-Lag Offline Mode
                </span>
                <span className="text-[11px] font-sans text-stone-600 dark:text-stone-300">
                  Tasks, habits, and notes load instantly with no internet connection.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#F8F5EE] dark:bg-[#24201C] border border-[#E5DCB] dark:border-[#3D352B] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100 block">
                  Native Fullscreen UI
                </span>
                <span className="text-[11px] font-sans text-stone-600 dark:text-stone-300">
                  No browser URL bar, instant home screen launch.
                </span>
              </div>
            </div>
          </div>

          {/* Installation Instructions based on Platform */}
          {isStandalone ? (
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-serif font-bold">App is already installed!</div>
                <div className="text-[11px] font-sans">
                  You are currently using My Week in standalone mode with full offline caching.
                </div>
              </div>
            </div>
          ) : isIos ? (
            /* iOS Safari Step-by-Step Guide */
            <div className="bg-[#FAF7F0] dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#B88939]" />
                <span className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                  How to Install on iPhone / iPad (iOS Safari)
                </span>
              </div>

              <div className="flex flex-col gap-2.5 pt-1 text-xs font-sans text-stone-700 dark:text-stone-300">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1C1917] text-[#D4AF37] font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>Tap the</span>
                    <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700">
                      <Share className="w-3.5 h-3.5" /> Share
                    </span>
                    <span>button in Safari's bottom toolbar.</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1C1917] text-[#D4AF37] font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>Scroll down and select</span>
                    <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700">
                      <PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1C1917] text-[#D4AF37] font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <span>Tap <strong>Add</strong> in the top right corner to install on your Home Screen.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Android / Desktop Chrome / Edge Native Install Button */
            <div className="flex flex-col gap-3">
              {canNativeInstall ? (
                <button
                  type="button"
                  onClick={onNativeInstall}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-[#1C1917] hover:bg-[#2A241E] text-[#D4AF37] font-serif font-bold text-sm tracking-wide rounded-lg border border-amber-900/40 shadow-md cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <Download className="w-4 h-4" />
                  <span>Install "My Week" on this Device</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-lg bg-[#FAF7F0] dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] text-xs font-sans text-stone-700 dark:text-stone-300 flex flex-col gap-1.5">
                  <span className="font-serif font-bold text-stone-900 dark:text-stone-100">
                    To install on Android or Desktop Browser:
                  </span>
                  <span>
                    Tap the <strong>three dots menu (⋮)</strong> in your browser and choose <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Footer Action */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E8DFC8] dark:border-[#2E2820]">
            <span className="text-[11px] font-sans text-stone-500 dark:text-stone-400">
              Cached via Service Worker v2
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] text-xs font-serif font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
