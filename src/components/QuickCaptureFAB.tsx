import React, { useState, useEffect } from 'react';
import { Plus, Zap, Sparkles } from 'lucide-react';
import { ThemeConfig } from '../types';

interface QuickCaptureFABProps {
  onClick: () => void;
  theme: ThemeConfig;
}

export const QuickCaptureFAB: React.FC<QuickCaptureFABProps> = ({ onClick, theme }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      id="quick-capture-fab-container"
      className="fixed bottom-18 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 pointer-events-auto"
    >
      {/* Floating Action Button */}
      <button
        id="quick-capture-fab-button"
        type="button"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Quick Capture (Press Q)"
        title="Quick Capture (Press Q)"
        className="group relative flex items-center gap-2.5 px-4 py-3 bg-[#1C1917] hover:bg-stone-800 text-[#D4AF37] border border-[#D4AF37]/50 rounded-full shadow-[0_8px_28px_rgba(28,25,23,0.35)] hover:shadow-[0_12px_36px_rgba(212,175,55,0.25)] active:scale-95 transition-all duration-200 cursor-pointer overflow-hidden"
      >
        {/* Subtle Shimmer Effect on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none transition-transform" />

        {/* Icon with subtle pulse */}
        <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] group-hover:scale-110 transition-transform">
          <Zap className="w-3.5 h-3.5 fill-[#D4AF37]/40" />
        </div>

        {/* Button Label */}
        <div className="flex items-center gap-1.5 font-serif font-bold text-xs uppercase tracking-wider text-[#F5F2EB]">
          <span>Quick Capture</span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-white/15 text-[#D4AF37] border border-white/10 shadow-2xs">
            Q
          </span>
        </div>
      </button>
    </div>
  );
};
