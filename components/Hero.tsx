
import React from 'react';

interface HeroProps {
  onCtaClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onCtaClick }) => {
  return (
    <section className="relative overflow-hidden bg-white py-12 md:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="z-10 text-center lg:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-6">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>AI-Powered Security</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            Detect Fake Jobs Before <span className="text-blue-600 underline decoration-blue-200">They Catch You.</span>
          </h1>
          <p className="text-base md:text-lg text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0">
            Secure your future. Use our production-ready AI to analyze job listings, internship offers, and recruitment emails in seconds.
          </p>
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={onCtaClick}
              className="px-6 md:px-8 py-3 md:py-4 bg-blue-600 text-white rounded-xl font-bold text-base md:text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200 transform hover:-translate-y-1 active:scale-95"
            >
              <i className="fas fa-search-plus mr-2"></i> Analyze Job Offer
            </button>
            <button className="px-6 md:px-8 py-3 md:py-4 bg-slate-100 text-slate-800 rounded-xl font-bold text-base md:text-lg hover:bg-slate-200 transition active:scale-95">
              How It Works
            </button>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6 text-slate-400">
            <div className="flex items-center space-x-2">
              <i className="fas fa-check-circle text-green-500"></i>
              <span className="text-xs md:text-sm">NLP Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-check-circle text-green-500"></i>
              <span className="text-xs md:text-sm">Instant Scoring</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-check-circle text-green-500"></i>
              <span className="text-xs md:text-sm">Risk Assessment</span>
            </div>
          </div>
        </div>

        <div className="relative group mt-8 lg:mt-0 px-4 sm:px-0">
          <div className="absolute top-0 -left-4 w-48 md:w-72 h-48 md:h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-48 md:w-72 h-48 md:h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
          
          <div className="relative">
            <div className="relative rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl border-4 md:border-8 border-white/50 transform rotate-1 group-hover:rotate-0 transition-transform duration-700">
              <img 
                src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1000&h=700" 
                alt="Workspace" 
                className="w-full h-auto object-cover scale-105 group-hover:scale-100 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/20 to-transparent"></div>
            </div>

            <div className="absolute -bottom-4 md:-bottom-6 -left-4 md:-left-12 max-w-[200px] sm:max-w-[260px] md:max-w-[320px] bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-2xl shadow-blue-900/10 border border-slate-100 animate-float">
               <div className="flex flex-col space-y-1 md:space-y-2">
                 <h3 className="text-lg sm:text-xl md:text-3xl font-extrabold text-slate-800">
                   99.2% Accuracy
                 </h3>
                 <p className="text-[10px] sm:text-xs md:text-base text-slate-500 leading-relaxed font-medium">
                   Validated against confirmed job scams and fake listings.
                 </p>
               </div>
               <div className="mt-2 md:mt-4 flex items-center space-x-2 text-blue-600 font-bold text-[8px] md:text-xs uppercase tracking-widest">
                  <i className="fas fa-shield-check"></i>
                  <span>Verified System</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
