
import React, { useState, useCallback } from 'react';
import { ResumeAnalysisResult } from '../types';
import { analyzeResume } from '../geminiService';
import { db } from '../db';
import { PieChart, Pie, Cell, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

interface ResumeAnalyzerProps {
  userId: string;
  onComplete?: () => void;
}

const ResumeAnalyzer: React.FC<ResumeAnalyzerProps> = ({ userId, onComplete }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [resumeImage, setResumeImage] = useState<string | null>(null);
  const [jdImage, setJdImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeAnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'resume' | 'jd') => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file, type);
  };

  const processFile = async (file: File, type: 'resume' | 'jd') => {
    if (file.type.startsWith('image/')) {
      const b64 = await fileToBase64(file);
      if (type === 'resume') setResumeImage(b64); else setJdImage(b64);
    } else if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (type === 'resume') setResumeText(text); else setJobDesc(text);
      };
      reader.readAsText(file);
    } else {
      alert("Format not directly supported. Gemini will attempt OCR on images, or you can paste the text.");
    }
  };

  const onDrag = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(id);
    else if (e.type === "dragleave") setDragActive(null);
  };

  const onDrop = async (e: React.DragEvent, type: 'resume' | 'jd') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file, type);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!resumeText && !resumeImage) || (!jobDesc && !jdImage) || !jobTitle) {
      alert("Please provide both Resume and Job Description (Text or Image).");
      return;
    }

    setLoading(true);
    try {
      const analysis = await analyzeResume(resumeText, jobDesc, resumeImage || undefined, jdImage || undefined);
      setResult(analysis);
      
      // Fix: Added missing 'category' property to satisfy the ResumeHistoryRecord type requirements.
      db.saveResumeHistory({
        ...analysis,
        id: Math.random().toString(36).substr(2, 9),
        userId,
        job_title: jobTitle,
        category: db.getCategoryByRisk(analysis.fraud_risk_score),
        created_at: new Date().toISOString()
      });
      onComplete?.();
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please check your internet connection or try a different input.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-32 text-center animate-in fade-in zoom-in-95 duration-700">
        <div className="relative inline-block mb-12">
          <div className="w-28 h-28 border-[6px] border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto shadow-xl"></div>
          <i className="fas fa-microchip absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 text-3xl"></i>
        </div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-4">Industrial NLP Processing...</h2>
        <div className="flex flex-col items-center space-y-2 text-slate-500 font-bold uppercase tracking-widest text-xs">
           <span className="animate-pulse">Extracting Semantic Entities</span>
           <span className="animate-pulse delay-150">Calculating ATS Vector Distance</span>
           <span className="animate-pulse delay-300">Checking Recruitment Authenticity</span>
        </div>
      </div>
    );
  }

  if (result) {
    const pieData = [
      { name: 'Match', value: result.match_percentage },
      { name: 'Gap', value: 100 - result.match_percentage }
    ];

    const radarData = [
      { subject: 'ATS Score', A: result.ats_score, fullMark: 100 },
      { subject: 'Readability', A: result.readability_score, fullMark: 100 },
      { subject: 'Keywords', A: result.keyword_density, fullMark: 100 },
      { subject: 'Strength', A: result.strength_score * 10, fullMark: 100 },
      { subject: 'Match', A: result.match_percentage, fullMark: 100 },
    ];

    return (
      <div className="max-w-7xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Fraud Warning / Genuine Badge */}
        <div className={`mb-8 p-6 rounded-3xl border-2 flex items-center justify-between shadow-lg ${result.is_genuine_job ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800 animate-pulse'}`}>
           <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${result.is_genuine_job ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                <i className={`fas ${result.is_genuine_job ? 'fa-check-double' : 'fa-triangle-exclamation'}`}></i>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">
                  {result.is_genuine_job ? 'Authentic Job Offer' : 'Potential Recruitment Fraud'}
                </h3>
                <p className="text-sm font-medium opacity-80">{result.fraud_verdict}</p>
              </div>
           </div>
           <div className="text-right hidden sm:block">
              <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Risk Factor</div>
              <div className={`text-2xl font-black ${result.fraud_risk_score > 50 ? 'text-red-600' : 'text-green-600'}`}>
                {result.fraud_risk_score}%
              </div>
           </div>
        </div>

        {/* Results Header Dashboard */}
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden mb-12">
           <div className="bg-slate-900 p-10 md:p-16 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-20 opacity-5">
               <i className="fas fa-file-invoice text-[15rem]"></i>
             </div>
             
             <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                <div className="text-center lg:text-left flex-grow">
                   <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-600/20 text-blue-400 text-[11px] font-black uppercase tracking-widest mb-6 border border-blue-500/30">
                     <span className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></span>
                     <span>ATS Evaluation System v4.0</span>
                   </div>
                   <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-4">
                     {jobTitle}
                   </h2>
                   <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                      <MetricBox label="ATS Score" value={result.ats_score + '%'} color="text-blue-400" />
                      <MetricBox label="Match" value={result.match_percentage + '%'} color="text-green-400" />
                      <MetricBox label="Rating" value={result.rating} color="text-yellow-400" />
                   </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center">
                   <div className="w-48 h-48 bg-white/5 rounded-3xl border border-white/10 p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                          <PolarGrid stroke="#ffffff22" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 8 }} />
                          <Radar name="Candidate" dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} />
                        </RadarChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="w-56 h-56 relative flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={0} dataKey="value" startAngle={90} endAngle={-270}>
                               <Cell fill="#2563eb" />
                               <Cell fill="#ffffff11" />
                            </Pie>
                         </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className="text-5xl font-black text-white">{result.match_percentage}</span>
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Match %</span>
                      </div>
                   </div>
                </div>
             </div>
           </div>

           <div className="p-10 md:p-16 space-y-20">
              {/* Optimization Section */}
              <section>
                 <div className="flex items-center space-x-4 mb-10">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                      <i className="fas fa-wand-magic-sparkles"></i>
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900">AI Optimization Hub</h3>
                       <p className="text-slate-500 font-medium">Rewriting your content for maximum ATS visibility.</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Tailored Professional Summary</h4>
                       <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 relative group">
                          <button 
                            className="absolute top-6 right-6 w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 transition opacity-0 group-hover:opacity-100 shadow-sm"
                            onClick={() => navigator.clipboard.writeText(result.optimized_summary)}
                          >
                             <i className="fas fa-copy"></i>
                          </button>
                          <p className="text-slate-700 font-medium leading-relaxed italic">"{result.optimized_summary}"</p>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">High-Impact Bullet Points</h4>
                       <div className="space-y-4">
                          {result.improved_bullets.map((bullet, i) => (
                             <div key={i} className="flex items-start space-x-4 bg-white p-5 rounded-2xl border border-slate-100 hover:border-blue-200 transition group shadow-sm">
                                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                   <i className="fas fa-bolt text-xs"></i>
                                </div>
                                <p className="text-sm text-slate-700 font-medium">{bullet}</p>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </section>

              {/* Skills and Roadmap */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                 <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                       <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                          <i className="fas fa-check-circle text-green-500 mr-2"></i> Verified Skills
                       </h3>
                       <div className="flex flex-wrap gap-2">
                          {result.matched_skills.map((s, i) => (
                             <span key={i} className="px-4 py-2 bg-green-50 text-green-700 text-xs font-black rounded-xl border border-green-100">{s}</span>
                          ))}
                       </div>
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                          <i className="fas fa-exclamation-circle text-red-500 mr-2"></i> Skill Gaps
                       </h3>
                       <div className="flex flex-wrap gap-2">
                          {result.missing_skills.map((s, i) => (
                             <span key={i} className="px-4 py-2 bg-red-50 text-red-700 text-xs font-black rounded-xl border border-red-100">{s}</span>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                       <i className="fas fa-graduation-cap text-6xl"></i>
                    </div>
                    <h3 className="text-xl font-bold mb-8 text-blue-400">Growth Roadmap</h3>
                    <div className="space-y-6">
                       {result.learning_roadmap.map((item, i) => (
                          <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition group cursor-pointer" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(item.skill + ' ' + item.resource)}`, '_blank')}>
                             <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">{item.skill}</div>
                             <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{item.resource}</span>
                                <i className="fas fa-arrow-right text-[10px] transform group-hover:translate-x-1 transition-transform"></i>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
           <button onClick={() => setResult(null)} className="flex-1 py-6 bg-white border-2 border-slate-200 text-slate-800 rounded-[1.5rem] font-black text-lg hover:bg-slate-50 transition transform active:scale-95 shadow-sm">
             Analyze Another Resume
           </button>
           <button onClick={() => window.print()} className="flex-1 py-6 bg-blue-600 text-white rounded-[1.5rem] font-black text-lg hover:bg-blue-700 transition transform active:scale-95 shadow-2xl shadow-blue-200 flex items-center justify-center">
             <i className="fas fa-file-pdf mr-3"></i> Export Optimization Report
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-10 md:p-16 border-b bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-8">
           <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest mb-4">
                 <i className="fas fa-sparkles"></i>
                 <span>Professional Enhancement</span>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">
                AI Resume Optimizer
              </h2>
              <p className="text-slate-500 font-medium mt-2">Industrial-grade ATS scoring and Trust verification.</p>
           </div>
           <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center shadow-sm overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Recruiter${i}`} alt="Recruiter" />
                </div>
              ))}
              <div className="w-12 h-12 rounded-full border-4 border-white bg-blue-600 flex items-center justify-center shadow-lg text-white text-[10px] font-black">
                ATS+
              </div>
           </div>
        </div>

        <form onSubmit={handleAnalyze} className="p-10 md:p-16 space-y-12">
           <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                 <i className="fas fa-bullseye mr-2 text-blue-600"></i> Target Job Role <span className="text-red-500 ml-1">*</span>
              </label>
              <input 
                required
                placeholder="e.g. Senior Software Engineer @ Google"
                className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-xl text-slate-800 placeholder-slate-300"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
              />
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Resume Side */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                       <i className="fas fa-file-invoice mr-2 text-blue-600"></i> Your Current Resume
                    </label>
                    <div className="flex space-x-2">
                       <input type="file" id="resumeFile" className="hidden" accept=".txt,image/*" onChange={e => handleFileUpload(e, 'resume')} />
                       <button type="button" onClick={() => document.getElementById('resumeFile')?.click()} className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition">
                         {resumeImage ? '✓ Captured' : 'Upload Image / TXT'}
                       </button>
                    </div>
                 </div>
                 
                 <div 
                   onDragEnter={(e) => onDrag(e, 'resume')} 
                   onDragLeave={(e) => onDrag(e, 'resume')} 
                   onDragOver={(e) => onDrag(e, 'resume')} 
                   onDrop={(e) => onDrop(e, 'resume')}
                   className={`relative rounded-3xl transition-all duration-300 ${dragActive === 'resume' ? 'ring-4 ring-blue-500 bg-blue-50 scale-[1.02]' : 'bg-slate-50'}`}
                 >
                    <textarea 
                       required={!resumeImage}
                       placeholder="Paste your resume content or drag & drop a screenshot here..."
                       className="w-full px-8 py-6 bg-transparent border-2 border-slate-100 rounded-3xl outline-none focus:border-blue-300 text-sm font-medium transition-all min-h-[350px] resize-none"
                       value={resumeText}
                       onChange={e => setResumeText(e.target.value)}
                    />
                    {resumeImage && (
                       <div className="absolute inset-0 p-4 pointer-events-none">
                          <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-blue-500 shadow-2xl relative">
                             <img src={resumeImage} className="w-full h-full object-cover" alt="Resume Source" />
                             <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-auto">
                                <button type="button" onClick={() => setResumeImage(null)} className="w-12 h-12 bg-red-500 text-white rounded-full shadow-xl hover:scale-110 transition active:scale-95">
                                   <i className="fas fa-trash-alt"></i>
                                </button>
                             </div>
                          </div>
                       </div>
                    )}
                 </div>
              </div>

              {/* JD Side */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                       <i className="fas fa-align-left mr-2 text-blue-600"></i> Job Description (JD)
                    </label>
                    <div className="flex space-x-2">
                       <input type="file" id="jdFile" className="hidden" accept=".txt,image/*" onChange={e => handleFileUpload(e, 'jd')} />
                       <button type="button" onClick={() => document.getElementById('jdFile')?.click()} className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition">
                         {jdImage ? '✓ Captured' : 'Upload Image / TXT'}
                       </button>
                    </div>
                 </div>

                 <div 
                   onDragEnter={(e) => onDrag(e, 'jd')} 
                   onDragLeave={(e) => onDrag(e, 'jd')} 
                   onDragOver={(e) => onDrag(e, 'jd')} 
                   onDrop={(e) => onDrop(e, 'jd')}
                   className={`relative rounded-3xl transition-all duration-300 ${dragActive === 'jd' ? 'ring-4 ring-blue-500 bg-blue-50 scale-[1.02]' : 'bg-slate-50'}`}
                 >
                    <textarea 
                       required={!jdImage}
                       placeholder="Paste the target JD or drop a screenshot of the listing..."
                       className="w-full px-8 py-6 bg-transparent border-2 border-slate-100 rounded-3xl outline-none focus:border-blue-300 text-sm font-medium transition-all min-h-[350px] resize-none"
                       value={jobDesc}
                       onChange={e => setJobDesc(e.target.value)}
                    />
                    {jdImage && (
                       <div className="absolute inset-0 p-4 pointer-events-none">
                          <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-blue-500 shadow-2xl relative">
                             <img src={jdImage} className="w-full h-full object-cover" alt="JD Source" />
                             <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-auto">
                                <button type="button" onClick={() => setJdImage(null)} className="w-12 h-12 bg-red-500 text-white rounded-full shadow-xl hover:scale-110 transition active:scale-95">
                                   <i className="fas fa-trash-alt"></i>
                                </button>
                             </div>
                          </div>
                       </div>
                    )}
                 </div>
              </div>
           </div>

           <div className="pt-8">
              <button className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] font-black text-2xl hover:bg-blue-700 transition shadow-2xl shadow-blue-200 transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center">
                 <i className="fas fa-wand-magic-sparkles mr-4"></i> Optimize My Career Profile
              </button>
              <p className="text-center text-slate-400 text-xs mt-6 font-medium">
                Our AI process simultaneously scans for recruitment fraud and provides ATS-industrial benchmarks.
              </p>
           </div>
        </form>
      </div>
    </div>
  );
};

const MetricBox = ({ label, value, color }: { label: string, value: string, color: string }) => (
  <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl flex flex-col">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className={`text-xl font-black ${color}`}>{value}</span>
  </div>
);

export default ResumeAnalyzer;
