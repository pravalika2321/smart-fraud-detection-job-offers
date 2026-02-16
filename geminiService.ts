
import { GoogleGenAI, Type } from "@google/genai";
import { JobInputData, AnalysisResult, ChatMessage, ResumeAnalysisResult } from "./types";

// Helper for exponential backoff retries
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let delay = 1500;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error.message?.includes('429') || error.message?.toLowerCase().includes('exhausted');
      if (i === maxRetries - 1 || !isRateLimit) throw error;
      
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential increase
    }
  }
  throw new Error("Max retries exceeded for this request.");
}

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const FRAUD_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    result: { type: Type.STRING },
    confidence_score: { type: Type.NUMBER },
    risk_rate: { type: Type.NUMBER },
    risk_level: { type: Type.STRING },
    explanations: { type: Type.ARRAY, items: { type: Type.STRING } },
    safety_tips: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["result", "confidence_score", "risk_rate", "risk_level", "explanations", "safety_tips"],
};

const RESUME_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ats_score: { type: Type.NUMBER, description: "Total ATS compatibility score (0-100)" },
    match_percentage: { type: Type.NUMBER, description: "JD match percentage (0-100)" },
    readability_score: { type: Type.NUMBER, description: "Flesch-Kincaid style readability (0-100)" },
    keyword_density: { type: Type.NUMBER, description: "Percentage of key JD terms present" },
    matched_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
    missing_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
    suggested_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    optimized_summary: { type: Type.STRING, description: "AI-generated 3-4 line professional summary tailored to the role" },
    improved_bullets: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Experience bullets optimized into Action Verb -> Metric -> Result format" },
    strength_score: { type: Type.NUMBER, description: "Overall profile strength (1-10)" },
    rating: { type: Type.STRING, description: "Poor, Fair, Good, or Excellent" },
    learning_roadmap: { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT, 
        properties: {
          skill: { type: Type.STRING },
          resource: { type: Type.STRING }
        }
      } 
    },
    is_genuine_job: { type: Type.BOOLEAN, description: "Whether the job description appears to be a genuine recruitment offer" },
    fraud_risk_score: { type: Type.NUMBER, description: "Risk percentage that the JD is a scam (0-100)" },
    fraud_verdict: { type: Type.STRING, description: "Brief explanation of the fraud assessment" }
  },
  required: [
    "ats_score", "match_percentage", "readability_score", "keyword_density", 
    "matched_skills", "missing_skills", "suggested_keywords", "optimized_summary", 
    "improved_bullets", "strength_score", "rating", "learning_roadmap",
    "is_genuine_job", "fraud_risk_score", "fraud_verdict"
  ]
};

export async function analyzeJobOffer(data: JobInputData): Promise<AnalysisResult> {
  return withRetry(async () => {
    const ai = getAI();
    const systemInstruction = `You are a world-class Cyber Security Analyst specializing in recruitment fraud. Analyze job offers for phishing and scams. Return JSON only.`;
    const textPrompt = `Analyze this: TITLE: ${data.title}, COMPANY: ${data.company}, DESC: ${data.description}`;
    const parts: any[] = [{ text: textPrompt }];
    if (data.screenshot) {
      parts.push({ inlineData: { mimeType: "image/png", data: data.screenshot.split(',')[1] || data.screenshot } });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: { systemInstruction, responseMimeType: "application/json", responseSchema: FRAUD_RESPONSE_SCHEMA },
    });
    return JSON.parse(response.text.trim());
  });
}

export async function analyzeResume(
  resumeText: string, 
  jobDesc: string, 
  resumeImage?: string, 
  jdImage?: string
): Promise<ResumeAnalysisResult> {
  return withRetry(async () => {
    const ai = getAI();
    const systemInstruction = `
      You are an Industrial-Grade ATS Specialist, Senior HR Recruiter, AND Cyber Security Analyst.
      
      CORE TASKS:
      1. ATS Analysis: Analyze the resume against the JD (keywords, formatting, skills).
      2. Fraud Detection: Scrutinize the Job Description for scam markers (suspicious URLs, unusual salary, phishing language, generic tasks).
      
      Return a combined JSON analysis.
    `;
    
    const parts: any[] = [{ text: `RESUME SOURCE: ${resumeText}\n\nJOB DESCRIPTION SOURCE: ${jobDesc}` }];
    
    if (resumeImage) {
      parts.push({ inlineData: { mimeType: "image/png", data: resumeImage.split(',')[1] || resumeImage } });
    }
    if (jdImage) {
      parts.push({ inlineData: { mimeType: "image/png", data: jdImage.split(',')[1] || jdImage } });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: { systemInstruction, responseMimeType: "application/json", responseSchema: RESUME_RESPONSE_SCHEMA }
    });
    return JSON.parse(response.text.trim());
  });
}

export async function chatWithAssistant(messages: ChatMessage[]): Promise<string> {
  return withRetry(async () => {
    const ai = getAI();
    const systemInstruction = `Friendly FraudGuard AI Assistant. Help job seekers with resumes and fraud detection. Use emojis.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
      config: { systemInstruction }
    });
    return response.text || "I encountered an error.";
  });
}
