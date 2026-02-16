
export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  is_blocked: boolean;
  role: 'user' | 'admin';
  created_at: string;
  last_login?: string;
  analyses_count?: number;
}

export interface HistoryRecord {
  id: string;
  userId: string;
  job_title: string;
  company_name: string;
  prediction: 'Fake Job' | 'Genuine Job';
  confidence_score: number;
  risk_rate: number;
  risk_level: RiskLevel;
  created_at: string;
  explanations: string[];
  safety_tips: string[];
}

export interface ResumeAnalysisResult {
  ats_score: number;
  match_percentage: number;
  readability_score: number;
  keyword_density: number;
  matched_skills: string[];
  missing_skills: string[];
  suggested_keywords: string[];
  optimized_summary: string;
  improved_bullets: string[];
  strength_score: number; // 1-10
  rating: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  learning_roadmap: { skill: string; resource: string }[];
}

export interface ResumeHistoryRecord extends ResumeAnalysisResult {
  id: string;
  userId: string;
  job_title: string;
  resume_filename?: string;
  resume_format?: string;
  created_at: string;
}

export interface JobInputData {
  title: string;
  company: string;
  salary: string;
  location: string;
  email: string;
  website: string;
  description: string;
  sourceType: 'manual' | 'email' | 'file' | 'screenshot';
  screenshot?: string; // Base64 encoded image
}

export interface AnalysisResult {
  result: 'Fake Job' | 'Genuine Job';
  confidence_score: number;
  risk_rate: number;
  risk_level: RiskLevel;
  explanations: string[];
  safety_tips: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
