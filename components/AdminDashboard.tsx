
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { User, RiskLevel } from '../types';
import HistoryTable from './HistoryTable';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'history'>('stats');
  const [stats, setStats] = useState(db.getStats());
  const [users, setUsers] = useState(db.getUsers());
  const [history, setHistory] = useState(db.getHistory());
  const [resumeHistory, setResumeHistory] = useState(db.getResumeHistory());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setStats(db.getStats());
    setUsers(db.getUsers());
    setHistory(db.getHistory());
    setResumeHistory(db.getResumeHistory());
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || u.role === filterRole;
      const matchesStatus = filterStatus === 'all' || 
                            (filterStatus === 'active' && !u.is_blocked) || 
                            (filterStatus === 'blocked' && u.is_blocked);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, filterRole, filterStatus]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Username', 'Email', 'Role', 'Status', 'Analyses', 'Joined Date'];
    const rows = filteredUsers.map(u => [
      u.id, u.username, u.email, u.role, u.is_blocked ? 'Blocked' : 'Active', u.analyses_count || 0, new Date(u.created_at).toLocaleDateString()
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FraudGuard_System_Users_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleBulkAction = (action: 'block' | 'unblock' | 'delete') => {
    if (selectedUsers.length === 0) return;
    if (action === 'delete' && !confirm(`Permanently delete ${selectedUsers.length} users?`)) return;

    selectedUsers.forEach(id => {
      const u = users.find(user => user.id === id);
      if (u && u.username !== 'admin') {
        if (action === 'delete') db.deleteUser(id);
        else db.updateUser({ ...u, is_blocked: action === 'block' });
      }
    });
    
    setSelectedUsers([]);
    refreshData();
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="flex h-full min-h-[calc(100vh-64px)] bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden lg:flex flex-col">
        <div className="p-8 border-b border-slate-800/50">
          <div className="flex items-center space-x-3 text-white">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
               <i className="fas fa-crown"></i>
             </div>
             <div>
                <span className="font-black tracking-tight text-lg block leading-none">Admin</span>
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Master Panel</span>
             </div>
          </div>
        </div>
        
        <nav className="flex-grow p-4 space-y-2 mt-4">
          <SidebarLink icon="fa-chart-pie" label="Overview" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
          <SidebarLink icon="fa-users-gear" label="Management" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <SidebarLink icon="fa-list-check" label="System Audit" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          
          <div className="mt-12 px-4 space-y-6">
             <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Platform Resources</div>
             <HealthBar label="Gemini API" status="Online" color="bg-green-500" value={100} />
             <HealthBar label="Storage" status="8% used" color="bg-blue-500" value={8} />
             <HealthBar label="Auth Server" status="Active" color="bg-green-500" value={100} />
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 lg:p-12 overflow-y-auto">
        <div className="mb-10 flex flex-col sm:flex-row justify-between items-end sm:items-center gap-6">
           <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
                {activeTab === 'stats' ? 'Platform Health' : activeTab === 'users' ? 'User Directory' : 'Audit Logs'}
              </h2>
              <p className="text-slate-500 font-medium">Monitoring {stats.totalUsers} registered professionals.</p>
           </div>
           
           <div className="flex items-center space-x-3">
              <button onClick={refreshData} className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition shadow-sm active:scale-95">
                 <i className="fas fa-rotate"></i>
              </button>
              {activeTab === 'users' && (
                <button onClick={handleExportCSV} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-lg flex items-center">
                  <i className="fas fa-download mr-2"></i> Export Data
                </button>
              )}
           </div>
        </div>

        {activeTab === 'stats' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
               <KpiCard label="Registrations" value={stats.totalUsers} sub={`+${stats.newUsersToday} New`} color="text-blue-600" icon="fa-user-plus" />
               <KpiCard label="Total Scans" value={stats.totalAnalyses} sub="Combined" color="text-indigo-600" icon="fa-microchip" />
               <KpiCard label="Fake Detected" value={stats.fakeJobsDetected} sub="Verified Scams" color="text-red-600" icon="fa-skull" />
               <KpiCard label="Avg Confidence" value="99.4%" sub="NLP Success" color="text-green-600" icon="fa-shield-heart" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
               <div className="xl:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                  <h3 className="text-xl font-bold text-slate-900 mb-8">System Usage Trend</h3>
                  <div className="h-80 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.growthTrend}>
                           <defs>
                              <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                 <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                           <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                           <Area type="monotone" dataKey="scans" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-8 text-center lg:text-left">Risk Matrix</h3>
                  <div className="flex-grow">
                    <ResponsiveContainer width="100%" height="250">
                      <PieChart>
                        <Pie data={stats.riskDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                          {stats.riskDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-8 p-6 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between">
                     <div className="text-xs font-black text-red-900 uppercase">Critical Threats</div>
                     <div className="text-2xl font-black text-red-600">{stats.highRiskPercentage}%</div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6">
               <div className="relative w-full lg:w-96">
                  <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input 
                    type="text" 
                    placeholder="Search master user records..."
                    className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>
               
               <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <select value={filterRole} onChange={e => setFilterRole(e.target.value as any)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600">
                    <option value="all">Roles (All)</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  {selectedUsers.length > 0 && (
                    <button onClick={() => handleBulkAction('delete')} className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-red-200">Delete ({selectedUsers.length})</button>
                  )}
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em]">
                    <th className="px-8 py-5">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300"
                        onChange={(e) => setSelectedUsers(e.target.checked ? filteredUsers.map(u => u.id) : [])}
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      />
                    </th>
                    <th className="px-8 py-5">User Profile</th>
                    <th className="px-8 py-5">Role</th>
                    <th className="px-8 py-5 text-center">Analyses</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-300"
                          checked={selectedUsers.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedUsers([...selectedUsers, u.id]);
                            else setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                          }}
                        />
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs uppercase">
                              {u.username.substring(0, 2)}
                            </div>
                            <div>
                               <div className="text-sm font-bold text-slate-800">{u.username}</div>
                               <div className="text-[10px] text-slate-500 font-medium">{u.email}</div>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                         <span className="text-xs font-black text-slate-600">{u.analyses_count || 0}</span>
                      </td>
                      <td className="px-8 py-5">
                         <span className={`w-2 h-2 inline-block rounded-full mr-2 ${u.is_blocked ? 'bg-red-500' : 'bg-green-500'}`}></span>
                         <span className="text-[10px] font-black uppercase text-slate-500">{u.is_blocked ? 'Suspended' : 'Active'}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          disabled={u.username === 'admin'}
                          onClick={() => { if(confirm('Delete user?')) { db.deleteUser(u.id); refreshData(); } }}
                          className="w-9 h-9 bg-slate-100 text-slate-400 flex items-center justify-center rounded-xl hover:bg-red-600 hover:text-white transition disabled:opacity-20"
                        >
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <HistoryTable data={history} resumeData={resumeHistory} isAdmin={true} onRefresh={refreshData} />
          </div>
        )}
      </main>
    </div>
  );
};

const SidebarLink = ({ icon, label, active, onClick }: { icon: string, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/50' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}
  >
    <i className={`fas ${icon} text-lg w-6`}></i>
    <span>{label}</span>
  </button>
);

const HealthBar = ({ label, status, color, value }: { label: string, status: string, color: string, value: number }) => (
  <div className="space-y-1.5">
     <div className="flex justify-between text-[8px] font-black uppercase text-slate-500 tracking-widest">
        <span>{label}</span>
        <span>{status}</span>
     </div>
     <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{width: `${value}%`}}></div>
     </div>
  </div>
);

const KpiCard = ({ label, value, sub, color, icon }: { label: string, value: string | number, sub: string, color: string, icon: string }) => (
  <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 flex items-center space-x-6 hover:-translate-y-1 transition-all duration-300">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-slate-50 ${color} shadow-inner`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-2xl font-black ${color} tracking-tighter`}>{value}</div>
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{sub}</div>
    </div>
  </div>
);

export default AdminDashboard;
