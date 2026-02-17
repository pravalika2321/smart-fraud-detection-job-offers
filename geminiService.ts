
import { GoogleGenAI, Type } from "@google/genai";
import { JobInputData, AnalysisResult, ChatMessage, ResumeAnalysisResult, InterviewModule } from "./types";

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let delay = 1500;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error.message?.includes('429') || error.message?.toLowerCase().includes('exhausted');
      if (i === maxRetries - 1 || !isRateLimit) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
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
    ats_score: { type: Type.NUMBER },
    match_percentage: { type: Type.NUMBER },
    readability_score: { type: Type.NUMBER },
    keyword_density: { type: Type.NUMBER },
    matched_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
    missing_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
    suggested_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    optimized_summary: { type: Type.STRING },
    improved_bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
    strength_score: { type: Type.NUMBER },
    rating: { type: Type.STRING },
    learning_roadmap: { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT, 
        properties: { skill: { type: Type.STRING }, resource: { type: Type.STRING } }
      } 
    },
    is_genuine_job: { type: Type.BOOLEAN },
    fraud_risk_score: { type: Type.NUMBER },
    fraud_verdict: { type: Type.STRING }
  },
  required: ["ats_score", "match_percentage", "readability_score", "keyword_density", "matched_skills", "missing_skills", "suggested_keywords", "optimized_summary", "improved_bullets", "strength_score", "rating", "learning_roadmap", "is_genuine_job", "fraud_risk_score", "fraud_verdict"]
};

const INTERVIEW_PREP_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    technical_questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING, description: "Detailed model answer" }
        },
        required: ["question", "answer"]
      }
    },
    hr_questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING, description: "STAR method behavioral answer" }
        },
        required: ["question", "answer"]
      }
    },
    preparation_roadmap: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING },
          task: { type: Type.STRING }
        },
        required: ["day", "task"]
      }
    },
    resources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          url: { type: Type.STRING }
        },
        required: ["name", "url"]
      }
    }
  },
  required: ["technical_questions", "hr_questions", "preparation_roadmap", "resources"]
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

export async function analyzeResume(resumeText: string, jobDesc: string, resumeImage?: string, jdImage?: string): Promise<ResumeAnalysisResult> {
  return withRetry(async () => {
    const ai = getAI();
    const systemInstruction = `You are an Industrial-Grade ATS Specialist, Senior HR Recruiter, AND Cyber Security Analyst. Scrutinize resume-JD match and fraud markers.`;
    const parts: any[] = [{ text: `RESUME: ${resumeText}\n\nJD: ${jobDesc}` }];
    if (resumeImage) parts.push({ inlineData: { mimeType: "image/png", data: resumeImage.split(',')[1] } });
    if (jdImage) parts.push({ inlineData: { mimeType: "image/png", data: jdImage.split(',')[1] } });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: { systemInstruction, responseMimeType: "application/json", responseSchema: RESUME_RESPONSE_SCHEMA }
    });
    return JSON.parse(response.text.trim());
  });
}

export async function generateInterviewPrep(role: string, level: string): Promise<any> {
  return withRetry(async () => {
    const ai = getAI();
    const systemInstruction = `You are a Senior Technical Recruiter at a Fortune 500 company. Generate a comprehensive interview preparation module for a specific role and experience level. Include technical questions, behavioral HR questions using the STAR method, and a preparation roadmap.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate interview prep for: ROLE: ${role}, LEVEL: ${level}`,
      config: { systemInstruction, responseMimeType: "application/json", responseSchema: INTERVIEW_PREP_SCHEMA }
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
