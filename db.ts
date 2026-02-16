
import { User, HistoryRecord, RiskLevel, ResumeHistoryRecord } from './types';

const USERS_KEY = 'fraudguard_users';
const HISTORY_KEY = 'fraudguard_history';
const RESUME_HISTORY_KEY = 'fraudguard_resume_history';
const CURRENT_USER_KEY = 'fraudguard_current_user';

export const db = {
  getUsers: (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]'),
  saveUser: (user: User) => {
    const users = db.getUsers();
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  },
  updateUser: (updatedUser: User) => {
    const users = db.getUsers().map(u => u.id === updatedUser.id ? updatedUser : u);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },
  deleteUser: (userId: string) => {
    const users = db.getUsers().filter(u => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },
  getCurrentUser: (): User | null => JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null'),
  setCurrentUser: (user: User | null) => localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user)),

  getHistory: (): HistoryRecord[] => JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'),
  saveHistory: (record: HistoryRecord) => {
    const history = db.getHistory();
    localStorage.setItem(HISTORY_KEY, JSON.stringify([record, ...history]));
  },
  deleteHistory: (id: string) => {
    const history = db.getHistory().filter(h => h.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  },
  getUserHistory: (userId: string): HistoryRecord[] => db.getHistory().filter(h => h.userId === userId),

  // Resume History
  getResumeHistory: (): ResumeHistoryRecord[] => JSON.parse(localStorage.getItem(RESUME_HISTORY_KEY) || '[]'),
  saveResumeHistory: (record: ResumeHistoryRecord) => {
    const history = db.getResumeHistory();
    localStorage.setItem(RESUME_HISTORY_KEY, JSON.stringify([record, ...history]));
  },
  getUserResumeHistory: (userId: string): ResumeHistoryRecord[] => db.getResumeHistory().filter(h => h.userId === userId),

  getStats: () => {
    const history = db.getHistory();
    const resumeHistory = db.getResumeHistory();
    const users = db.getUsers();
    const fakeJobs = history.filter(h => h.prediction === 'Fake Job').length;
    
    return {
      totalUsers: users.length,
      totalAnalyses: history.length,
      totalResumeAnalyses: resumeHistory.length,
      fakeJobsDetected: fakeJobs,
      highRiskPercentage: history.length ? Math.round((history.filter(h => h.risk_level === RiskLevel.HIGH).length / history.length) * 100) : 0,
      riskDistribution: [
        { name: 'Low', value: history.filter(h => h.risk_level === RiskLevel.LOW).length },
        { name: 'Medium', value: history.filter(h => h.risk_level === RiskLevel.MEDIUM).length },
        { name: 'High', value: history.filter(h => h.risk_level === RiskLevel.HIGH).length },
      ],
      avgResumeMatch: resumeHistory.length 
        ? Math.round(resumeHistory.reduce((acc, h) => acc + h.match_percentage, 0) / resumeHistory.length) 
        : 0
    };
  }
};

if (db.getUsers().length === 0) {
  db.saveUser({
    id: 'admin-001',
    username: 'admin',
    email: 'admin@fraudguard.ai',
    password: 'admin123',
    is_blocked: false,
    role: 'admin',
    created_at: new Date().toISOString()
  });
}
