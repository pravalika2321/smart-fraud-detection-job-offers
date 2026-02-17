
import React, { useState, useMemo } from 'react';
import { HistoryRecord, RiskLevel, RecordCategory, ResumeHistoryRecord } from '../types';
import { db } from '../db';

interface HistoryTableProps {
  data: HistoryRecord[];
  resumeData?: ResumeHistoryRecord[];
  isAdmin?: boolean;
  onRefresh?: () => void;
}

type UnifiedEntry = {
  id: string;
  source: 'Fraud Scan' | 'Job Analyzer';
  title: string;
  subtitle: string;
  risk_rate: number;
  date: string;
  isResume: boolean;
  originalRecord: any;
};

const HistoryTable: React.FC<HistoryTableProps> = ({ data, resumeData = [], isAdmin = false, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'fake' | 'genuine' | 'suspicious'>('all');

  const unifiedData: UnifiedEntry[] = useMemo(() => {
    const combined: UnifiedEntry[] = [
      ...data.map(h => ({
        id: h.id,
        source: 'Fraud Scan' as const,
        title: h.job_title,
        subtitle: h.company_name,
        risk_rate: h.risk_rate,
        date: h.created_at,
        isResume: false,
        originalRecord: h
      })),
      ...resumeData.map(r => ({
        id: r.id,
        source: 'Job Analyzer' as const,
        title: r.job_title,
        subtitle: `ATS: ${r.ats_score}% | Match: ${r.match_percentage}%`,
        risk_rate: r.fraud_risk_score,
        date: r.created_at,
        isResume: true,
        originalRecord: r
      }))
    ];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, resumeData]);

  const getVerdictByRisk = (risk: number) => {
    if (risk >= 70) return 'Fake Job';
    if (risk <= 40) return 'Genuine Job';
    return 'Suspicious';
  };

  const getCatFromRisk = (risk: number) => {
    if (risk >= 70) return 'fake';
    if (risk <= 40) return 'genuine';
    return 'suspicious';
  };

  const filteredData = unifiedData.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(search.toLowerCase()) || 
      item.subtitle.toLowerCase().includes(search.toLowerCase());
    
    const cat = getCatFromRisk(item.risk_rate);
    const matchesCategory = activeCategory === 'all' || cat === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleDelete = (item: UnifiedEntry) => {
    if (confirm('Permanently delete this record?')) {
      if (item.isResume) db.deleteResumeHistory(item.id);
      else db.deleteHistory(item.id);
      if (onRefresh) onRefresh();
    }
  };

  const downloadReport = (item: UnifiedEntry) => {
    const verdict = getVerdictByRisk(item.risk_rate);
    const content = `FRAUDGUARD VERIFICATION REPORT\nSOURCE: ${item.source}\nID: ${item.id}\nJob: ${item.title}\nDetail: ${item.subtitle}\nVerdict: ${verdict}\nRisk Rate: ${item.risk_rate}%\nGenerated: ${new Date(item.date).toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_${item.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
          {(['all', 'fake', 'genuine', 'suspicious'] as const).map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${
                activeCategory === cat ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {cat === 'fake' ? '🛑 Fake' : cat === 'genuine' ? '✅ Genuine' : cat === 'suspicious' ? '⚠️ Suspicious' : 'Combined Logs'}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Filter combined records..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Source</th>
              <th className="px-6 py-4">Information</th>
              <th className="px-6 py-4">Verdict</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs italic">No activity matching these criteria.</td>
              </tr>
            ) : (
              filteredData.map(item => {
                const verdict = getVerdictByRisk(item.risk_rate);
                const isFake = item.risk_rate >= 70;
                const isGenuine = item.risk_rate <= 40;
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isFake ? 'bg-red-100 text-red-600' : isGenuine ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        <i className={`fas ${isFake ? 'fa-skull' : isGenuine ? 'fa-check' : 'fa-triangle-exclamation'} text-xs`}></i>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${item.isResume ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                        {item.source}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-800">{item.title}</div>
                      <div className="text-[10px] text-slate-500">{item.subtitle} • {new Date(item.date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        isFake ? 'bg-red-600 text-white shadow-sm shadow-red-200' : isGenuine ? 'bg-green-600 text-white shadow-sm shadow-green-200' : 'bg-yellow-400 text-slate-900'
                      }`}>
                        {verdict} ({item.risk_rate}%)
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => downloadReport(item)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"><i className="fas fa-file-invoice text-xs"></i></button>
                      <button onClick={() => handleDelete(item)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm"><i className="fas fa-trash-alt text-xs"></i></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryTable;
