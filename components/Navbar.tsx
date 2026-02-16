
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

  const getInitials = (username: string) => {
    if (!username) return '??';
    
    // Admin special case
    if (username === 'admin') return 'AD';
    
    // Get the part before @ if it's an email
    const namePart = username.split('@')[0];
    
    // Split by common delimiters (dot, underscore, hyphen)
    const parts = namePart.split(/[\._-]/);
    
    if (parts.length >= 2) {
      // Return first letter of first two parts (e.g. pravalika.palipe -> PP)
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    
    // If it's a single word, return first two characters (e.g. pravalika -> PR)
    // Or if the user specifically asked for "pravalikapalipe" to be "PP", 
    // we can assume they might want initials from capitalization if it existed,
    // but here we'll just take the first two chars for single words.
    return namePart.substring(0, 2).toUpperCase();
  };

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
                  className="flex items-center space-x-2 bg-blue-50 px-2.5 py-1.5 rounded-full hover:bg-blue-100 transition border border-blue-100 shadow-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black tracking-tighter">
                    {getInitials(user.username)}
                  </div>
                  <span className="text-xs font-bold text-slate-700 max-w-[150px] truncate">
                    {user.username}
                  </span>
                  <i className={`fas fa-chevron-down text-[10px] text-slate-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`}></i>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Signed in as</p>
                      <p className="text-xs font-bold text-slate-700 truncate">{user.email}</p>
                    </div>
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
                <div className="px-3 py-2 mt-2 border-t border-slate-50">
                   <div className="flex items-center space-x-3 mb-2">
                     <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                       {getInitials(user.username)}
                     </div>
                     <span className="text-sm font-bold text-slate-700 truncate">{user.username}</span>
                   </div>
                </div>
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
