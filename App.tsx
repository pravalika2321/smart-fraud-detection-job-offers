
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
import InterviewPrep from './components/InterviewPrep';
import { JobInputData, AnalysisResult, User, HistoryRecord, ResumeHistoryRecord } from './types';
import { analyzeJobOffer } from './geminiService';
import { db } from './db';

type View = 'home' | 'analyze' | 'results' | 'about' | 'how-it-works' | 'contact' | 'login' | 'activity-history' | 'admin' | 'resume-analyzer' | 'interview-prep';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(db.getCurrentUser());
  const [isQuotaError, setIsQuotaError] = useState(false);
  
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [resumeRecords, setResumeRecords] = useState<ResumeHistoryRecord[]>([]);

  useEffect(() => {
    refreshData();
  }, [currentUser, currentView]);

  const refreshData = () => {
    const user = db.getCurrentUser();
    if (user) {
      setHistoryRecords(db.getUserHistory(user.id));
      setResumeRecords(db.getUserResumeHistory(user.id));
    }
  };

  const handleOpenSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio && window.aistudio.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setError(null);
      setIsQuotaError(false);
    }
  };

  const handleAnalyze = async (data: JobInputData) => {
    setLoading(true);
    setError(null);
    setCurrentView('results');
    try {
      const analysis = await analyzeJobOffer(data);
      // Strict risk mapping
      const verdict = db.getVerdictByRisk(analysis.risk_rate);
      const refinedResult: AnalysisResult = {
        ...analysis,
        result: verdict === 'Suspicious' ? analysis.result : verdict as any
      };
      
      setResult(refinedResult);
      if (currentUser) {
        const historyRecord: HistoryRecord = {
          id: Math.random().toString(36).substr(2, 9),
          userId: currentUser.id,
          job_title: data.title,
          company_name: data.company,
          prediction: refinedResult.result,
          confidence_score: refinedResult.confidence_score,
          risk_rate: refinedResult.risk_rate,
          risk_level: refinedResult.risk_level,
          category: refinedResult.risk_rate >= 70 ? 'fake' : refinedResult.risk_rate <= 40 ? 'genuine' : 'suspicious',
          created_at: new Date().toISOString(),
          explanations: refinedResult.explanations,
          safety_tips: refinedResult.safety_tips
        };
        db.saveHistory(historyRecord);
        refreshData();
      }
    } catch (err: any) {
      const msg = err.message || 'Error occurred.';
      setError(msg);
      if (msg.includes('429')) setIsQuotaError(true);
    } finally { setLoading(false); }
  };

  const handleClearHistory = () => {
    if (!currentUser) return;
    if (confirm("Are you sure you want to permanently delete all combined activity history and records?")) {
      db.clearUnifiedHistory(currentUser.id);
      setHistoryRecords([]);
      setResumeRecords([]);
      alert("All history cleared successfully.");
    }
  };

  const navigateTo = (view: View) => {
    if ((['analyze', 'activity-history', 'resume-analyzer', 'interview-prep'] as View[]).includes(view) && !currentUser) {
      setCurrentView('login');
    } else setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderView = () => {
    switch (currentView) {
      case 'home': return <><Hero onCtaClick={() => navigateTo('analyze')} /><Testimonials /><HowItWorks /></>;
      case 'login': return <AuthPage onLogin={(user) => { setCurrentUser(user); setCurrentView('home'); }} />;
      case 'activity-history': 
        return (
          <div className="max-w-6xl mx-auto px-4 py-12 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
               <div>
                  <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Unified Activity Logs</h2>
                  <p className="text-slate-500 font-medium">Combined records of Fraud Scans and Job Analyzer matches.</p>
               </div>
               <button 
                 onClick={handleClearHistory}
                 className="px-6 py-2.5 bg-red-50 text-red-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition shadow-sm border border-red-100 flex items-center"
               >
                 <i className="fas fa-trash-alt mr-2"></i> Clear History
               </button>
            </div>
            <HistoryTable data={historyRecords} resumeData={resumeRecords} onRefresh={refreshData} />
          </div>
        );
      case 'admin': return <AdminDashboard />;
      case 'resume-analyzer': return <div className="max-w-4xl mx-auto py-12"><ResumeAnalyzer userId={currentUser?.id || ''} onComplete={refreshData} /></div>;
      case 'interview-prep': return <div className="max-w-4xl mx-auto py-12"><InterviewPrep userId={currentUser?.id || ''} /></div>;
      case 'analyze': return <div className="max-w-4xl mx-auto py-12"><InputModule onAnalyze={handleAnalyze} /></div>;
      case 'results': return <ResultsView loading={loading} result={result} error={error} isQuotaError={isQuotaError} onSelectKey={handleOpenSelectKey} onReset={() => setCurrentView('analyze')} />;
      case 'about': return <AboutPage />;
      case 'how-it-works': return <HowItWorks />;
      case 'contact': return <ContactUs />;
      default: return <Hero onCtaClick={() => navigateTo('analyze')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar currentView={currentView} onNavigate={navigateTo} user={currentUser} onLogout={() => { db.setCurrentUser(null); setCurrentUser(null); setCurrentView('home'); }} />
      <main className="flex-grow pt-16">{renderView()}</main>
      <SafetyAssistant />
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div><div className="flex items-center justify-center md:justify-start text-white mb-4"><i className="fas fa-shield-halved text-blue-500 text-2xl mr-2"></i><span className="text-xl font-bold">FraudGuard</span></div><p className="text-sm">Advanced AI protection for the modern job seeker.</p></div>
          <div><h4 className="text-white font-semibold mb-4">Quick Links</h4><ul className="space-y-2 text-sm"><li><button onClick={() => navigateTo('about')}>About Us</button></li><li><button onClick={() => navigateTo('how-it-works')}>Our Process</button></li></ul></div>
          <div><h4 className="text-white font-semibold mb-4">Support</h4><p className="text-xs">© 2024 FraudGuard. All detections verified by Gemini.</p></div>
        </div>
      </footer>
    </div>
  );
};

export default App;
