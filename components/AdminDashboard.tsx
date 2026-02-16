
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { User } from '../types';
import HistoryTable from './HistoryTable';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'history'>('stats');
  const [stats, setStats] = useState(db.getStats());
  const [users, setUsers] = useState(db.getUsers());
  const [history, setHistory] = useState(db.getHistory());

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setStats(db.getStats());
    setUsers(db.getUsers());
    setHistory(db.getHistory());
  };

  const toggleBlockUser = (user: User) => {
    const updated = { ...user, is_blocked: !user.is_blocked };
    db.updateUser(updated);
    refreshData();
  };

  const deleteUser = (id: string) => {
    if (confirm('Permanently delete this user?')) {
      db.deleteUser(id);
      refreshData();
    }
  };

  const COLORS = ['#22c55e', '#facc15', '#ef4444'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Admin Control Center</h2>
          <p className="text-slate-500">Monitor platform activity and manage users.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['stats', 'users', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'stats' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Total Users" value={stats.totalUsers} icon="fa-users" color="text-blue-600" />
            <StatCard label="Analyses Run" value={stats.totalAnalyses} icon="fa-magnifying-glass-chart" color="text-purple-600" />
            <StatCard label="Fake Jobs Flagged" value={stats.fakeJobsDetected} icon="fa-shield-virus" color="text-red-600" />
            <StatCard label="High Risk Rate" value={`${stats.highRiskPercentage}%`} icon="fa-triangle-exclamation" color="text-orange-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Risk Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-slate-900 p-8 rounded-2xl shadow-xl text-white">
              <h3 className="text-xl font-bold mb-6">Security Insights</h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Common Fraud Keyword</div>
                   <div className="text-xl font-bold">"Equipment Fee"</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Model Consistency</div>
                   <div className="text-xl font-bold text-green-400">98.4%</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Admins</div>
                   <div className="text-xl font-bold">1/1 Online</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-5 duration-500">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{u.username}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center space-x-1.5 ${u.is_blocked ? 'text-red-500' : 'text-green-500'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${u.is_blocked ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <span className="text-xs font-bold">{u.is_blocked ? 'Blocked' : 'Active'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {u.username !== 'admin' && (
                      <>
                        <button 
                          onClick={() => toggleBlockUser(u)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${u.is_blocked ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                        >
                          {u.is_blocked ? 'Unblock' : 'Block'}
                        </button>
                        <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-300 hover:text-red-600">
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="animate-in slide-in-from-bottom-5 duration-500">
          <HistoryTable data={history} isAdmin={true} onRefresh={refreshData} />
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: { label: string, value: string | number, icon: string, color: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
    <div className="flex justify-between items-start">
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
        <div className={`text-3xl font-black ${color}`}>{value}</div>
      </div>
      <div className={`w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center ${color}`}>
        <i className={`fas ${icon} text-xl`}></i>
      </div>
    </div>
  </div>
);

export default AdminDashboard;
