import React from 'react';
import { ThemeType } from '../types';
import { Palette, Check } from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: ThemeType;
  onSelectTheme: (theme: ThemeType) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
}) => {
  const themesList: Array<{ id: ThemeType; label: string; swatch: string; textColor: string }> = [
    {
      id: 'black',
      label: 'Black',
      swatch: 'bg-black',
      textColor: 'text-white',
    },
    {
      id: 'green',
      label: 'Green',
      swatch: 'bg-[#15803d]',
      textColor: 'text-white',
    },
    {
      id: 'pink',
      label: 'Pink/Rose',
      swatch: 'bg-[#be185d]',
      textColor: 'text-white',
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-1 text-xs font-black uppercase tracking-wider text-black mr-1">
        <Palette className="w-3.5 h-3.5 stroke-[3]" />
        <span>Theme:</span>
      </div>

      <div className="flex items-center gap-1.5">
        {themesList.map((t) => {
          const isActive = currentTheme === t.id;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTheme(t.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black uppercase border-2 border-black transition-all cursor-pointer ${
                isActive
                  ? `${t.swatch} ${t.textColor} shadow-none translate-x-[1px] translate-y-[1px]`
                  : 'bg-white text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              <span className={`w-3 h-3 border border-black ${t.swatch}`} />
              <span>{t.label}</span>
              {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
