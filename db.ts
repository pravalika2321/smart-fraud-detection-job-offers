
import { User, HistoryRecord, RiskLevel } from './types';

const USERS_KEY = 'fraudguard_users';
const HISTORY_KEY = 'fraudguard_history';
const CURRENT_USER_KEY = 'fraudguard_current_user';

export const db = {
  // Auth
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

  // History
  getHistory: (): HistoryRecord[] => JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'),
  
  saveHistory: (record: HistoryRecord) => {
    const history = db.getHistory();
    localStorage.setItem(HISTORY_KEY, JSON.stringify([record, ...history]));
  },

  deleteHistory: (id: string) => {
    const history = db.getHistory().filter(h => h.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  },

  getUserHistory: (userId: string): HistoryRecord[] => {
    return db.getHistory().filter(h => h.userId === userId);
  },

  // Stats for Admin
  getStats: () => {
    const history = db.getHistory();
    const users = db.getUsers();
    const fakeJobs = history.filter(h => h.prediction === 'Fake Job').length;
    const highRisk = history.filter(h => h.risk_level === RiskLevel.HIGH).length;
    
    return {
      totalUsers: users.length,
      totalAnalyses: history.length,
      fakeJobsDetected: fakeJobs,
      highRiskPercentage: history.length ? Math.round((highRisk / history.length) * 100) : 0,
      riskDistribution: [
        { name: 'Low', value: history.filter(h => h.risk_level === RiskLevel.LOW).length },
        { name: 'Medium', value: history.filter(h => h.risk_level === RiskLevel.MEDIUM).length },
        { name: 'High', value: history.filter(h => h.risk_level === RiskLevel.HIGH).length },
      ]
    };
  }
};

// Seed admin if not exists
if (db.getUsers().length === 0) {
  db.saveUser({
    id: 'admin-001',
    username: 'admin',
    email: 'admin@fraudguard.ai',
    is_blocked: false,
    role: 'admin',
    created_at: new Date().toISOString()
  });
}
