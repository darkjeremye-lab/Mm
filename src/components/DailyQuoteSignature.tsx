import React, { useState } from 'react';
import { DAILY_QUOTES, getDailyQuoteForDate } from '../data/dailyQuotes';
import { ThemeConfig } from '../types';
import { Sparkles, ChevronRight, Feather, Quote, Info, Check } from 'lucide-react';

interface DailyQuoteSignatureProps {
  theme: ThemeConfig;
  isoDate?: string;
}

export const DailyQuoteSignature: React.FC<DailyQuoteSignatureProps> = ({
  theme,
  isoDate,
}) => {
  const defaultQuote = getDailyQuoteForDate(isoDate);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState<number>(() => {
    return DAILY_QUOTES.findIndex((q) => q.id === defaultQuote.id) || 0;
  });
  const [showContext, setShowContext] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeQuote = DAILY_QUOTES[currentQuoteIndex] || defaultQuote;

  const handleNextQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentQuoteIndex((prev) => (prev + 1) % DAILY_QUOTES.length);
  };

  const handleCopyQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`"${activeQuote.text}" — ${activeQuote.author}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full relative overflow-hidden bg-transparent border-y border-[#D8CFBF]/70 dark:border-[#3D352B] py-3.5 px-4 sm:px-6 my-1 transition-all">
      {/* Decorative subtle background gradient watermark */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#FBF9F4] via-[#FDFBF7] to-[#F7F3EB] dark:from-[#1A1714] dark:via-[#1C1917] dark:to-[#171412] opacity-90 -z-10" />

      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 max-w-6xl mx-auto">
        {/* Quote & Author Signature Content */}
        <div className="flex items-start gap-3 flex-1">
          {/* Subtle antique ink feather mark */}
          <div className="mt-0.5 p-1 rounded bg-[#1C1917]/5 dark:bg-white/5 text-[#B88939] dark:text-[#E2BE7A] flex-shrink-0">
            <Feather className="w-3.5 h-3.5" />
          </div>

          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
              <p className="text-xs sm:text-sm font-serif italic text-stone-800 dark:text-stone-200 tracking-normal leading-relaxed">
                “{activeQuote.text}”
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2 text-[11px] text-stone-500 dark:text-stone-400 font-sans">
              <span className="font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                — {activeQuote.author}
              </span>
              <span className="text-stone-300 dark:text-stone-600">•</span>
              <span className="text-[10px] text-[#8A631F] dark:text-[#E2BE7A] font-medium tracking-wide uppercase">
                {activeQuote.field}
              </span>
              <span className="text-stone-300 dark:text-stone-600">•</span>
              <span className="text-[10px] font-sans text-stone-500 dark:text-stone-400">
                Daily Inspiration
              </span>

              {activeQuote.type === 'fact' && (
                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                  Daily Fact
                </span>
              )}

              {showContext && activeQuote.context && (
                <span className="w-full mt-1 text-[11px] text-stone-600 dark:text-stone-300 font-sans italic bg-amber-50/60 dark:bg-[#25201A] border-l-2 border-[#B88939] dark:border-[#D4AF37] pl-2 py-0.5 rounded-r">
                  {activeQuote.context}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quiet controls: context toggle & cycle */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 text-stone-400 dark:text-stone-400 no-print">
          {activeQuote.context && (
            <button
              type="button"
              onClick={() => setShowContext(!showContext)}
              className="text-[10px] font-sans hover:text-stone-800 dark:hover:text-stone-200 transition-colors flex items-center gap-1 cursor-pointer px-1.5 py-0.5 rounded hover:bg-stone-200/50 dark:hover:bg-stone-800"
              title="Toggle historical context"
            >
              <Info className="w-3 h-3" />
              <span>{showContext ? 'Less' : 'Context'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyQuote}
            className="text-[10px] font-sans hover:text-stone-800 dark:hover:text-stone-200 transition-colors flex items-center gap-1 cursor-pointer px-1.5 py-0.5 rounded hover:bg-stone-200/50 dark:hover:bg-stone-800"
            title="Copy quote"
          >
            {copied ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                <Check className="w-3 h-3" /> Copied
              </span>
            ) : (
              <span>Share</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleNextQuote}
            className="text-[10px] font-serif font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors flex items-center gap-0.5 cursor-pointer pl-1.5 border-l border-stone-300 dark:border-stone-700 hover:bg-stone-200/50 dark:hover:bg-stone-800 px-1 py-0.5 rounded"
            title="Next inspiration"
          >
            <span>Next</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
