
import React, { useState } from 'react';
import { User } from '../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: any) => void;
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const links = [
    { name: 'Home', view: 'home' },
    { name: 'Scan Job', view: 'analyze' },
    { name: 'Resume AI', view: 'resume-analyzer' },
    { name: 'About Us', view: 'about' },
    { name: 'How It Works', view: 'how-it-works' },
    { name: 'Contact', view: 'contact' },
  ];

  const getInitials = (username: string) => {
    if (!username) return '??';
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="fixed w-full z-50 glass-morphism shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
            <i className="fas fa-shield-halved text-blue-600 text-2xl mr-2"></i>
            <span className="text-xl font-bold text-slate-800 tracking-tight">FraudGuard</span>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {links.map((link) => (
              <button
                key={link.view}
                onClick={() => onNavigate(link.view)}
                className={`text-sm font-bold transition-colors ${
                  currentView === link.view ? 'text-blue-600' : 'text-slate-600 hover:text-blue-500'
                }`}
              >
                {link.name}
              </button>
            ))}
            
            <div className="h-6 w-px bg-slate-200"></div>

            {!user ? (
              <button onClick={() => onNavigate('login')} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-black hover:bg-blue-700 transition shadow-lg shadow-blue-200 uppercase tracking-tighter">Login</button>
            ) : (
              <div className="relative">
                <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-xl hover:bg-slate-200 transition border border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">{getInitials(user.username)}</div>
                  <span className="text-xs font-bold text-slate-700 max-w-[120px] truncate">{user.username}</span>
                  <i className={`fas fa-chevron-down text-[10px] transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`}></i>
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden py-1 animate-in zoom-in-95 duration-200 origin-top-right">
                    <div className="px-5 py-4 border-b border-slate-50">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Signed in as</div>
                      <div className="text-xs font-bold text-slate-800 truncate">{user.email}</div>
                    </div>
                    
                    <div className="p-1.5">
                      <button onClick={() => { onNavigate('analyze'); setProfileMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center">
                        <i className="fas fa-magnifying-glass-location mr-3 text-blue-600 w-4"></i> 
                        Analyze Job Offer
                      </button>

                      <button onClick={() => { onNavigate('activity-history'); setProfileMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center">
                        <i className="fas fa-clock-rotate-left mr-3 text-blue-600 w-4"></i> 
                        Activity History
                      </button>

                      <button onClick={() => { onNavigate('interview-prep'); setProfileMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center">
                        <i className="fas fa-graduation-cap mr-3 text-purple-600 w-4"></i> 
                        Interview Prep
                      </button>

                      {user.role === 'admin' && (
                        <button onClick={() => { onNavigate('admin'); setProfileMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center">
                          <i className="fas fa-user-shield mr-3 text-indigo-600 w-4"></i> 
                          Admin Panel
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-50 p-1.5 mt-1">
                      <button onClick={() => { onLogout(); setProfileMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl font-bold transition-colors flex items-center">
                        <i className="fas fa-sign-out-alt mr-3 w-4"></i> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 hover:text-slate-900 focus:outline-none"><i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i></button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass-morphism border-t border-slate-100 p-4 space-y-2 animate-in slide-in-from-top-2">
          {links.map((link) => (
            <button key={link.view} onClick={() => { onNavigate(link.view); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all">
              {link.name}
            </button>
          ))}
          {!user ? (
            <button onClick={() => { onNavigate('login'); setIsOpen(false); }} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-sm shadow-lg shadow-blue-200">Login</button>
          ) : (
            <>
              <div className="h-px bg-slate-100 my-2"></div>
              <button onClick={() => { onNavigate('analyze'); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600">Analyze Job Offer</button>
              <button onClick={() => { onNavigate('activity-history'); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600">Activity History</button>
              <button onClick={() => { onNavigate('interview-prep'); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600">Interview Prep</button>
              <button onClick={() => { onLogout(); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600">Logout</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
