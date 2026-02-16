
import React, { useState } from 'react';
import { db } from '../db';
import { User } from '../types';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', email: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const users = db.getUsers();
      // Simple auth simulation (password is same as username for demo except admin)
      const user = users.find(u => u.username === formData.username);
      
      if (formData.username === 'admin' && formData.password === 'admin123') {
        const adminUser = users.find(u => u.username === 'admin')!;
        db.setCurrentUser(adminUser);
        onLogin(adminUser);
        return;
      }

      if (user && formData.password === user.username) {
        if (user.is_blocked) {
          setError('Your account has been blocked. Contact support.');
          return;
        }
        db.setCurrentUser(user);
        onLogin(user);
      } else {
        setError('Invalid credentials. (Hint: use username as password)');
      }
    } else {
      const users = db.getUsers();
      if (users.some(u => u.username === formData.username)) {
        setError('Username already exists.');
        return;
      }
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        username: formData.username,
        email: formData.email,
        is_blocked: false,
        role: 'user',
        created_at: new Date().toISOString()
      };
      db.saveUser(newUser);
      db.setCurrentUser(newUser);
      onLogin(newUser);
    }
  };

  return (
    <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl shadow-2xl border border-slate-100">
      <div className="text-center mb-8">
        <i className="fas fa-shield-halved text-blue-600 text-4xl mb-4"></i>
        <h2 className="text-3xl font-bold text-slate-800">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="text-slate-500 mt-2">{isLogin ? 'Login to access your dashboard' : 'Join FraudGuard to protect your career'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Username</label>
          <input 
            required 
            type="text" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
            value={formData.username}
            onChange={e => setFormData({...formData, username: e.target.value})}
          />
        </div>

        {!isLogin && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
            <input 
              required 
              type="email" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
          <input 
            required 
            type="password" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
          {isLogin && <p className="text-[10px] text-slate-400 mt-1">Hint: For demo, use username as password. Admin: admin/admin123</p>}
        </div>

        <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
          {isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>

      <div className="mt-8 text-center text-sm">
        <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-bold hover:underline">
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
