
import React from 'react';

export const SpinningDNA: React.FC = () => {
  const colors = [
    { bg: 'bg-orange-500', gradient: 'from-orange-500 via-orange-500 to-orange-500' },
    { bg: 'bg-blue-500', gradient: 'from-blue-500 via-blue-500 to-blue-500' },
    { bg: 'bg-green-500', gradient: 'from-green-500 via-green-500 to-green-500' },
    { bg: 'bg-red-500', gradient: 'from-red-500 via-red-500 to-red-500' }
  ];

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="dna-container">
        <div className="dna-helix">
          {[...Array(12)].map((_, i) => {
            const style = colors[i % 4];
            return (
              <div key={i} className={`strand-custom`} style={{ animationDelay: `-${i * 0.25}s`, top: `${i * 5}px` }}>
                 <div className={`strand-line w-full h-[2px] bg-gradient-to-r ${style.gradient} opacity-50`}></div>
                 <div className={`node-left absolute left-0 w-1.5 h-1.5 rounded-full ${style.bg} -mt-[2px]`}></div>
                 <div className={`node-right absolute right-0 w-1.5 h-1.5 rounded-full ${style.bg} -mt-[2px]`}></div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 animate-pulse">Processing System Data...</p>
      
      <style>{`
        .strand-custom {
          position: absolute;
          width: 100%;
          transform-style: preserve-3d;
          animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
};
