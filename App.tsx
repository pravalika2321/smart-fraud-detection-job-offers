
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
import { JobInputData, AnalysisResult, User, HistoryRecord, ResumeHistoryRecord } from './types';
import { analyzeJobOffer } from './geminiService';
import { db } from './db';

type View = 'home' | 'analyze' | 'results' | 'about' | 'how-it-works' | 'contact' | 'login' | 'history' | 'admin' | 'resume-analyzer';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(db.getCurrentUser());
  const [isQuotaError, setIsQuotaError] = useState(false);
  
  // State for reactive history updates
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [resumeRecords, setResumeRecords] = useState<ResumeHistoryRecord[]>([]);

  useEffect(() => {
    const user = db.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setHistoryRecords(db.getUserHistory(user.id));
      setResumeRecords(db.getUserResumeHistory(user.id));
    }
  }, [currentView]);

  const handleOpenSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio && window.aistudio.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setError(null);
      setIsQuotaError(false);
    }
  };

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
    setIsQuotaError(false);
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
          prediction: analysis.result as any,
          confidence_score: analysis.confidence_score,
          risk_rate: analysis.risk_rate,
          risk_level: analysis.risk_level,
          created_at: new Date().toISOString(),
          explanations: analysis.explanations,
          safety_tips: analysis.safety_tips
        };
        db.saveHistory(historyRecord);
        refreshData();
      }
    } catch (err: any) {
      const msg = err.message || 'An error occurred during analysis.';
      setError(msg);
      if (msg.includes('429') || msg.toLowerCase().includes('exhausted')) {
        setIsQuotaError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    if (currentUser) {
      setHistoryRecords(db.getUserHistory(currentUser.id));
      setResumeRecords(db.getUserResumeHistory(currentUser.id));
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

  const handleDeleteHistory = () => {
    refreshData();
  };

  const handleDeleteResume = (id: string) => {
    if (confirm('Permanently remove this resume match record?')) {
      db.deleteResumeHistory(id);
      refreshData();
    }
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
          <div className="max-w-6xl mx-auto px-4 py-12 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center">
              <i className="fas fa-clock-rotate-left mr-3 text-blue-600"></i>
              Account Activity
            </h2>
            <div className="space-y-12">
               <div>
                 <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center">
                   <i className="fas fa-shield-halved mr-2 text-blue-600"></i> Job Fraud History
                 </h3>
                 <HistoryTable data={historyRecords} onRefresh={handleDeleteHistory} />
               </div>
               <div>
                 <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center">
                   <i className="fas fa-file-invoice mr-2 text-blue-600"></i> Resume Match Records
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resumeRecords.map(h => (
                      <div key={h.id} className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all relative">
                        <div className="flex justify-between items-start mb-4">
                           <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{h.match_percentage}% Match</div>
                           <div className="flex items-center space-x-2">
                             <div className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleDateString()}</div>
                             <button 
                               onClick={() => handleDeleteResume(h.id)}
                               className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                             >
                               <i className="fas fa-trash-alt text-[10px]"></i>
                             </button>
                           </div>
                        </div>
                        <h4 className="font-bold text-slate-800 truncate pr-6">{h.job_title}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{h.optimized_summary}</p>
                        <div className="mt-4 flex items-center space-x-2">
                          <div className="flex-grow h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600" style={{ width: `${h.match_percentage}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {resumeRecords.length === 0 && (
                      <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <i className="fas fa-file-circle-question text-3xl text-slate-300 mb-3"></i>
                        <p className="text-slate-400 italic text-sm">No resume matches analyzed yet.</p>
                      </div>
                    )}
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
            <ResumeAnalyzer userId={currentUser?.id || ''} onComplete={refreshData} />
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
            isQuotaError={isQuotaError}
            onSelectKey={handleOpenSelectKey}
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
