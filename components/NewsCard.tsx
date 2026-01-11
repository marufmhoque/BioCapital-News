
import React from 'react';
import { NewsItem } from '../types';

export const NewsCard: React.FC<{ item: NewsItem }> = ({ item }) => {
  const isRegulatory = item.type === 'Regulatory';
  const isPaywalled = !isRegulatory && !item.isOpenAccess;

  const getJurisdictionColor = (j?: string) => {
    switch(j) {
      case 'USA': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'EU': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'UK': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'Canada': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className={`p-5 rounded-xl border relative overflow-hidden flex flex-col h-full ${
      isRegulatory 
        ? 'border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-900/10' 
        : !isPaywalled 
          ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
    }`}>
      {/* Type Badge */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2">
          {isRegulatory ? (
            <>
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-sky-600 text-white">
                Regulatory Alert
              </span>
              {item.jurisdiction && (
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${getJurisdictionColor(item.jurisdiction)}`}>
                  {item.jurisdiction}
                </span>
              )}
            </>
          ) : (
             <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${item.topic === 'Vascular' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}>
              {item.topic}
            </span>
          )}
        </div>

        {/* Access Badge for Scientific */}
        {!isRegulatory && (
          !isPaywalled ? (
            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Open Access
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[9px] font-bold text-amber-500 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Paywalled
            </span>
          )
        )}
      </div>
      
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 leading-tight">
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-sky-500 transition-colors">
          {item.title}
        </a>
      </h3>
      
      {/* Summary - Only show if NOT paywalled */}
      {!isPaywalled ? (
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed flex-grow">
          {item.summary}
        </p>
      ) : (
        <div className="flex-grow flex items-center justify-center opacity-50 mb-4 min-h-[60px]">
           <p className="text-[10px] italic text-slate-400">Content restricted. Visit source for full details.</p>
        </div>
      )}

      {/* Paywall Explicit Label */}
      {isPaywalled && (
        <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded">
          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide text-center">
            ⚠️ Source Link Available
          </p>
        </div>
      )}

      <div className={`flex justify-between items-end pt-3 border-t border-slate-100 dark:border-slate-700/50 ${!isPaywalled ? 'mt-auto' : ''}`}>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate max-w-[150px]">{item.source}</span>
        {isRegulatory && (
           <span className="text-[10px] text-sky-500 font-bold uppercase tracking-wider">Official Guidance</span>
        )}
      </div>
    </div>
  );
};
