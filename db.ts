
import { User, HistoryRecord, RiskLevel, ResumeHistoryRecord } from './types';

const USERS_KEY = 'fraudguard_users';
const HISTORY_KEY = 'fraudguard_history';
const RESUME_HISTORY_KEY = 'fraudguard_resume_history';
const CURRENT_USER_KEY = 'fraudguard_current_user';

export const db = {
  getUsers: (): User[] => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const history = db.getHistory();
    // Dynamically calculate analyses count for the dashboard
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
    // Cascade delete history
    const history = db.getHistory().filter(h => h.userId !== userId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  },
  
  getCurrentUser: (): User | null => JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null'),
  setCurrentUser: (user: User | null) => localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user)),

  getHistory: (): HistoryRecord[] => JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'),
  
  saveHistory: (record: HistoryRecord) => {
    const history = db.getHistory();
    localStorage.setItem(HISTORY_KEY, JSON.stringify([record, ...history]));
  },
  
  deleteHistory: (id: string) => {
    const history = db.getHistory();
    const filtered = history.filter(h => h.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
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
    const history = db.getResumeHistory();
    const filtered = history.filter(h => h.id !== id);
    localStorage.setItem(RESUME_HISTORY_KEY, JSON.stringify(filtered));
  },
  
  getUserResumeHistory: (userId: string): ResumeHistoryRecord[] => {
    return db.getResumeHistory().filter(h => h.userId === userId);
  },

  getStats: () => {
    const history = db.getHistory();
    const resumeHistory = db.getResumeHistory();
    const users = db.getUsers();
    const fakeJobs = history.filter(h => h.prediction === 'Fake Job').length;
    
    // Growth Trend Simulation
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
      totalAnalyses: history.length,
      totalResumeAnalyses: resumeHistory.length,
      fakeJobsDetected: fakeJobs,
      highRiskPercentage: history.length ? Math.round((history.filter(h => h.risk_level === RiskLevel.HIGH).length / history.length) * 100) : 0,
      newUsersToday: users.filter(u => u.created_at.startsWith(new Date().toISOString().split('T')[0])).length,
      growthTrend: last7Days,
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

// Seed Admin Account
const existingUsers = db.getUsers();
if (!existingUsers.some(u => u.username === 'admin')) {
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
