
import React, { useState } from 'react';
import { ResumeAnalysisResult } from '../types';
import { analyzeResume } from '../geminiService';
import { db } from '../db';

interface ResumeAnalyzerProps {
  userId: string;
}

const ResumeAnalyzer: React.FC<ResumeAnalyzerProps> = ({ userId }) => {
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeAnalysisResult | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setResumeText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText || !jobDesc || !jobTitle) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const analysis = await analyzeResume(resumeText, jobDesc);
      setResult(analysis);
      
      db.saveResumeHistory({
        ...analysis,
        id: Math.random().toString(36).substr(2, 9),
        userId,
        job_title: jobTitle,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      alert("Failed to analyze resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center">
        <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-8"></div>
        <h2 className="text-2xl font-bold text-slate-800">Calculating Match Score...</h2>
        <p className="text-slate-500 mt-2">Gemini is parsing your skills and the JD requirements.</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-500">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden mb-8">
          <div className="bg-blue-600 p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black">{result.match_percentage}% Match Score</h2>
              <p className="text-blue-100 mt-1">For: {jobTitle}</p>
            </div>
            <div className={`px-6 py-2 rounded-full font-bold text-sm ${
              result.rating === 'High' ? 'bg-green-400 text-green-950' :
              result.rating === 'Medium' ? 'bg-yellow-400 text-yellow-950' :
              'bg-red-400 text-red-950'
            }`}>
              {result.rating} Compatibility
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <i className="fas fa-check-circle text-green-500 mr-2"></i> Matched Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.matched_skills.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">{s}</span>
                ))}
              </div>

              <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4 flex items-center">
                <i className="fas fa-exclamation-circle text-amber-500 mr-2"></i> Missing Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missing_skills.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100">{s}</span>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">ATS Suggestions</h3>
              <ul className="space-y-3">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start space-x-3 text-sm text-slate-600">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-8 p-4 bg-white rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Strength Score</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-grow h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{width: `${result.strength_score * 10}%`}}></div>
                  </div>
                  <span className="text-lg font-black text-slate-800">{result.strength_score}/10</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => setResult(null)} className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition">Analyze Another Resume</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 border-b bg-slate-50/50">
          <h2 className="text-2xl font-bold text-slate-800">Resume Match Analyzer</h2>
          <p className="text-slate-500 text-sm mt-1">Optimize your resume for any specific job role using Gemini AI.</p>
        </div>
        
        <form onSubmit={handleAnalyze} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Target Job Title</label>
            <input 
              required
              placeholder="e.g. Frontend Engineer"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex justify-between">
                <span>Resume Text</span>
                <input type="file" id="resumeFile" className="hidden" accept=".txt" onChange={handleFileUpload} />
                <button type="button" onClick={() => document.getElementById('resumeFile')?.click()} className="text-blue-600 hover:underline">Upload .txt</button>
              </label>
              <textarea 
                required
                rows={10}
                placeholder="Paste your resume text here..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Job Description</label>
              <textarea 
                required
                rows={10}
                placeholder="Paste the job description here..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={jobDesc}
                onChange={e => setJobDesc(e.target.value)}
              />
            </div>
          </div>

          <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200 active:scale-95 transform">
            <i className="fas fa-magic mr-2"></i> Analyze My Resume
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
