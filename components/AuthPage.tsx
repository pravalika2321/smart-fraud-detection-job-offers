
import React, { useState } from 'react';
import { db } from '../db';
import { User } from '../types';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

type AuthView = 'login' | 'signup' | 'forgot' | 'admin-gate';

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    forgotEmail: '',
    adminSecret: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Admin access key check
    if (formData.adminSecret === 'admin123') {
      const users = db.getUsers();
      const adminUser = users.find(u => u.username === 'admin');
      if (adminUser) {
        db.setCurrentUser(adminUser);
        onLogin(adminUser);
      } else {
        setError('System error: Admin account not found.');
      }
    } else {
      setError('Access Denied: Invalid Administrative Key.');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!validateEmail(formData.forgotEmail)) { setError('Invalid email.'); return; }
    const user = db.getUsers().find(u => u.email === formData.forgotEmail);
    if (user) setSuccess(`Reset link sent to ${formData.forgotEmail}`);
    else setError('Account not found.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const users = db.getUsers();

    if (view === 'login') {
      if (!validateEmail(formData.email)) { setError('Invalid email.'); return; }
      const user = users.find(u => u.email === formData.email);
      if (user && formData.password === user.password) {
        if (user.is_blocked) { setError('Account suspended.'); return; }
        db.setCurrentUser(user);
        onLogin(user);
      } else setError('Invalid credentials.');
    } else if (view === 'signup') {
      if (!formData.username.trim()) { setError('Username required.'); return; }
      if (!validateEmail(formData.email)) { setError('Invalid email.'); return; }
      if (formData.password.length < 6) { setError('Password too short.'); return; }
      if (formData.password !== formData.confirmPassword) { setError('Mismatching passwords.'); return; }
      if (users.some(u => u.email === formData.email)) { setError('Email already registered.'); return; }
      
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        username: formData.username,
        email: formData.email,
        password: formData.password,
        is_blocked: false,
        role: 'user',
        created_at: new Date().toISOString()
      };
      db.saveUser(newUser);
      db.setCurrentUser(newUser);
      onLogin(newUser);
    }
  };

  if (view === 'forgot') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl shadow-2xl border border-slate-100 animate-in fade-in duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-sm border border-blue-100">
            <i className="fas fa-key text-3xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Recover Access</h2>
          <p className="text-slate-500 mt-2 text-sm">We'll send you a secure link to reset your credentials.</p>
        </div>
        <form onSubmit={handleForgotSubmit} className="space-y-5">
          {error && <div className="p-3.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">{error}</div>}
          {success && <div className="p-3.5 bg-green-50 text-green-600 text-xs font-bold rounded-xl border border-green-100">{success}</div>}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700">Registered Email</label>
            <input required type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition" value={formData.forgotEmail} onChange={e => setFormData({...formData, forgotEmail: e.target.value})} />
          </div>
          <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition">Send Link</button>
        </form>
        <button onClick={() => setView('login')} className="mt-6 w-full text-sm font-bold text-blue-600 hover:underline">Back to Login</button>
      </div>
    );
  }

  if (view === 'admin-gate') {
    return (
      <div className="max-w-md mx-auto my-20 p-10 bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-500 relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-500 border border-blue-600/30">
            <i className="fas fa-fingerprint text-3xl"></i>
          </div>
          <h2 className="text-xl font-black text-white tracking-widest uppercase mb-2">Security Override</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Platform Administrator Gateway</p>
        </div>
        <form onSubmit={handleAdminAuth} className="space-y-6">
          {error && <div className="p-4 bg-red-900/30 text-red-400 text-[10px] font-black uppercase rounded-xl border border-red-900/50">{error}</div>}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Admin Access Token</label>
            <input 
              required autoFocus type="password" 
              placeholder="Enter Administrative Key"
              className="w-full px-5 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white font-mono placeholder-slate-700" 
              value={formData.adminSecret} 
              onChange={e => setFormData({...formData, adminSecret: e.target.value})} 
            />
          </div>
          <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 transition shadow-2xl shadow-blue-900/40 active:scale-95">Elevate Privileges</button>
        </form>
        <button onClick={() => setView('login')} className="mt-8 w-full text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.2em]">Return to Public Portal</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-sm border border-blue-100">
          <i className={`fas ${view === 'login' ? 'fa-shield-halved' : 'fa-user-plus'} text-3xl`}></i>
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{view === 'login' ? 'Welcome Back' : 'Get Protected'}</h2>
        <p className="text-slate-500 mt-2 text-sm">{view === 'login' ? 'Access your personal security dashboard' : 'Join thousands of safe job seekers'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="p-3.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center"><i className="fas fa-circle-exclamation mr-2"></i>{error}</div>}
        {view === 'signup' && (
          <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"><i className="fas fa-user"></i></span>
              <input required type="text" placeholder="Choose a handle" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-medium" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Email Address</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"><i className="fas fa-envelope"></i></span>
            <input required type="email" placeholder="name@example.com" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-medium" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Security Password</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"><i className="fas fa-lock"></i></span>
            <input required type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-medium" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-blue-600 transition"><i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
          </div>
        </div>
        {view === 'signup' && (
          <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Confirm Password</label>
            <input required type={showConfirmPassword ? "text" : "password"} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition font-medium" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
          </div>
        )}
        {view === 'login' && (
          <div className="flex justify-between items-center mt-2 px-1">
            <button type="button" onClick={() => setView('forgot')} className="text-[10px] text-blue-600 font-black hover:underline uppercase tracking-wider">Forgot Link?</button>
            <button type="button" onClick={() => setView('admin-gate')} className="text-[10px] text-slate-400 font-black hover:text-blue-600 transition uppercase tracking-wider flex items-center"><i className="fas fa-fingerprint mr-1.5"></i> Admin Access</button>
          </div>
        )}
        <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-200 active:scale-[0.98] transform uppercase tracking-widest">
          {view === 'login' ? 'Verify & Enter' : 'Register Profile'}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-slate-100 pt-6">
        <button onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setError(''); setFormData({...formData, adminSecret: ''}); }} className="text-xs font-black text-blue-600 hover:text-blue-800 transition uppercase tracking-widest">
          {view === 'login' ? "New around here? Sign Up" : "Member already? Sign In"}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
