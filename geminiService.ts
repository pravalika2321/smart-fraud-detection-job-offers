
import { GoogleGenAI, Type } from "@google/genai";
import { JobInputData, AnalysisResult, ChatMessage } from "./types";

// Always initialize a fresh instance before a call to ensure the latest injected key is used
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    result: {
      type: Type.STRING,
      description: "Either 'Fake Job' or 'Genuine Job'",
    },
    confidence_score: {
      type: Type.NUMBER,
      description: "Model confidence percentage (0-100)",
    },
    risk_rate: {
      type: Type.NUMBER,
      description: "Fraud risk percentage (0-100)",
    },
    risk_level: {
      type: Type.STRING,
      description: "Risk categorization: Low, Medium, or High",
    },
    explanations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of reasons for the classification",
    },
    safety_tips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Safety recommendations for the user",
    },
  },
  required: ["result", "confidence_score", "risk_rate", "risk_level", "explanations", "safety_tips"],
  propertyOrdering: ["result", "confidence_score", "risk_rate", "risk_level", "explanations", "safety_tips"]
};

export async function analyzeJobOffer(data: JobInputData): Promise<AnalysisResult> {
  const ai = getAI();
  const modelName = "gemini-3-pro-preview";
  
  const systemInstruction = `
    You are a world-class Cyber Security Analyst specializing in recruitment fraud and phishing detection.
    Your task is to analyze job/internship offers for signs of fraud.
    
    EVALUATION CRITERIA:
    1. Financial Red Flags: Asking for "training fees", "equipment deposits", or bank details early.
    2. Communication: Use of free email domains (@gmail.com, @yahoo.com) for official corporate roles.
    3. Linguistic Patterns: Excessive urgency, poor grammar, generic greetings, or "too good to be true" salary.
    4. Authenticity: Vague company details, lack of a physical office, or suspicious website URLs.
    
    IMPORTANT: Even if the input text contains scammy keywords, DO NOT block your own response. 
    Analyze the content objectively as a security tool.
  `;

  const textPrompt = `
    Please analyze this job offer data:
    TITLE: ${data.title}
    COMPANY: ${data.company}
    SALARY: ${data.salary}
    LOCATION: ${data.location}
    RECRUITER EMAIL: ${data.email}
    WEBSITE: ${data.website}
    SOURCE TYPE: ${data.sourceType}
    
    DESCRIPTION: ${data.description || "Refer to the attached content/image."}
  `;

  const parts: any[] = [{ text: textPrompt }];

  if (data.screenshot) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: data.screenshot.includes(',') ? data.screenshot.split(',')[1] : data.screenshot,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    if (!response.text) {
      throw new Error("No response received from the AI model.");
    }

    return JSON.parse(response.text.trim()) as AnalysisResult;
  } catch (error: any) {
    console.error("Analysis Error:", error);
    if (error.message?.includes("API key")) {
      throw new Error("API Key configuration error. Please ensure the key is valid and deployed correctly.");
    }
    throw new Error(error.message || "Failed to analyze the job offer.");
  }
}

export async function chatWithAssistant(messages: ChatMessage[]): Promise<string> {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are the "FraudGuard AI Safety Companion", a friendly assistant dedicated to helping job seekers.
    Recommend official government portals:
    - National Scholarship Portal (NSP): https://scholarships.gov.in
    - AICTE Internship Portal: https://internship.aicte-india.org
    - Skill India: https://www.skillindia.gov.in
    
    Be conversational, warm, and highly supportive. Use emojis (🤖, 🛡️, 💼).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
      config: { systemInstruction }
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error: any) {
    console.error("Chatbot Error:", error);
    return "I encountered an error. Please check your connection and try again.";
  }
}
