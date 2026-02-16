
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import InputModule from './components/InputModule';
import ResultsView from './components/ResultsView';
import AboutPage from './components/AboutPage';
import HowItWorks from './components/HowItWorks';
import ContactUs from './components/ContactUs';
import Testimonials from './components/Testimonials';
import SafetyAssistant from './components/SafetyAssistant';
import AuthPage from './components/AuthPage';
import HistoryTable from './components/HistoryTable';
import AdminDashboard from './components/AdminDashboard';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import { JobInputData, AnalysisResult, User, HistoryRecord } from './types';
import { analyzeJobOffer } from './geminiService';
import { db } from './db';

type View = 'home' | 'analyze' | 'results' | 'about' | 'how-it-works' | 'contact' | 'login' | 'history' | 'admin' | 'resume-analyzer';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(db.getCurrentUser());

  useEffect(() => {
    setCurrentUser(db.getCurrentUser());
  }, []);

  const handleStartAnalysis = () => {
    if (!currentUser) {
      setCurrentView('login');
    } else {
      setCurrentView('analyze');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalyze = async (data: JobInputData) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentView('results');

    try {
      const analysis = await analyzeJobOffer(data);
      setResult(analysis);

      if (currentUser) {
        const historyRecord: HistoryRecord = {
          id: Math.random().toString(36).substr(2, 9),
          userId: currentUser.id,
          job_title: data.title,
          company_name: data.company,
          prediction: analysis.result,
          confidence_score: analysis.confidence_score,
          risk_rate: analysis.risk_rate,
          risk_level: analysis.risk_level,
          created_at: new Date().toISOString(),
          explanations: analysis.explanations,
          safety_tips: analysis.safety_tips
        };
        db.saveHistory(historyRecord);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (view: View) => {
    if ((view === 'analyze' || view === 'history' || view === 'resume-analyzer') && !currentUser) {
      setCurrentView('login');
    } else {
      setCurrentView(view);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    db.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentView('home');
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <>
            <Hero onCtaClick={handleStartAnalysis} />
            <Testimonials />
            <HowItWorks />
          </>
        );
      case 'login':
        return <AuthPage onLogin={(user) => { setCurrentUser(user); setCurrentView('home'); }} />;
      case 'history':
        return (
          <div className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-black text-slate-800 mb-8">My History</h2>
            <div className="space-y-12">
               <div>
                 <h3 className="text-xl font-bold text-slate-700 mb-4">Job Fraud Analyses</h3>
                 <HistoryTable data={db.getUserHistory(currentUser?.id || '')} onRefresh={() => {}} />
               </div>
               <div>
                 <h3 className="text-xl font-bold text-slate-700 mb-4">Resume Match History</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {db.getUserResumeHistory(currentUser?.id || '').map(h => (
                      <div key={h.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                           <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{h.match_percentage}% Match</div>
                           <div className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleDateString()}</div>
                        </div>
                        <h4 className="font-bold text-slate-800 truncate">{h.job_title}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{h.suggestions[0]}</p>
                      </div>
                    ))}
                    {db.getUserResumeHistory(currentUser?.id || '').length === 0 && <p className="text-slate-400 italic text-sm">No resume matches yet.</p>}
                 </div>
               </div>
            </div>
          </div>
        );
      case 'admin':
        return currentUser?.role === 'admin' ? <AdminDashboard /> : <Hero onCtaClick={handleStartAnalysis} />;
      case 'resume-analyzer':
        return (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <ResumeAnalyzer userId={currentUser?.id || ''} />
          </div>
        );
      case 'analyze':
        return (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">Analyze Job Offer</h2>
            <InputModule onAnalyze={handleAnalyze} />
          </div>
        );
      case 'results':
        return (
          <ResultsView 
            loading={loading} 
            result={result} 
            error={error} 
            onReset={() => setCurrentView('analyze')} 
          />
        );
      case 'about':
        return <AboutPage />;
      case 'how-it-works':
        return <HowItWorks />;
      case 'contact':
        return <ContactUs />;
      default:
        return <Hero onCtaClick={handleStartAnalysis} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative">
      <Navbar 
        currentView={currentView} 
        onNavigate={navigateTo} 
        user={currentUser} 
        onLogout={handleLogout} 
      />
      <main className="flex-grow pt-16">
        {renderView()}
      </main>
      
      <SafetyAssistant />

      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <div className="flex items-center justify-center md:justify-start space-x-2 text-white mb-4">
              <i className="fas fa-shield-halved text-blue-500 text-2xl"></i>
              <span className="text-xl font-bold tracking-tight">FraudGuard</span>
            </div>
            <p className="text-sm">
              Protecting job seekers through AI-driven fraud detection and verifiable transparency.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigateTo('home')} className="hover:text-blue-400 transition">Home</button></li>
              <li><button onClick={() => navigateTo('about')} className="hover:text-blue-400 transition">About Us</button></li>
              <li><button onClick={() => navigateTo('contact')} className="hover:text-blue-400 transition">Contact Support</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Connect</h4>
            <div className="flex justify-center md:justify-start space-x-4">
              <a href="#" className="hover:text-white transition"><i className="fab fa-twitter"></i></a>
              <a href="#" className="hover:text-white transition"><i className="fab fa-linkedin"></i></a>
              <a href="#" className="hover:text-white transition"><i className="fab fa-github"></i></a>
            </div>
            <p className="mt-4 text-xs">© 2024 FraudGuard Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
