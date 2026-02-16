
import { GoogleGenAI, Type } from "@google/genai";
import { JobInputData, AnalysisResult, ChatMessage, ResumeAnalysisResult } from "./types";

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
    match_percentage: { type: Type.NUMBER, description: "Match percentage between resume and JD (0-100)" },
    matched_skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Skills found in both" },
    missing_skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Skills missing in resume" },
    suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Actionable tips" },
    strength_score: { type: Type.NUMBER, description: "Overall quality score (1-10)" },
    rating: { type: Type.STRING, description: "Rating: Low, Medium, or High" }
  },
  required: ["match_percentage", "matched_skills", "missing_skills", "suggestions", "strength_score", "rating"]
};

export async function analyzeJobOffer(data: JobInputData): Promise<AnalysisResult> {
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
}

export async function analyzeResume(resumeText: string, jobDesc: string): Promise<ResumeAnalysisResult> {
  const ai = getAI();
  const systemInstruction = `
    You are an expert HR Recruiter and ATS Optimization Specialist.
    Compare the provided resume against the job description.
    Identify hard/soft skills, calculate a match percentage, and suggest improvements.
    Be encouraging but honest. Return valid JSON.
  `;
  const prompt = `RESUME TEXT:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDesc}`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: { systemInstruction, responseMimeType: "application/json", responseSchema: RESUME_RESPONSE_SCHEMA }
  });
  return JSON.parse(response.text.trim());
}

export async function chatWithAssistant(messages: ChatMessage[]): Promise<string> {
  const ai = getAI();
  const systemInstruction = `Friendly FraudGuard AI Assistant. Help job seekers. Emojis 🤖🛡️.`;
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
    config: { systemInstruction }
  });
  return response.text || "I encountered an error.";
}
