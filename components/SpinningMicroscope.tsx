
import React from 'react';

export const SpinningMicroscope: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Base Ring */}
        <div className="absolute w-12 h-12 border-4 border-sky-200 dark:border-sky-900 rounded-full"></div>
        
        {/* Spinning Lens Element */}
        <div className="absolute w-16 h-16 animate-spin duration-[3000ms] linear">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-sky-500 rounded-full shadow-lg shadow-sky-500/50"></div>
        </div>

        {/* Static Microscope Icon (SVG) */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-sky-600 dark:text-sky-400 z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 18h8" />
          <path d="M3 22h18" />
          <path d="M14 22a7 7 0 1 0 0-14h-1" />
          <path d="M9 14h2" />
          <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
          <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
        </svg>
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400 animate-pulse">Analyzing BioCapital Data...</p>
    </div>
  );
};
