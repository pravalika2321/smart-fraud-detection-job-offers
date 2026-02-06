
import React from 'react';
import { AnalysisResult, RiskLevel } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ResultsViewProps {
  loading: boolean;
  result: AnalysisResult | null;
  error: string | null;
  onReset: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ loading, result, error, onReset }) => {
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
      <div className="max-w-xl mx-auto px-4 py-16 md:py-24 text-center">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-exclamation-triangle text-red-600 text-2xl md:text-3xl"></i>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">Analysis Failed</h2>
        <p className="text-sm md:text-base text-slate-600 mb-8">{error}</p>
        <button 
          onClick={onReset}
          className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!result) return null;

  const isFake = result.result === 'Fake Job';
  const chartData = [
    { name: 'Risk', value: result.risk_rate },
    { name: 'Safety', value: 100 - result.risk_rate },
  ];
  const COLORS = isFake ? ['#ef4444', '#f1f5f9'] : ['#22c55e', '#f1f5f9'];

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.LOW: return 'text-green-600 bg-green-50';
      case RiskLevel.MEDIUM: return 'text-yellow-600 bg-yellow-50';
      case RiskLevel.HIGH: return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const statusImage = isFake 
    ? "https://images.unsplash.com/photo-1590479773265-7464e5d48118?auto=format&fit=crop&q=80&w=600&h=400"
    : "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=600&h=400";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="h-40 md:h-48 w-full overflow-hidden relative">
              <img src={statusImage} alt="Status Visual" className="w-full h-full object-cover" />
              <div className={`absolute inset-0 bg-gradient-to-t ${isFake ? 'from-red-900/70' : 'from-green-900/70'} to-transparent`}></div>
              <div className="absolute bottom-4 left-4 md:left-6 right-4">
                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${getRiskColor(result.risk_level)} shadow-sm`}>
                  {result.risk_level} Risk Level
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                  {result.result}
                </h2>
              </div>
            </div>

            <div className="p-5 md:p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-6">
                <div className="text-center sm:text-left">
                  <h3 className="text-lg md:text-xl font-bold text-slate-800">Final Verification</h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Our AI has concluded the analysis with a <span className="font-bold text-slate-800">{result.confidence_score}%</span> confidence score.
                  </p>
                </div>
                <div className="w-32 h-32 md:w-40 md:h-40 relative flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={60}
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
                       <div className={`text-lg md:text-xl font-bold ${isFake ? 'text-red-600' : 'text-green-600'}`}>{result.risk_rate}%</div>
                       <div className="text-[7px] md:text-[8px] text-slate-400 font-bold uppercase">Risk Rate</div>
                     </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 md:pt-8">
                <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-6 flex items-center">
                  <i className="fas fa-search text-blue-500 mr-2"></i> Explanation & Evidence
                </h3>
                <div className="space-y-4">
                  {result.explanations.map((exp, i) => (
                    <div key={i} className="flex items-start space-x-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${isFake ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        <i className={`fas ${isFake ? 'fa-times-circle' : 'fa-check-circle'} text-[10px]`}></i>
                      </div>
                      <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">{exp}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl">
             <h3 className="text-lg md:text-xl font-bold mb-6 flex items-center text-blue-400">
               <i className="fas fa-user-shield mr-2"></i> Safety Recommendations
             </h3>
             <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {result.safety_tips.map((tip, i) => (
                 <li key={i} className="flex items-start space-x-3 text-xs sm:text-sm text-slate-300">
                   <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                   <span>{tip}</span>
                 </li>
               ))}
             </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-5 md:p-6 border border-slate-100">
             <h4 className="font-bold text-slate-800 mb-4 uppercase text-[10px] tracking-widest">Next Actions</h4>
             <div className="space-y-3">
               <button className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition group">
                 <span className="text-sm font-semibold text-slate-700">Download Report</span>
                 <i className="fas fa-download text-slate-400 group-hover:text-blue-500"></i>
               </button>
               <button className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition group">
                 <span className="text-sm font-semibold text-slate-700">Share Analysis</span>
                 <i className="fas fa-share-nodes text-slate-400 group-hover:text-blue-500"></i>
               </button>
               <button 
                 onClick={onReset}
                 className="w-full mt-4 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                >
                 New Analysis
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;
