
import { User, HistoryRecord, RiskLevel, ResumeHistoryRecord, InterviewModule, RecordCategory } from './types';

const USERS_KEY = 'fraudguard_users';
const HISTORY_KEY = 'fraudguard_history';
const RESUME_HISTORY_KEY = 'fraudguard_resume_history';
const INTERVIEW_KEY = 'fraudguard_interview_modules';
const CURRENT_USER_KEY = 'fraudguard_current_user';

export const db = {
  getUsers: (): User[] => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const history = db.getHistory();
    return users.map((u: User) => ({
      ...u,
      analyses_count: history.filter(h => h.userId === u.id).length
    }));
  },
  
  saveUser: (user: User) => {
    const users = db.getUsers();
    if (users.find(u => u.email === user.email)) return;
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  },
  
  updateUser: (updatedUser: User) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]').map((u: User) => u.id === updatedUser.id ? updatedUser : u);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },
  
  deleteUser: (userId: string) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]').filter((u: User) => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    db.clearUnifiedHistory(userId);
  },
  
  getCurrentUser: (): User | null => JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null'),
  setCurrentUser: (user: User | null) => localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user)),

  getHistory: (): HistoryRecord[] => JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'),
  
  saveHistory: (record: HistoryRecord) => {
    const history = db.getHistory();
    localStorage.setItem(HISTORY_KEY, JSON.stringify([record, ...history]));
  },

  clearUnifiedHistory: (userId: string) => {
    // Correctly filter and re-save both history types to ensure 'Clear History' works
    const history = db.getHistory().filter(h => h.userId !== userId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    
    const resumeHistory = db.getResumeHistory().filter(h => h.userId !== userId);
    localStorage.setItem(RESUME_HISTORY_KEY, JSON.stringify(resumeHistory));
  },

  deleteHistory: (id: string) => {
    const history = db.getHistory().filter(h => h.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  },
  
  getUserHistory: (userId: string): HistoryRecord[] => {
    return db.getHistory().filter(h => h.userId === userId);
  },

  getResumeHistory: (): ResumeHistoryRecord[] => JSON.parse(localStorage.getItem(RESUME_HISTORY_KEY) || '[]'),
  
  saveResumeHistory: (record: ResumeHistoryRecord) => {
    const history = db.getResumeHistory();
    localStorage.setItem(RESUME_HISTORY_KEY, JSON.stringify([record, ...history]));
  },
  
  deleteResumeHistory: (id: string) => {
    const history = db.getResumeHistory().filter(h => h.id !== id);
    localStorage.setItem(RESUME_HISTORY_KEY, JSON.stringify(history));
  },
  
  getUserResumeHistory: (userId: string): ResumeHistoryRecord[] => {
    return db.getResumeHistory().filter(h => h.userId === userId);
  },

  getInterviewModules: (userId: string): InterviewModule[] => {
    const modules = JSON.parse(localStorage.getItem(INTERVIEW_KEY) || '[]');
    return modules.filter((m: InterviewModule) => m.userId === userId);
  },

  saveInterviewModule: (module: InterviewModule) => {
    const modules = JSON.parse(localStorage.getItem(INTERVIEW_KEY) || '[]');
    localStorage.setItem(INTERVIEW_KEY, JSON.stringify([module, ...modules]));
  },

  deleteInterviewModule: (id: string) => {
    const modules = JSON.parse(localStorage.getItem(INTERVIEW_KEY) || '[]');
    const filtered = modules.filter((m: any) => m.id !== id);
    localStorage.setItem(INTERVIEW_KEY, JSON.stringify(filtered));
  },

  // STRICT MAPPING: Centralized logic for the entire app
  getVerdictByRisk: (risk: number): 'Fake Job' | 'Genuine Job' | 'Suspicious' => {
    if (risk >= 70) return 'Fake Job';
    if (risk <= 40) return 'Genuine Job';
    return 'Suspicious';
  },

  getCategoryByRisk: (risk: number): RecordCategory => {
    if (risk >= 70) return 'fake';
    if (risk <= 40) return 'genuine';
    return 'suspicious';
  },

  getStats: () => {
    const history = db.getHistory();
    const resumeHistory = db.getResumeHistory();
    const users = db.getUsers();
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      return {
        date: dateStr,
        users: users.filter(u => u.created_at.startsWith(dateStr)).length,
        scans: history.filter(h => h.created_at.startsWith(dateStr)).length
      };
    }).reverse();

    return {
      totalUsers: users.length,
      totalAnalyses: history.length + resumeHistory.length,
      fakeJobsDetected: history.filter(h => h.risk_rate >= 70).length + resumeHistory.filter(r => r.fraud_risk_score >= 70).length,
      highRiskPercentage: (history.length + resumeHistory.length) ? Math.round(((history.filter(h => h.risk_rate >= 70).length + resumeHistory.filter(r => r.fraud_risk_score >= 70).length) / (history.length + resumeHistory.length)) * 100) : 0,
      newUsersToday: users.filter(u => u.created_at.startsWith(new Date().toISOString().split('T')[0])).length,
      growthTrend: last7Days,
      riskDistribution: [
        { name: 'Low', value: history.filter(h => h.risk_rate <= 40).length + resumeHistory.filter(r => r.fraud_risk_score <= 40).length },
        { name: 'Medium', value: history.filter(h => h.risk_rate > 40 && h.risk_rate < 70).length + resumeHistory.filter(r => r.fraud_risk_score > 40 && r.fraud_risk_score < 70).length },
        { name: 'High', value: history.filter(h => h.risk_rate >= 70).length + resumeHistory.filter(r => r.fraud_risk_score >= 70).length },
      ]
    };
  }
};

const initDb = () => {
  const users = db.getUsers();
  if (!users.some(u => u.username === 'admin')) {
    db.saveUser({
      id: 'admin-001',
      username: 'admin',
      email: 'admin@fraudguard.ai',
      password: 'admin123',
      is_blocked: false,
      role: 'admin',
      created_at: new Date(Date.now() - 86400000 * 30).toISOString()
    });
  }
};

initDb();
