
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

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users = db.getUsers();
    
    // The "Secret" login logic
    if (formData.adminSecret === 'admin123') {
      const adminUser = users.find(u => u.username === 'admin')!;
      db.setCurrentUser(adminUser);
      onLogin(adminUser);
    } else {
      setError('Invalid Administrative Access Key.');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateEmail(formData.forgotEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    const users = db.getUsers();
    const user = users.find(u => u.email === formData.forgotEmail);

    if (user) {
      setSuccess(`A password reset link has been sent to ${formData.forgotEmail}. Please check your inbox.`);
    } else {
      setError('No account found with that email address.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const users = db.getUsers();

    if (view === 'login') {
      if (!validateEmail(formData.email)) {
        setError('Please enter a valid email address.');
        return;
      }

      const user = users.find(u => u.email === formData.email);

      if (user && formData.password === user.password) {
        if (user.is_blocked) {
          setError('Your account has been blocked. Contact support.');
          return;
        }
        db.setCurrentUser(user);
        onLogin(user);
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } else if (view === 'signup') {
      // Validations
      if (!formData.username.trim()) {
        setError('Username is required.');
        return;
      }
      if (!validateEmail(formData.email)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      if (users.some(u => u.email === formData.email)) {
        setError('An account with this email already exists.');
        return;
      }
      
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
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-sm border border-blue-100">
            <i className="fas fa-key text-3xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Forgot Password?</h2>
          <p className="text-slate-500 mt-2 text-sm">Enter your registered email to receive a reset link.</p>
        </div>

        <form onSubmit={handleForgotSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center">
              <i className="fas fa-circle-exclamation mr-2"></i>
              {error}
            </div>
          )}
          {success && (
            <div className="p-3.5 bg-green-50 text-green-600 text-xs font-bold rounded-xl border border-green-100 flex items-center">
              <i className="fas fa-circle-check mr-2"></i>
              {success}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700">Email Address</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                <i className="fas fa-envelope"></i>
              </span>
              <input 
                required 
                type="email" 
                placeholder="name@example.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                value={formData.forgotEmail}
                onChange={e => setFormData({...formData, forgotEmail: e.target.value})}
              />
            </div>
          </div>

          <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 active:scale-95 transform">
            Send Reset Link
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => { setView('login'); setError(''); setSuccess(''); }} 
            className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline transition"
          >
            <i className="fas fa-arrow-left mr-2"></i> Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (view === 'admin-gate') {
    return (
      <div className="max-w-md mx-auto my-20 p-10 bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-8 duration-500 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 animate-pulse"></div>
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 text-white shadow-2xl shadow-blue-900/50">
            <i className="fas fa-user-shield text-3xl"></i>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Administrative Gateway</h2>
          <p className="text-slate-500 mt-2 text-xs font-bold uppercase tracking-widest">Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleAdminAuth} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-900/30 text-red-400 text-[10px] font-black uppercase rounded-xl border border-red-900/50 flex items-center">
              <i className="fas fa-lock mr-2"></i>
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Secret Access Key</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 text-sm">
                <i className="fas fa-terminal"></i>
              </span>
              <input 
                required 
                autoFocus
                type="password" 
                placeholder="••••••••••••"
                className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white font-mono placeholder-slate-700 transition-all"
                value={formData.adminSecret}
                onChange={e => setFormData({...formData, adminSecret: e.target.value})}
              />
            </div>
          </div>

          <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 transition shadow-2xl shadow-blue-900/40 active:scale-95 transform">
            Authenticate Session
          </button>
        </form>

        <div className="mt-10 text-center">
          <button 
            onClick={() => { setView('login'); setError(''); setFormData({...formData, adminSecret: ''}); }} 
            className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition"
          >
            <i className="fas fa-arrow-left mr-2"></i> Return to Public Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-sm border border-blue-100">
          <i className="fas fa-shield-halved text-3xl"></i>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{view === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="text-slate-500 mt-2 text-sm">{view === 'login' ? 'Login to access your dashboard' : 'Join FraudGuard to protect your career'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center">
            <i className="fas fa-circle-exclamation mr-2"></i>
            {error}
          </div>
        )}

        {view === 'signup' && (
          <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
            <label className="block text-sm font-bold text-slate-700">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                <i className="fas fa-user"></i>
              </span>
              <input 
                required 
                type="text" 
                placeholder="Choose a username"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
              />
            </div>
          </div>
        )}
        
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-700">Email Address</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              <i className="fas fa-envelope"></i>
            </span>
            <input 
              required 
              type="email" 
              placeholder="name@example.com"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-700">Password</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              <i className="fas fa-lock"></i>
            </span>
            <input 
              required 
              type={showPassword ? "text" : "password"} 
              placeholder="Enter password"
              className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 transition"
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>

        {view === 'signup' && (
          <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
            <label className="block text-sm font-bold text-slate-700">Confirm Password</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                <i className="fas fa-lock"></i>
              </span>
              <input 
                required 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder="Confirm password"
                className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 transition"
              >
                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>
        )}

        {view === 'login' && (
          <div className="flex justify-between items-center mt-2 px-1">
            <button 
              type="button"
              onClick={() => setView('forgot')}
              className="text-[10px] text-blue-600 font-bold hover:underline transition"
            >
              Forgot Password?
            </button>
            <button 
              type="button"
              onClick={() => setView('admin-gate')}
              className="text-[10px] text-slate-400 font-bold hover:text-blue-600 transition flex items-center"
            >
              <i className="fas fa-user-gear mr-1.5"></i> Admin Access
            </button>
          </div>
        )}

        <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 active:scale-95 transform">
          {view === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button 
          onClick={() => {
            setView(view === 'login' ? 'signup' : 'login');
            setError('');
            setSuccess('');
            setShowPassword(false);
            setShowConfirmPassword(false);
          }} 
          className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline transition"
        >
          {view === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
