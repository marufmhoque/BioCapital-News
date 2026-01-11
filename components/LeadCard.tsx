
import React, { useState } from 'react';
import { Lead, SemanticProfile } from '../types';
import { generateOutreach } from '../services/geminiService';
import { db } from '../services/db';

interface Props {
  lead: Lead;
  profile: SemanticProfile;
  onUpdate: () => void;
}

export const LeadCard: React.FC<Props> = ({ lead, profile, onUpdate }) => {
  const [drafting, setDrafting] = useState(false);
  const [activeDraft, setActiveDraft] = useState<'email' | 'linkedin'>('email');

  const handleGenerateDraft = async () => {
    setDrafting(true);
    const drafts = await generateOutreach(lead, profile);
    await db.leads.update(lead.id, { 
      outreachEmail: drafts.email, 
      outreachLinkedIn: drafts.linkedin, 
      status: 'Contacted' 
    });
    setDrafting(false);
    onUpdate();
  };

  const handleStatusChange = async (s: any) => {
    await db.leads.update(lead.id, { status: s });
    onUpdate();
  };

  const linkedinSearchUrl = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent((lead.poc?.name || '') + ' ' + lead.companyName)}`;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header: Name + Website */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-sans">{lead.companyName}</h3>
            {lead.website && (
              <a href={lead.website} target="_blank" rel="noreferrer" className="text-xs text-sky-500 hover:underline flex items-center gap-1 bg-sky-50 dark:bg-sky-900/20 px-2 py-0.5 rounded">
                Visit Website ↗
              </a>
            )}
          </div>
          {/* AI Summary Section */}
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            <span className="font-bold text-slate-700 dark:text-slate-200">Mission: </span>
            {lead.aiSummary || lead.description}
          </p>
        </div>
        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${
          (lead.funding?.round || '').includes('A') ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
          'bg-blue-50 text-blue-600 border-blue-200'
        }`}>
          {lead.funding?.round || 'Unknown'}
        </div>
      </div>

      {/* Funding & Company Intelligence Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4 text-xs">
        <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
          <span className="text-slate-400 uppercase tracking-wider font-bold block mb-1">Funding Date</span>
          <div className="font-semibold">{lead.funding?.date || 'Recent (Est.)'}</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
           <span className="text-slate-400 uppercase tracking-wider font-bold block mb-1">Amount</span>
           <div className="font-semibold">{lead.funding?.amount || 'Undisclosed'}</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
           <span className="text-slate-400 uppercase tracking-wider font-bold block mb-1">Lead Investor</span>
           <div className="font-semibold">{lead.funding?.leadInvestor || 'Undisclosed'}</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
           <span className="text-slate-400 uppercase tracking-wider font-bold block mb-1">Employees</span>
           <div className="font-semibold">{lead.employees || 'Unknown'}</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
           <span className="text-slate-400 uppercase tracking-wider font-bold block mb-1">Key Individuals</span>
           <div className="flex flex-col gap-1">
             <span className="font-semibold text-sky-600 dark:text-sky-400 text-sm">
               {lead.poc?.name || 'Unknown Name'}
             </span>
             <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
               {lead.poc?.role || 'Unknown Title'}
             </span>
             
             <div className="flex flex-col gap-1 mt-1">
                {lead.poc?.linkedin ? (
                  <a href={lead.poc.linkedin} target="_blank" rel="noreferrer" className="text-[10px] text-[#0077b5] hover:underline flex items-center gap-1 font-bold">
                    <span className="w-2.5 h-2.5 inline-block bg-[#0077b5] rounded-[1px]"></span> 
                    LinkedIn Profile ↗
                  </a>
                ) : (
                   <span className="text-[10px] text-slate-400 italic">LinkedIn profile not found</span>
                )}
                
                <a href={linkedinSearchUrl} target="_blank" rel="noreferrer" className="text-[10px] text-slate-500 hover:text-sky-500 hover:underline flex items-center gap-1">
                   <span>🔍</span> Search LinkedIn ↗
                </a>
             </div>
           </div>
        </div>
      </div>

      {/* Alignment Visuals */}
      {lead.matchedKeywords && lead.matchedKeywords.length > 0 && (
        <div className="mb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Alignment Visuals (Matched Skills)</span>
          <div className="flex flex-wrap gap-2">
            {lead.matchedKeywords.map((kw, i) => (
              <span key={i} className="px-2 py-1 bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 rounded text-[10px] font-bold border border-sky-200 dark:border-sky-800">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Fit Statement */}
      <div className="bg-sky-50 dark:bg-sky-900/20 p-4 rounded-lg mb-4 border border-sky-100 dark:border-sky-800">
        <h4 className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-1">BioCapital Match Analysis</h4>
        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
          {lead.fitStatement}
        </p>
      </div>

      {/* Dual-Format Outreach Generator */}
      {lead.outreachEmail || lead.outreachLinkedIn ? (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-100 dark:border-slate-700 pb-2">
            <button 
              onClick={() => setActiveDraft('email')}
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors ${activeDraft === 'email' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Email Draft (~200 words)
            </button>
            <button 
              onClick={() => setActiveDraft('linkedin')}
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors ${activeDraft === 'linkedin' ? 'bg-[#0077b5]/10 text-[#0077b5]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              LinkedIn (~200 chars)
            </button>
            <button 
              onClick={() => navigator.clipboard.writeText(activeDraft === 'email' ? lead.outreachEmail! : lead.outreachLinkedIn!)} 
              className="ml-auto text-xs text-sky-500 hover:underline"
            >
              Copy
            </button>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 h-32 overflow-y-auto custom-scrollbar whitespace-pre-wrap font-mono">
            {activeDraft === 'email' ? lead.outreachEmail : lead.outreachLinkedIn}
          </div>
        </div>
      ) : (
        <button 
          onClick={handleGenerateDraft}
          disabled={drafting}
          className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-black rounded font-bold text-xs uppercase tracking-wide hover:opacity-90 transition-opacity mb-4"
        >
          {drafting ? 'Synthesizing Dual Outreach...' : 'Generate Email & LinkedIn Drafts'}
        </button>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="flex gap-2">
          {lead.contextualLinks.map((link, i) => (
             <a key={i} href={link.url} target="_blank" rel="noreferrer" className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded hover:bg-slate-200 transition-colors">Source {i+1}</a>
          ))}
        </div>
        <select 
          value={lead.status} 
          onChange={(e) => handleStatusChange(e.target.value)}
          className="bg-transparent text-xs font-bold text-slate-500 border-none outline-none cursor-pointer hover:text-sky-500"
        >
          <option value="New Lead">New Lead</option>
          <option value="Contacted">Contacted</option>
          <option value="Meeting Scheduled">Meeting Scheduled</option>
          <option value="Solution Discussed">Solution Discussed</option>
          <option value="Archived">Archived</option>
        </select>
      </div>
    </div>
  );
};
