
import React, { useState } from 'react';
import { HistoryRecord, RiskLevel } from '../types';
import { db } from '../db';

interface HistoryTableProps {
  data: HistoryRecord[];
  isAdmin?: boolean;
  onRefresh?: () => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({ data, isAdmin = false, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredData = data.filter(item => {
    const matchesSearch = 
      item.job_title.toLowerCase().includes(search.toLowerCase()) || 
      item.company_name.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = riskFilter === 'All' || item.risk_level === riskFilter;
    const matchesStatus = statusFilter === 'All' || item.prediction === statusFilter;
    return matchesSearch && matchesRisk && matchesStatus;
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      db.deleteHistory(id);
      onRefresh?.();
    }
  };

  const downloadPDF = (item: HistoryRecord) => {
    // Simplified simulation of PDF download
    const content = `
      FRAUDGUARD ANALYSIS REPORT
      ---------------------------
      ID: ${item.id}
      Job: ${item.job_title}
      Company: ${item.company_name}
      Result: ${item.prediction}
      Confidence: ${item.confidence_score}%
      Risk: ${item.risk_level} (${item.risk_rate}%)
      Date: ${new Date(item.created_at).toLocaleString()}
      
      EXPLANATIONS:
      ${item.explanations.join('\n- ')}
      
      SAFETY TIPS:
      ${item.safety_tips.join('\n- ')}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_${item.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Table Headers/Filters */}
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-64">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Search job or company..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select 
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
          >
            <option value="All">All Risks</option>
            <option value={RiskLevel.LOW}>Low Risk</option>
            <option value={RiskLevel.MEDIUM}>Medium Risk</option>
            <option value={RiskLevel.HIGH}>High Risk</option>
          </select>
          <select 
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Fake Job">Fake Only</option>
            <option value="Genuine Job">Genuine Only</option>
          </select>
          {isAdmin && (
             <button className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition">
               <i className="fas fa-file-csv mr-2"></i> Export CSV
             </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Job Details</th>
              <th className="px-6 py-4">Analysis</th>
              <th className="px-6 py-4">Risk Level</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                  No records found matching your filters.
                </td>
              </tr>
            ) : (
              filteredData.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-slate-500 font-medium">
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-800">{item.job_title}</div>
                    <div className="text-xs text-slate-500">{item.company_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      item.prediction === 'Fake Job' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                    }`}>
                      {item.prediction}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">{item.confidence_score}% Confidence</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`w-fit px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.risk_level === RiskLevel.HIGH ? 'bg-red-500 text-white' :
                      item.risk_level === RiskLevel.MEDIUM ? 'bg-yellow-400 text-slate-900' :
                      'bg-green-500 text-white'
                    }`}>
                      {item.risk_level}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => downloadPDF(item)} className="p-2 text-slate-400 hover:text-blue-600 transition" title="Download Report">
                      <i className="fas fa-file-pdf"></i>
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 transition" title="Delete">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryTable;
