
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import InputModule from './components/InputModule';
import ResultsView from './components/ResultsView';
import AboutPage from './components/AboutPage';
import HowItWorks from './components/HowItWorks';
import ContactUs from './components/ContactUs';
import Testimonials from './components/Testimonials';
import SafetyAssistant from './components/SafetyAssistant';
import { JobInputData, AnalysisResult } from './types';
import { analyzeJobOffer } from './geminiService';

type View = 'home' | 'analyze' | 'results' | 'about' | 'how-it-works' | 'contact';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartAnalysis = () => {
    setCurrentView('analyze');
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
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (view: View) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <Navbar currentView={currentView} onNavigate={navigateTo} />
      <main className="flex-grow pt-16">
        {renderView()}
      </main>
      
      {/* Floating Chatbot Assistant */}
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
