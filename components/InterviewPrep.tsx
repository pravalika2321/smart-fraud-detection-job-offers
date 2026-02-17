
import React, { useState, useEffect } from 'react';
import { generateInterviewPrep } from '../geminiService';
import { db } from '../db';
import { InterviewModule } from '../types';

interface InterviewPrepProps {
  userId: string;
}

const InterviewPrep: React.FC<InterviewPrepProps> = ({ userId }) => {
  const [role, setRole] = useState('Software Engineer');
  const [level, setLevel] = useState('Fresher');
  const [loading, setLoading] = useState(false);
  const [activeModule, setActiveModule] = useState<InterviewModule | null>(null);
  const [savedModules, setSavedModules] = useState<InterviewModule[]>([]);

  useEffect(() => {
    setSavedModules(db.getInterviewModules(userId));
  }, [userId]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await generateInterviewPrep(role, level);
      const newModule: InterviewModule = {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        role,
        experience_level: level,
        ...data,
        created_at: new Date().toISOString()
      };
      db.saveInterviewModule(newModule);
      setActiveModule(newModule);
      setSavedModules(prev => [newModule, ...prev]);
    } catch (err) {
      alert("Failed to generate interview module. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = (id: string) => {
    if (confirm('Remove this preparation module?')) {
      db.deleteInterviewModule(id);
      setSavedModules(prev => prev.filter(m => m.id !== id));
      if (activeModule?.id === id) setActiveModule(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center animate-in zoom-in-95 duration-700">
        <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-8 shadow-xl"></div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">AI Recruiter Working...</h2>
        <p className="text-slate-500 font-medium mt-2">Crafting technical questions and 30-day roadmap.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="bg-white rounded-[2.5rem] p-10 md:p-16 shadow-2xl border border-slate-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-12">
          <div className="flex-grow text-center md:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
               <i className="fas fa-brain"></i>
               <span>Career Intelligence</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Interview Preparation AI</h2>
            <p className="text-slate-500 mt-2 font-medium">Generate high-fidelity prep modules for any role.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <select 
              value={role} onChange={e => setRole(e.target.value)}
              className="px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700"
            >
              <option>Software Engineer</option>
              <option>Data Analyst</option>
              <option>Frontend Developer</option>
              <option>UI/UX Designer</option>
              <option>Project Manager</option>
            </select>
            <select 
              value={level} onChange={e => setLevel(e.target.value)}
              className="px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700"
            >
              <option>Fresher</option>
              <option>Junior (1-2 yrs)</option>
              <option>Senior (5+ yrs)</option>
              <option>Management</option>
            </select>
            <button 
              onClick={handleGenerate}
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:scale-105 transition active:scale-95"
            >
              Generate Prep
            </button>
          </div>
        </div>

        {activeModule ? (
          <div className="space-y-16 animate-in slide-in-from-bottom-5">
            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               {/* Technical */}
               <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-900 flex items-center">
                    <i className="fas fa-terminal mr-3 text-blue-600"></i> Technical Evaluation
                  </h3>
                  <div className="space-y-4">
                    {activeModule.technical_questions.map((q, i) => (
                      <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black text-blue-600 uppercase mb-2">Q: {q.question}</div>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{q.answer}</p>
                      </div>
                    ))}
                  </div>
               </div>

               {/* HR */}
               <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-900 flex items-center">
                    <i className="fas fa-users mr-3 text-indigo-600"></i> Behavioral (STAR Method)
                  </h3>
                  <div className="space-y-4">
                    {activeModule.hr_questions.map((q, i) => (
                      <div key={i} className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                        <div className="text-[10px] font-black text-indigo-600 uppercase mb-2">Q: {q.question}</div>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed italic">"{q.answer}"</p>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* Preparation Timeline */}
            <div className="bg-slate-900 rounded-[2rem] p-10 md:p-16 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                 <i className="fas fa-map text-9xl"></i>
               </div>
               <h3 className="text-2xl font-black mb-10 text-blue-400">Preparation Roadmap</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {activeModule.preparation_roadmap.map((step, i) => (
                    <div key={i} className="relative pl-8 border-l-2 border-white/10 py-2 group">
                      <div className="absolute top-0 left-[-6px] w-2.5 h-2.5 rounded-full bg-blue-500 group-hover:scale-150 transition-transform"></div>
                      <div className="text-[10px] font-black text-slate-500 uppercase mb-1">{step.day}</div>
                      <p className="text-sm font-bold text-slate-200">{step.task}</p>
                    </div>
                  ))}
               </div>
            </div>
            
            <button onClick={() => setActiveModule(null)} className="w-full py-5 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition">View Other Saved Modules</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedModules.map(m => (
              <div key={m.id} className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all relative cursor-pointer" onClick={() => setActiveModule(m)}>
                <div className="flex justify-between items-start mb-6">
                   <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl">
                      <i className="fas fa-briefcase"></i>
                   </div>
                   <button onClick={(e) => { e.stopPropagation(); handleDeleteModule(m.id); }} className="text-slate-300 hover:text-red-500 transition-colors">
                     <i className="fas fa-trash-alt text-xs"></i>
                   </button>
                </div>
                <h4 className="text-lg font-black text-slate-900 leading-tight mb-2">{m.role}</h4>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.experience_level} • {new Date(m.created_at).toLocaleDateString()}</div>
                <div className="mt-6 flex items-center text-blue-600 text-xs font-bold uppercase tracking-widest">
                  <span>View Full Roadmap</span>
                  <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                </div>
              </div>
            ))}
            {savedModules.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                <i className="fas fa-folder-open text-4xl text-slate-200 mb-4"></i>
                <p className="text-slate-400 font-bold italic">No preparation modules created yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPrep;
