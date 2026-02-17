
import React from 'react';
import { AnalysisResult, RiskLevel } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { db } from '../db';

interface ResultsViewProps {
  loading: boolean;
  result: AnalysisResult | null;
  error: string | null;
  isQuotaError?: boolean;
  onSelectKey?: () => void;
  onReset: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ loading, result, error, isQuotaError, onReset, onSelectKey }) => {
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
        <div className="mb-8 relative inline-block">
          <div className="w-20 h-20 md:w-24 md:h-24 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <i className="fas fa-shield-halved absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600 text-xl md:text-2xl"></i>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">Analyzing Job Offer...</h2>
        <div className="space-y-3 max-w-xs md:max-w-md mx-auto">
          <p className="text-sm md:text-base text-slate-500 animate-pulse">Consulting NLP models...</p>
          <p className="text-sm md:text-base text-slate-500 animate-pulse animation-delay-500">Scanning for suspicious patterns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 md:py-24 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-exclamation-triangle text-red-600 text-2xl md:text-3xl"></i>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">
          {isQuotaError ? "API Quota Exceeded" : "Analysis Failed"}
        </h2>
        <p className="text-sm md:text-base text-slate-600 mb-8 leading-relaxed">
          {isQuotaError 
            ? "The default shared API key has reached its usage limit. Please wait a moment or use your own paid API key to bypass this limit immediately."
            : error}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isQuotaError && onSelectKey && (
            <button 
              onClick={onSelectKey}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center"
            >
              <i className="fas fa-key mr-2"></i> Use My Own API Key
            </button>
          )}
          <button 
            onClick={onReset}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
          >
            {isQuotaError ? "Back to Scan" : "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  if (!result) return null;

  // Use Centralized Verdict logic for consistent UI
  const finalVerdict = db.getVerdictByRisk(result.risk_rate);
  const isDanger = finalVerdict === 'Fake Job';
  const isGenuine = finalVerdict === 'Genuine Job';
  
  const chartData = [
    { name: 'Risk', value: result.risk_rate },
    { name: 'Safety', value: 100 - result.risk_rate },
  ];
  
  const COLORS = isDanger ? ['#dc2626', '#f1f5f9'] : isGenuine ? ['#16a34a', '#f1f5f9'] : ['#facc15', '#f1f5f9'];

  const getRiskBadgeStyle = (risk: number) => {
    if (risk >= 70) return 'text-red-700 bg-red-50 border-red-200';
    if (risk <= 40) return 'text-green-700 bg-green-50 border-green-200';
    return 'text-yellow-700 bg-yellow-50 border-yellow-200';
  };

  const statusImage = isDanger 
    ? "https://images.unsplash.com/photo-1590479773265-7464e5d48118?auto=format&fit=crop&q=80&w=600&h=400"
    : "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=600&h=400";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden border-2 ${isDanger ? 'border-red-100' : isGenuine ? 'border-green-100' : 'border-yellow-100'}`}>
            <div className="h-48 md:h-56 w-full overflow-hidden relative">
              <img src={statusImage} alt="Status Visual" className="w-full h-full object-cover grayscale-[0.2]" />
              <div className={`absolute inset-0 bg-gradient-to-t ${isDanger ? 'from-red-600/95 via-red-600/80' : isGenuine ? 'from-green-600/95 via-green-600/80' : 'from-yellow-600/95 via-yellow-600/80'} to-transparent`}></div>
              <div className="absolute bottom-6 left-6 right-6">
                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border ${getRiskBadgeStyle(result.risk_rate)} shadow-lg`}>
                  {result.risk_rate >= 70 ? 'High' : result.risk_rate <= 40 ? 'Low' : 'Medium'} Risk Level
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-md leading-tight">
                  {finalVerdict}
                </h2>
              </div>
            </div>

            <div className="p-6 md:p-10">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-8">
                <div className="text-center sm:text-left">
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">AI Final Verdict</h3>
                  <p className="text-sm md:text-base text-slate-500 mt-2">
                    Analysis completed with <span className={`font-bold ${isDanger ? 'text-red-600' : isGenuine ? 'text-green-600' : 'text-yellow-600'}`}>{result.confidence_score}%</span> confidence.
                  </p>
                </div>
                <div className="w-40 h-40 md:w-48 md:h-48 relative flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={0}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="text-center">
                       <div className={`text-2xl md:text-3xl font-black ${isDanger ? 'text-red-600' : isGenuine ? 'text-green-600' : 'text-yellow-600'}`}>{result.risk_rate}%</div>
                       <div className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">Risk Factor</div>
                     </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-8 md:pt-10">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center">
                  <i className={`fas ${isDanger ? 'fa-triangle-exclamation text-red-600' : isGenuine ? 'fa-list-check text-green-600' : 'fa-circle-info text-yellow-600'} mr-3`}></i> 
                  Analysis Findings
                </h3>
                <div className="space-y-4">
                  {result.explanations.map((exp, i) => (
                    <div key={i} className={`flex items-start space-x-4 p-5 rounded-2xl border ${isDanger ? 'bg-red-50/50 border-red-100' : isGenuine ? 'bg-green-50/50 border-green-100' : 'bg-yellow-50/50 border-yellow-100'}`}>
                      <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${isDanger ? 'bg-red-600 text-white' : isGenuine ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>
                        <i className={`fas ${isDanger ? 'fa-times' : isGenuine ? 'fa-check' : 'fa-exclamation'} text-[10px]`}></i>
                      </div>
                      <p className="text-slate-700 leading-relaxed text-sm font-medium">{exp}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 md:p-10 text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700">
               <i className="fas fa-shield-halved text-8xl"></i>
             </div>
             <h3 className="text-xl md:text-2xl font-black mb-8 flex items-center text-blue-400">
               <i className="fas fa-user-shield mr-3"></i> FraudGuard Safety Plan
             </h3>
             <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
               {result.safety_tips.map((tip, i) => (
                 <li key={i} className="flex items-start space-x-4">
                   <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                   <span className="text-sm text-slate-300 font-medium leading-relaxed">{tip}</span>
                 </li>
               ))}
             </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-slate-100 sticky top-24">
             <h4 className="font-black text-slate-400 mb-6 uppercase text-[10px] tracking-[0.2em]">Next Steps</h4>
             <div className="space-y-4">
               <button onClick={() => window.print()} className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition group border border-slate-100">
                 <span className="text-sm font-bold text-slate-700">Save as PDF</span>
                 <i className="fas fa-file-pdf text-slate-400 group-hover:text-red-500 transition-colors"></i>
               </button>
               <button className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition group border border-slate-100">
                 <span className="text-sm font-bold text-slate-700">Share Results</span>
                 <i className="fas fa-share-nodes text-slate-400 group-hover:text-blue-500 transition-colors"></i>
               </button>
               <div className="pt-4">
                <button 
                  onClick={onReset}
                  className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-base shadow-xl shadow-blue-200 hover:bg-blue-700 transition active:scale-95 transform"
                 >
                  <i className="fas fa-plus mr-3"></i> New Analysis
                </button>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;
