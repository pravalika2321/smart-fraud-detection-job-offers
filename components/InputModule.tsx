
import React, { useState } from 'react';
import { JobInputData } from '../types';

interface InputModuleProps {
  onAnalyze: (data: JobInputData) => void;
}

const InputModule: React.FC<InputModuleProps> = ({ onAnalyze }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'email' | 'file'>('manual');
  const [loadingFile, setLoadingFile] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    salary: '',
    location: '',
    email: '',
    website: '',
    description: '',
  });
  const [emailContent, setEmailContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = (e) => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalData: JobInputData;
    
    if (activeTab === 'manual') {
      if (!formData.description || !formData.title) {
        alert("Please fill in the required fields.");
        return;
      }
      finalData = { ...formData, sourceType: 'manual' };
    } else if (activeTab === 'email') {
      if (emailContent.length < 20) {
        alert("Please paste the full email content for a more accurate analysis.");
        return;
      }
      finalData = {
        title: 'Extracted from Email',
        company: 'Unknown',
        salary: 'N/A',
        location: 'Remote/Unknown',
        email: 'N/A',
        website: 'N/A',
        description: emailContent,
        sourceType: 'email'
      };
    } else {
      if (!selectedFile) {
        alert("Please select a file first.");
        return;
      }
      
      setLoadingFile(true);
      try {
        const content = await readFileContent(selectedFile);
        finalData = {
          title: selectedFile.name,
          company: 'Extracted from File',
          salary: 'N/A',
          location: 'N/A',
          email: 'N/A',
          website: 'N/A',
          description: content || `Analysis request for file: ${selectedFile.name}`,
          sourceType: 'file'
        };
      } catch (err) {
        alert("Could not read file content. Please try pasting the text instead.");
        setLoadingFile(false);
        return;
      }
      setLoadingFile(false);
    }

    onAnalyze(finalData);
  };

  // Helper to get dynamic input classes
  const getInputClass = (value: string) => {
    const base = "w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300 font-medium text-slate-200 placeholder-slate-500";
    // Change background if value exists
    const bgColor = value.length > 0 ? "bg-slate-700 border-blue-900/30" : "bg-slate-800 border-slate-700";
    return `${base} ${bgColor}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="flex border-b bg-slate-50">
        {(['manual', 'email', 'file'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${
              activeTab === tab 
                ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
            }`}
          >
            {tab === 'manual' && <><i className="fas fa-edit mr-2"></i> Manual Input</>}
            {tab === 'email' && <><i className="fas fa-envelope mr-2"></i> Paste Email</>}
            {tab === 'file' && <><i className="fas fa-file-upload mr-2"></i> File Upload</>}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        {activeTab === 'manual' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800 flex items-center">
                Job Title <span className="text-red-500 ml-1">*</span>
              </label>
              <input 
                required
                name="title"
                value={formData.title}
                onChange={handleManualChange}
                placeholder="e.g. Senior Software Engineer" 
                className={getInputClass(formData.title)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">
                Company Name <span className="text-red-500 ml-1">*</span>
              </label>
              <input 
                required
                name="company"
                value={formData.company}
                onChange={handleManualChange}
                placeholder="e.g. Google" 
                className={getInputClass(formData.company)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">Salary / Stipend</label>
              <input 
                name="salary"
                value={formData.salary}
                onChange={handleManualChange}
                placeholder="e.g. $120,000 / year" 
                className={getInputClass(formData.salary)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">Location</label>
              <input 
                name="location"
                value={formData.location}
                onChange={handleManualChange}
                placeholder="e.g. New York, NY" 
                className={getInputClass(formData.location)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">Recruiter Email</label>
              <input 
                name="email"
                value={formData.email}
                onChange={handleManualChange}
                placeholder="e.g. hr@company.com" 
                className={getInputClass(formData.email)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">Website URL</label>
              <input 
                name="website"
                value={formData.website}
                onChange={handleManualChange}
                placeholder="e.g. https://company.com" 
                className={getInputClass(formData.website)}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-800">
                Job Description <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea 
                required
                name="description"
                value={formData.description}
                onChange={handleManualChange}
                rows={5}
                placeholder="Paste the full job description here..." 
                className={getInputClass(formData.description)}
              ></textarea>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800">
              Recruitment Email Content <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea 
              required
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              rows={12}
              placeholder="Paste the entire body of the email you received..." 
              className={getInputClass(emailContent)}
            ></textarea>
          </div>
        )}

        {activeTab === 'file' && (
          <div 
            className={`py-16 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-all cursor-pointer ${selectedFile ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${selectedFile ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
              <i className={`fas ${selectedFile ? 'fa-check' : 'fa-cloud-upload-alt'} text-2xl`}></i>
            </div>
            <p className="text-slate-800 font-bold text-lg">{selectedFile ? selectedFile.name : 'Click to select a file'}</p>
            <p className="text-sm text-slate-500 mt-2 px-6 text-center">Accepts PDF, DOCX, and TXT formats (Max 5MB)</p>
            <input 
              id="fileInput"
              type="file" 
              className="hidden" 
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </div>
        )}

        <div className="mt-10 flex justify-end">
          <button 
            type="submit"
            disabled={loadingFile}
            className={`px-12 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 transition transform hover:scale-[1.02] active:scale-95 ${loadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loadingFile ? 'Processing...' : <>Start Intelligence Check <i className="fas fa-microchip ml-2"></i></>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputModule;
