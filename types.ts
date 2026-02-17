
export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export type RecordCategory = 'fake' | 'genuine' | 'suspicious';

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
  category: RecordCategory;
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
  is_genuine_job: boolean;
  fraud_risk_score: number;
  fraud_verdict: string;
}

export interface ResumeHistoryRecord extends ResumeAnalysisResult {
  id: string;
  userId: string;
  job_title: string;
  category: RecordCategory;
  resume_filename?: string;
  resume_format?: string;
  created_at: string;
}

export interface InterviewModule {
  id: string;
  userId: string;
  role: string;
  experience_level: string;
  technical_questions: { question: string; answer: string }[];
  hr_questions: { question: string; answer: string }[];
  preparation_roadmap: { day: string; task: string }[];
  resources: { name: string; url: string }[];
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
  screenshot?: string; 
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
