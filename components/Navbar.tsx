
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
    { name: 'About Us', view: 'about' },
    { name: 'How It Works', view: 'how-it-works' },
    { name: 'Contact Us', view: 'contact' },
  ];

  return (
    <nav className="fixed w-full z-50 glass-morphism shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
            <i className="fas fa-shield-halved text-blue-600 text-2xl mr-2"></i>
            <span className="text-xl font-bold text-slate-800 tracking-tight">FraudGuard</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-6">
            {links.map((link) => (
              <button
                key={link.view}
                onClick={() => onNavigate(link.view)}
                className={`text-sm font-medium transition-colors ${
                  currentView === link.view ? 'text-blue-600' : 'text-slate-600 hover:text-blue-500'
                }`}
              >
                {link.name}
              </button>
            ))}
            
            <div className="h-6 w-px bg-slate-200"></div>

            {!user ? (
              <button 
                onClick={() => onNavigate('login')}
                className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition"
              >
                Login
              </button>
            ) : (
              <div className="relative">
                <button 
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-200 transition"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">
                    <i className="fas fa-user"></i>
                  </div>
                  <span className="text-sm font-bold text-slate-700">{user.username}</span>
                  <i className="fas fa-chevron-down text-[10px] text-slate-400"></i>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden py-1">
                    {user.role === 'admin' && (
                      <button onClick={() => { onNavigate('admin'); setProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-indigo-600 font-bold hover:bg-indigo-50">
                        <i className="fas fa-crown mr-2"></i> Admin Panel
                      </button>
                    )}
                    <button onClick={() => { onNavigate('history'); setProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <i className="fas fa-clock-rotate-left mr-2"></i> My History
                    </button>
                    <button onClick={() => { onNavigate('analyze'); setProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <i className="fas fa-magnifying-glass mr-2"></i> New Analysis
                    </button>
                    <hr className="my-1 border-slate-100" />
                    <button onClick={() => { onLogout(); setProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <i className="fas fa-sign-out-alt mr-2"></i> Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-slate-900 focus:outline-none"
            >
              <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 animate-slideDown">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {links.map((link) => (
              <button
                key={link.view}
                onClick={() => {
                  onNavigate(link.view);
                  setIsOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-blue-50 transition"
              >
                {link.name}
              </button>
            ))}
            {user && (
              <>
                <button onClick={() => { onNavigate('history'); setIsOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700">My History</button>
                {user.role === 'admin' && <button onClick={() => { onNavigate('admin'); setIsOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-indigo-600">Admin Panel</button>}
                <button onClick={() => { onLogout(); setIsOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600">Logout</button>
              </>
            )}
            {!user && <button onClick={() => { onNavigate('login'); setIsOpen(false); }} className="w-full mt-4 bg-blue-600 text-white px-3 py-3 rounded-md text-base font-semibold">Login</button>}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
