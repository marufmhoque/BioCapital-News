
import React, { useState, useCallback } from 'react';
import { SemanticProfile } from '../types';
import { analyzeProfile } from '../services/geminiService';
import { SpinningDNA } from './SpinningDNA';

interface Props {
  onProfileGenerated: (profile: SemanticProfile) => void;
  existingProfile?: SemanticProfile;
}

export const ProfileAnalysis: React.FC<Props> = ({ onProfileGenerated, existingProfile }) => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showAllKeywords, setShowAllKeywords] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalysis = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const profile = await analyzeProfile(files);
      onProfileGenerated(profile);
      setFiles([]);
    } catch (e) {
      console.error(e);
      alert("Multimodal Analysis failed. Ensure API Key supports 2.5/3 models.");
    } finally {
      setLoading(false);
    }
  };

  const adjustScore = (index: number, delta: number) => {
    if (!existingProfile) return;
    const updatedKeywords = [...existingProfile.rankedKeywords];
    updatedKeywords[index] = {
      ...updatedKeywords[index],
      userAdjustment: (updatedKeywords[index].userAdjustment || 0) + delta,
    };
    const updatedProfile = { ...existingProfile, rankedKeywords: updatedKeywords };
    onProfileGenerated(updatedProfile);
  };

  if (loading) return <SpinningDNA />;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <h2 className="text-xl font-bold mb-4 font-sans text-slate-800 dark:text-white">Profile & Document Analysis</h2>
      
      {!existingProfile ? (
        <div className="space-y-4">
          <div 
            className={`p-8 border-2 border-dashed rounded-xl text-center transition-colors ${dragActive ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input type="file" id="batch-upload" className="hidden" multiple onChange={handleChange} accept=".pdf,.doc,.docx,.txt,.jpg,.png" />
            <label htmlFor="batch-upload" className="cursor-pointer">
              <div className="text-3xl mb-2">📂</div>
              <div className="text-sm font-semibold text-sky-600 dark:text-sky-400">Batch Upload / Drag & Drop</div>
              <p className="text-xs text-slate-500 mt-1">PDF, DOCX, TXT, Images supported</p>
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
              {files.map((file, i) => (
                <div key={i} className="flex justify-between items-center text-xs p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                  <span className="truncate max-w-[200px]">{file.name}</span>
                  <button onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700 font-bold">×</button>
                </div>
              ))}
            </div>
          )}
          
          <button 
            onClick={handleAnalysis}
            disabled={files.length === 0}
            className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition-all ${files.length > 0 ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}`}
          >
            Run Multimodal Analysis
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in">
          <div>
            <div className="flex justify-between items-center mb-3">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Skill Calibration</h3>
               <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500">Manual Override Active</span>
            </div>
            
            <div className="space-y-3 transition-all">
              {(showAllKeywords ? existingProfile.rankedKeywords : existingProfile.rankedKeywords.slice(0, 5)).map((k, i) => {
                const finalScore = Math.min(100, Math.max(0, k.baseScore + (k.userAdjustment || 0)));
                return (
                  <div key={i} className="relative bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between text-sm mb-1 items-center">
                      <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                        {k.keyword} 
                        {k.multiplierApplied && <span className="text-[9px] bg-amber-100 text-amber-600 px-1 rounded">★ 1.5x</span>}
                        {k.visualBoostApplied && <span className="text-[9px] bg-sky-100 text-sky-600 px-1 rounded">👁 Vis</span>}
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => adjustScore(i, -5)} className="w-5 h-5 flex items-center justify-center rounded bg-slate-200 dark:bg-slate-700 hover:bg-red-100 text-slate-600 text-xs font-bold transition-colors">-</button>
                        <span className={`font-mono w-6 text-center text-xs ${k.userAdjustment !== 0 ? 'text-sky-500 font-bold' : 'text-slate-500'}`}>{finalScore}</span>
                        <button onClick={() => adjustScore(i, 5)} className="w-5 h-5 flex items-center justify-center rounded bg-slate-200 dark:bg-slate-700 hover:bg-emerald-100 text-slate-600 text-xs font-bold transition-colors">+</button>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${k.multiplierApplied ? 'bg-amber-500' : k.visualBoostApplied ? 'bg-sky-500' : 'bg-indigo-500'}`} 
                        style={{ width: `${finalScore}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => setShowAllKeywords(!showAllKeywords)}
              className="w-full py-2 mt-2 text-xs font-bold text-slate-500 hover:text-sky-500 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
            >
              {showAllKeywords ? 'Hide Keywords' : `Show All ${existingProfile.rankedKeywords.length} Keywords`}
            </button>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Executive Summary</h3>
             <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">{existingProfile.summary}</p>
          </div>
          <button onClick={() => onProfileGenerated(null as any)} className="text-xs text-slate-400 underline hover:text-sky-500">Upload New Documents</button>
        </div>
      )}
    </div>
  );
};
