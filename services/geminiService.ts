
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, SemanticProfile, NewsItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL = "gemini-3-pro-preview";

// Helper to convert File to Base64 for Gemini API
const fileToPart = async (file: File) => {
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  
  return {
    inlineData: {
      data: base64Data,
      mimeType: file.type
    }
  };
};

// 2.1 Multimodal Document Analysis & Semantic Fingerprinting
export async function analyzeProfile(files: File[]): Promise<SemanticProfile> {
  const parts = await Promise.all(files.map(fileToPart));

  const systemInstruction = `
    You are the Multimodal Semantic Fingerprinting Engine for BioCapital News.
    Analyze the provided documents (Resumes, Papers, Project Summaries).
    
    ALGORITHM:
    1. EXTRACT CONTENT: Parse text and ANALYZE VISUALS (Charts, Diagrams) for deep technical specifics.
    2. KEYWORD SCORING (1-100):
       - VISUAL WEIGHTING: If a skill is in a figure/chart, boost score by 30%.
       - DOMAIN MULTIPLIER: "Vascular Biology", "Cardiovascular Science", "Biomedical Science" get 1.5x multiplier.
    3. CONTEXTUAL RANKING: Prioritize "Generative AI" higher if applied to Protein Folding/Drug Discovery.

    Return a JSON profile.
  `;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { text: "Analyze these documents to create a Semantic Consultant Profile." },
      ...parts
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          rankedKeywords: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                keyword: { type: Type.STRING },
                score: { type: Type.NUMBER },
                multiplierApplied: { type: Type.BOOLEAN },
                visualBoostApplied: { type: Type.BOOLEAN }
              }
            }
          }
        }
      }
    }
  });

  const data = JSON.parse(response.text || "{}");
  
  // Transform to include baseScore and userAdjustment
  const rankedKeywords = (data.rankedKeywords || []).map((k: any) => ({
    ...k,
    baseScore: k.score,
    userAdjustment: 0
  }));

  return {
    id: 'user-profile',
    fileNames: files.map(f => f.name),
    rankedKeywords: rankedKeywords,
    summary: data.summary || "No analysis available.",
    timestamp: Date.now()
  };
}

// 2.2 Lead Intelligence Feed
export async function findLeads(profile: SemanticProfile): Promise<Lead[]> {
  // Use scores adjusted by user
  const topKeywords = profile.rankedKeywords
    .map(k => ({ ...k, score: k.baseScore + k.userAdjustment }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(k => k.keyword)
    .join(", ");

  const systemInstruction = `
    You are the Lead Intelligence Feed for BioCapital News (v1.07).
    User Profile: Maruf Hoque, Ph.D. (Specialist in: ${topKeywords}).
    
    TARGET CRITERIA:
    1. Funding: **STRICTLY LAST 6 MONTHS (< 180 Days)**. Series A, B, or C.
    2. Size: < 200 employees.
    3. Industry: Biotech, MedTech, AI-Drug Discovery.
    
    TASK:
    - Find 5 companies matching these criteria using Google Search.
    - AI Summary: Generate a 3-5 sentence summary.
    - "Why You?" Analysis: Map user expertise to company needs.
    - ALIGNMENT VISUALS: Identify matched keywords.
    - STAKEHOLDERS: Identify CEO/CTO/R&D Head. **CRITICAL: Search for their LinkedIn URL.**
    - LINKS: Provide 2-3 specific news or source links related to the company (e.g., Press Release, Crunchbase).
  `;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Find 5 recent (last 6 months) Series A-C leads for Maruf Hoque, Ph.D. based on his expertise in ${topKeywords}. Search specifically for LinkedIn profiles of the key individuals.`,
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING },
            website: { type: Type.STRING },
            description: { type: Type.STRING },
            aiSummary: { type: Type.STRING, description: "3-5 sentence summary" },
            employees: { type: Type.STRING },
            funding: {
              type: Type.OBJECT,
              properties: {
                round: { type: Type.STRING },
                amount: { type: Type.STRING },
                date: { type: Type.STRING },
                leadInvestor: { type: Type.STRING }
              }
            },
            matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            poc: {
              type: Type.OBJECT,
              properties: { 
                role: { type: Type.STRING },
                name: { type: Type.STRING },
                linkedin: { type: Type.STRING, description: "Full LinkedIn URL if found" }
              }
            },
            fitStatement: { type: Type.STRING },
            relevantLinks: {
              type: Type.ARRAY,
              description: "2-3 relevant source links for this specific lead.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    }
  });

  const leads = JSON.parse(response.text || "[]");

  return leads.map((l: any, i: number) => {
    // Robust safety check for funding object
    const funding = l.funding || {};
    // Use specific links if available, otherwise empty to avoid incorrect mapping
    const contextualLinks = Array.isArray(l.relevantLinks) ? l.relevantLinks : [];

    return {
      ...l,
      id: `lead-${Date.now()}-${i}`,
      status: 'New Lead',
      timestamp: Date.now(),
      funding: {
        round: funding.round || 'Unknown',
        amount: funding.amount,
        date: funding.date,
        leadInvestor: funding.leadInvestor,
        amountValue: funding.amount ? parseInt(funding.amount.replace(/[^0-9]/g, '')) : 0
      },
      // Ensure other nested properties are safe
      matchedKeywords: Array.isArray(l.matchedKeywords) ? l.matchedKeywords : [],
      poc: l.poc || { role: 'Unknown', name: 'Unknown' },
      contextualLinks: contextualLinks
    };
  });
}

// 2.4 Dual-Format Outreach Generator
export async function generateOutreach(lead: Lead, profile: SemanticProfile): Promise<{ email: string; linkedin: string }> {
  const topKeywords = profile.rankedKeywords.slice(0, 3).map(k => k.keyword).join(", ");
  
  const systemInstruction = `
    Generate TWO outreach drafts for Maruf Hoque, Ph.D. targeting ${lead.companyName}.
    
    Draft A (Professional Email):
    - Structure:
        1. Problem Identification: Identify a specific technical challenge ${lead.companyName} faces.
        2. Technical Solution: Explain how Dr. Hoque's expertise in ${topKeywords} addresses this.
        3. Request: Ask for a brief meeting.
    - Length: Approximately 200 words.
    - Tone: Scientific, Professional, Consultative.

    Draft B (LinkedIn Message):
    - Constraint: STRICTLY UNDER 200 CHARACTERS (including spaces).
    - Content: Hook + Value Prop + Call to Action.
    - Tone: Direct, High-Impact.
  `;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Draft outreach for ${lead.companyName}.`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          email: { type: Type.STRING },
          linkedin: { type: Type.STRING }
        }
      }
    }
  });

  const parsed = JSON.parse(response.text || "{}");
  return {
    email: parsed.email || "Email draft failed.",
    linkedin: parsed.linkedin || "LinkedIn draft failed."
  };
}

// 2.3 Regulatory & Domain Newsfeed
export async function fetchNews(): Promise<NewsItem[]> {
  const systemInstruction = `
    You are the Global Regulatory & Scientific Intelligence Engine for BioCapital News.
    
    TASK 1: REGULATORY INTELLIGENCE
    Find 3 recent high-impact regulatory updates from FDA (USA), EMA (EU), MHRA (UK), Health Canada (CA).
    Focus: GenAI in Healthcare, Pharma Compliance, Drug Discovery.
    
    TASK 2: SCIENTIFIC INTELLIGENCE
    Find 3 recent breakthroughs in Vascular Biology or GenAI applications in Biotech.
    
    MANDATORY RULES:
    1. **SUMMARIZATION**: Every article MUST have a 3-5 sentence summary highlighting relevance to the domain.
    2. **ACCESS CONTROL**: Check if the article is Open Access (PMC, Open Source).
       - If YES: set isOpenAccess = true.
       - If NO (Nature, Science, Paid Journals): set isOpenAccess = false.
    3. **LINKS**: You MUST include the direct URL to the source article in the JSON output. VERIFY the link matches the title.
    
    OUTPUT:
    Return a mixed JSON array.
  `;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Find latest Regulatory (FDA/EMA/MHRA/HC) and Scientific news.`,
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            source: { type: Type.STRING },
            url: { type: Type.STRING, description: "The direct URL to the source article." },
            summary: { type: Type.STRING, description: "3-5 sentence summary" },
            isOpenAccess: { type: Type.BOOLEAN },
            type: { type: Type.STRING, enum: ['Scientific', 'Regulatory'] },
            topic: { type: Type.STRING },
            jurisdiction: { type: Type.STRING, enum: ['USA', 'EU', 'UK', 'Canada', 'Global'] }
          }
        }
      }
    }
  });

  const news = JSON.parse(response.text || "[]");

  return news.map((n: any, i: number) => ({
    ...n,
    id: `news-${Date.now()}-${i}`,
    url: n.url || '#',
    timestamp: Date.now()
  }));
}
