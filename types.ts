
export type LeadStatus = 'New Lead' | 'Contacted' | 'Meeting Scheduled' | 'Solution Discussed' | 'Archived';

export interface SemanticProfile {
  id: string;
  // stored for display, though analysis is now multimodal
  fileNames: string[];
  rankedKeywords: { 
    keyword: string; 
    score: number; 
    baseScore: number; // Original AI score
    userAdjustment: number; // Manual +/- calibration
    multiplierApplied: boolean; // 1.5x for Vascular/Cardio
    visualBoostApplied: boolean; // 30% boost from visual data
  }[];
  summary: string;
  timestamp: number;
}

export interface Lead {
  id: string;
  companyName: string;
  website?: string;
  description: string; // Used for raw description
  aiSummary: string; // 3-5 sentence summary of product, mission, technical challenge
  employees: string;
  funding: {
    round: string; // Series A, B, C
    amount?: string;
    amountValue?: number; // Numeric for filtering (e.g., 50000000)
    date?: string; // Explicit Date required
    leadInvestor?: string; // Who provided funding
  };
  matchedKeywords: string[]; // Alignment Visuals
  poc: {
    role: string;
    name?: string; // CEO, CTO, Head of R&D
    linkedin?: string; // Direct LinkedIn Profile Link
  };
  fitStatement: string; // "Why You?" Analysis
  contextualLinks: { title: string; url: string }[];
  outreachEmail?: string; // Draft A
  outreachLinkedIn?: string; // Draft B
  status: LeadStatus;
  timestamp: number;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  summary: string; // Mandatory 3-5 sentences
  isOpenAccess: boolean; // True for PMC/Unpaywall or Public Regulatory
  paywallLabel?: string; // "This article is behind a paywall."
  type: 'Scientific' | 'Regulatory';
  topic: 'Vascular' | 'GenAI' | 'Pharma' | 'Compliance';
  jurisdiction?: 'USA' | 'EU' | 'UK' | 'Canada' | 'Global';
  timestamp: number;
}
