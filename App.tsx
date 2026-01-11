
import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { findLeads, fetchNews } from './services/geminiService';
import { Lead, NewsItem, SemanticProfile } from './types';
import { ProfileAnalysis } from './components/ProfileAnalysis';
import { LeadCard } from './components/LeadCard';
import { NewsCard } from './components/NewsCard';
import { SpinningDNA } from './components/SpinningDNA';

const App: React.FC = () => {
  const [auth, setAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'leads' | 'news' | 'crm'>('leads');
  const [darkMode, setDarkMode] = useState(true);
  
  const [profile, setProfile] = useState<SemanticProfile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // Dashboard Filters
  const [filterInvestor, setFilterInvestor] = useState('');
  const [filterAmount, setFilterAmount] = useState<number | ''>('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStage, setFilterStage] = useState('All');

  useEffect(() => {
    // Auth Check
    if (localStorage.getItem('biocapital_user')) setAuth(true);
    
    // Theme Init
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    // Data Load
    loadData();
  }, [darkMode]);

  const loadData = async () => {
    const p = await db.profiles.orderBy('timestamp').last();
    if (p) setProfile(p);
    setLeads(await db.leads.orderBy('timestamp').reverse().toArray());
    setNews(await db.news.orderBy('timestamp').reverse().toArray());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('biocapital_user', 'authorized');
    setAuth(true);
  };

  const handleProfileUpdate = async (p: SemanticProfile) => {
    await db.profiles.clear();
    if (p) {
      await db.profiles.add(p);
      setProfile(p);
      // Trigger Lead Search automatically on profile update
      refreshAll(p);
    } else {
      setProfile(null);
    }
  };

  // ONE-CLICK INIT SYSTEM
  const refreshAll = async (currentProfile?: SemanticProfile) => {
    const p = currentProfile || profile;
    if (!p) return;

    setLoading(true);
    setLoadingText('Running Global System Sync...');
    
    try {
      // Parallel Execution
      const [newLeads, newNews] = await Promise.all([
        findLeads(p),
        fetchNews()
      ]);

      // Database Update
      await db.leads.clear();
      await db.leads.bulkAdd(newLeads);
      setLeads(newLeads);

      await db.news.clear();
      await db.news.bulkAdd(newNews);
      setNews(newNews);

    } catch (e) {
      console.error(e);
      alert("System Sync Failed. Please try again.");
    } finally {
      setLoading(false);
      setLoadingText('');
    }
  };

  // Filtering Logic
  const filteredLeads = leads.filter(l => {
    if (l.status === 'Archived') return false;
    
    // Safety Checks for properties
    const funding = l.funding || { round: 'Unknown' };
    const poc = l.poc || { role: '', name: '' };
    
    // Stage Filter
    if (filterStage !== 'All') {
      if (!funding.round.includes(filterStage)) return false;
    }

    if (filterInvestor && !funding.leadInvestor?.toLowerCase().includes(filterInvestor.toLowerCase())) return false;
    
    // Name / Role Filter
    if (filterRole) {
       const term = filterRole.toLowerCase();
       const matchesRole = poc.role.toLowerCase().includes(term);
       const matchesName = (poc.name || '').toLowerCase().includes(term);
       if (!matchesRole && !matchesName) return false;
    }

    if (filterAmount && (funding.amountValue || 0) < Number(filterAmount) * 1000000) return false;
    return true;
  });

  // Auth Screen
  if (!auth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-8 text-center">
          <div className="flex justify-center"><SpinningDNA /></div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 font-sans tracking-tight">BioCapital News</h1>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Scientific Intelligence targeted for Maruf Hoque, Ph.D.</p>
          </div>
          <input type="email" required placeholder="Enter Credentials (Email)" className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 px-4 text-white text-center text-sm outline-none focus:border-sky-500 transition-colors" />
          <button type="submit" className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg uppercase text-xs tracking-widest transition-all">Authenticate</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">BC</div>
          <div>
            <span className="font-bold text-lg tracking-tight font-sans block leading-none">BioCapital News <span className="text-[10px] text-slate-400 font-normal ml-1">v1.08</span></span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest hidden md:block">Scientific Intelligence for Maruf Hoque, Ph.D.</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Tab Navigation */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {(['leads', 'news', 'crm'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 shadow-sm text-sky-600 dark:text-sky-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* One-Click Init */}
          <button 
            onClick={() => refreshAll()} 
            disabled={loading || !profile}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all border ${loading ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-sky-600 hover:bg-sky-500 text-white border-transparent'}`}
          >
            {loading ? 'Syncing...' : 'Initialize Newsfeed'}
          </button>

          <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-400 hover:text-sky-500">
            {darkMode ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <div className="container mx-auto max-w-7xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar: Profile */}
        <div className="lg:col-span-4 space-y-6">
          <ProfileAnalysis onProfileGenerated={handleProfileUpdate} existingProfile={profile || undefined} />
          
          {/* Quick Stats */}
          {profile && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Pipeline Velocity</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{leads.filter(l => l.status === 'New Lead').length}</div>
                  <div className="text-[10px] uppercase text-slate-500 mt-1">New Leads</div>
                </div>
                <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">{leads.filter(l => l.status !== 'New Lead' && l.status !== 'Archived').length}</div>
                  <div className="text-[10px] uppercase text-sky-500 mt-1">In Progress</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8">
          
          {activeTab === 'leads' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <h2 className="text-2xl font-bold font-sans">Lead Intelligence Feed</h2>
                
                {/* Dynamic Filters */}
                <div className="flex gap-2 flex-wrap justify-end">
                   <select 
                     value={filterStage} 
                     onChange={(e) => setFilterStage(e.target.value)}
                     className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-1 text-xs outline-none focus:border-sky-500"
                   >
                     <option value="All">All Stages</option>
                     <option value="Series A">Series A</option>
                     <option value="Series B">Series B</option>
                     <option value="Series C">Series C</option>
                   </select>

                   <input 
                     type="text" 
                     placeholder="Filter by Investor" 
                     className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-1 text-xs outline-none focus:border-sky-500"
                     value={filterInvestor}
                     onChange={(e) => setFilterInvestor(e.target.value)}
                   />
                   <input 
                     type="text" 
                     placeholder="Name or Role" 
                     className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-1 text-xs outline-none focus:border-sky-500"
                     value={filterRole}
                     onChange={(e) => setFilterRole(e.target.value)}
                   />
                   <input 
                     type="number" 
                     placeholder="Min $M" 
                     className="w-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-1 text-xs outline-none focus:border-sky-500"
                     value={filterAmount}
                     onChange={(e) => setFilterAmount(e.target.value ? Number(e.target.value) : '')}
                   />
                </div>
              </div>
              
              {loading ? (
                <div className="py-20 flex flex-col items-center">
                  <SpinningDNA />
                  <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">{loadingText}</p>
                </div>
              ) : filteredLeads.length > 0 ? (
                <div className="grid gap-6">
                  {filteredLeads.map(lead => (
                    <LeadCard key={lead.id} lead={lead} profile={profile!} onUpdate={loadData} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 opacity-50">
                  <p className="text-sm font-bold uppercase tracking-widest">No Matches Found</p>
                  <p className="text-xs mt-2">{profile ? 'Try adjusting filters or initializing new feed.' : 'Upload Profile to Initiate Scan'}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'news' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-sans">Global Domain Newsfeed</h2>
                <div className="flex gap-2">
                   <div className="flex items-center gap-1.5 bg-sky-50 dark:bg-sky-900/20 px-3 py-1 rounded-full border border-sky-100 dark:border-sky-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                      <span className="text-[9px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-widest">FDA / EMA Active</span>
                   </div>
                </div>
              </div>
              
              {loading ? (
                 <div className="py-20 flex flex-col items-center">
                  <SpinningDNA />
                </div>
              ) : news.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {news.map(item => (
                    <NewsCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 opacity-50">
                   <p className="text-sm font-bold uppercase tracking-widest">Newsfeed Empty</p>
                   <p className="text-xs mt-2">Click Initialize to sync global data.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'crm' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold font-sans">Pipeline CRM</h2>
              <div className="space-y-2">
                {leads.length === 0 && <p className="text-sm text-slate-500">Pipeline empty.</p>}
                {leads.map(lead => (
                   <div key={lead.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div>
                        <div className="font-bold text-sm">{lead.companyName}</div>
                        <div className="text-xs text-slate-500">Updated: {new Date(lead.timestamp).toLocaleDateString()}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        lead.status === 'Meeting Scheduled' ? 'bg-emerald-100 text-emerald-700' :
                        lead.status === 'Contacted' ? 'bg-blue-100 text-blue-700' :
                        lead.status === 'New Lead' ? 'bg-sky-100 text-sky-700' :
                        lead.status === 'Archived' ? 'bg-slate-100 text-slate-500' :
                        'bg-amber-100 text-amber-700'
                      }`}>{lead.status}</span>
                   </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
