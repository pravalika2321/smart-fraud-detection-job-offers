
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
  
  // Table state
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
    link.setAttribute("href", url);
    link.setAttribute("download", `FraudGuard_Users_Export_${new Date().toISOString().split('T')[0]}.csv`);
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

  const toggleBlockUser = (user: User) => {
    if (user.username === 'admin') return;
    const updated = { ...user, is_blocked: !user.is_blocked };
    db.updateUser(updated);
    refreshData();
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="flex h-full min-h-[calc(100vh-64px)] bg-slate-50">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-slate-800">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
               <i className="fas fa-crown text-sm"></i>
             </div>
             <span className="font-black tracking-tight text-lg">Admin Center</span>
          </div>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          <SidebarLink icon="fa-chart-pie" label="System Overview" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
          <SidebarLink icon="fa-users-gear" label="User Management" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <SidebarLink icon="fa-shield-heart" label="Activity Logs" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          <div className="pt-8 px-4">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Platform Health</div>
             <div className="space-y-4">
                <HealthBar label="API Engine" status="Healthy" color="bg-green-500" />
                <HealthBar label="Database" status="98.2% cap" color="bg-blue-500" />
                <HealthBar label="CDN" status="Optimal" color="bg-green-500" />
             </div>
          </div>
        </nav>
      </aside>

      {/* Main Dashboard Area */}
      <main className="flex-grow p-6 md:p-10 overflow-y-auto">
        {/* Header Stats Bar */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                {activeTab === 'stats' && "Dashboard Overview"}
                {activeTab === 'users' && "User Directory"}
                {activeTab === 'history' && "Global Audit Trail"}
              </h2>
              <p className="text-slate-500 font-medium text-sm">Real-time platform metrics and monitoring.</p>
           </div>
           
           <div className="flex items-center space-x-3">
              <button onClick={refreshData} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition shadow-sm">
                 <i className="fas fa-rotate"></i>
              </button>
              {activeTab === 'users' && (
                <button onClick={handleExportCSV} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center hover:bg-slate-800 transition shadow-lg">
                  <i className="fas fa-file-csv mr-2"></i> Export CSV
                </button>
              )}
           </div>
        </div>

        {activeTab === 'stats' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
               <KpiCard label="Total Userbase" value={stats.totalUsers} sub={`+${stats.newUsersToday} Today`} color="text-blue-600" icon="fa-users" />
               <KpiCard label="Jobs Analyzed" value={stats.totalAnalyses} sub="Lifetime Scans" color="text-indigo-600" icon="fa-magnifying-glass-chart" />
               <KpiCard label="Fraud Caught" value={stats.fakeJobsDetected} sub="Verified Scams" color="text-red-600" icon="fa-skull-crossbones" />
               <KpiCard label="Platform Accuracy" value="99.2%" sub="NLP Confidence" color="text-green-600" icon="fa-bolt" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
               {/* Growth Chart */}
               <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                  <h3 className="text-xl font-bold text-slate-900 mb-8">Platform Traffic Trend</h3>
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

               {/* Risk Mix */}
               <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                  <h3 className="text-xl font-bold text-slate-900 mb-8">Threat Landscape</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
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
                  <div className="mt-8 space-y-4">
                     <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                        <span className="text-xs font-bold text-slate-600">High Risk Alerts</span>
                        <span className="text-sm font-black text-red-600">{stats.highRiskPercentage}%</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-5 duration-700">
            {/* Table Controls */}
            <div className="p-6 md:p-8 bg-slate-50/50 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6">
               <div className="relative w-full lg:w-96">
                  <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input 
                    type="text" 
                    placeholder="Search by name, email or ID..."
                    className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>
               
               <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <select 
                    value={filterRole} 
                    onChange={e => setFilterRole(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">All Roles</option>
                    <option value="user">Users</option>
                    <option value="admin">Admins</option>
                  </select>
                  <select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                  
                  {selectedUsers.length > 0 && (
                    <div className="flex items-center space-x-2 animate-in zoom-in-95">
                      <button onClick={() => handleBulkAction('block')} className="px-3 py-2 bg-yellow-50 text-yellow-700 text-[10px] font-black uppercase rounded-lg border border-yellow-200 hover:bg-yellow-100 transition">Block ({selectedUsers.length})</button>
                      <button onClick={() => handleBulkAction('delete')} className="px-3 py-2 bg-red-50 text-red-700 text-[10px] font-black uppercase rounded-lg border border-red-200 hover:bg-red-100 transition">Delete ({selectedUsers.length})</button>
                    </div>
                  )}
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                    <th className="px-8 py-5">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                        onChange={(e) => setSelectedUsers(e.target.checked ? filteredUsers.map(u => u.id) : [])}
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      />
                    </th>
                    <th className="px-8 py-5">Profile</th>
                    <th className="px-8 py-5">Platform Role</th>
                    <th className="px-8 py-5 text-center">Analyses</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center">
                           <i className="fas fa-user-slash text-4xl text-slate-200 mb-4"></i>
                           <p className="text-slate-400 font-bold italic">No matching users found.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u.id} className={`group hover:bg-slate-50/80 transition-colors ${selectedUsers.includes(u.id) ? 'bg-blue-50/30' : ''}`}>
                        <td className="px-8 py-5">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedUsers.includes(u.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedUsers([...selectedUsers, u.id]);
                              else setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                            }}
                          />
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs border border-slate-200 uppercase">
                                {u.username.substring(0, 2)}
                              </div>
                              <div>
                                 <div className="text-sm font-bold text-slate-800">{u.username}</div>
                                 <div className="text-xs text-slate-500">{u.email}</div>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-600'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                           <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-black text-xs">
                             {u.analyses_count || 0}
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center space-x-2">
                             <div className={`w-2 h-2 rounded-full ${u.is_blocked ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                             <span className="text-xs font-bold text-slate-600">{u.is_blocked ? 'Blocked' : 'Active'}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {u.username !== 'admin' && (
                              <>
                                <button 
                                  onClick={() => toggleBlockUser(u)}
                                  className={`w-9 h-9 flex items-center justify-center rounded-xl transition ${u.is_blocked ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}
                                  title={u.is_blocked ? "Unblock User" : "Block User"}
                                >
                                  <i className={`fas ${u.is_blocked ? 'fa-user-check' : 'fa-user-slash'} text-xs`}></i>
                                </button>
                                <button 
                                  onClick={() => { if(confirm('Delete user?')) { db.deleteUser(u.id); refreshData(); } }}
                                  className="w-9 h-9 bg-red-50 text-red-600 flex items-center justify-center rounded-xl hover:bg-red-600 hover:text-white transition"
                                  title="Permanent Delete"
                                >
                                  <i className="fas fa-trash-alt text-xs"></i>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in slide-in-from-bottom-5 duration-700">
            <HistoryTable data={history} isAdmin={true} onRefresh={refreshData} />
          </div>
        )}
      </main>
    </div>
  );
};

const SidebarLink = ({ icon, label, active, onClick }: { icon: string, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
  >
    <i className={`fas ${icon} text-lg ${active ? 'text-white' : 'text-slate-300'}`}></i>
    <span>{label}</span>
  </button>
);

const HealthBar = ({ label, status, color }: { label: string, status: string, color: string }) => (
  <div className="space-y-1">
     <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 tracking-wider">
        <span>{label}</span>
        <span>{status}</span>
     </div>
     <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{width: '90%'}}></div>
     </div>
  </div>
);

const KpiCard = ({ label, value, sub, color, icon }: { label: string, value: string | number, sub: string, color: string, icon: string }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex items-center space-x-6 hover:translate-y-[-4px] transition-transform duration-300">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-slate-50 ${color} shadow-inner`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-2xl font-black ${color} tracking-tight`}>{value}</div>
      <div className="text-[10px] font-bold text-slate-400 mt-1 italic">{sub}</div>
    </div>
  </div>
);

export default AdminDashboard;
