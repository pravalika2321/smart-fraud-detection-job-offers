
import React, { useState } from 'react';
import { JobInputData } from '../types';

interface InputModuleProps {
  onAnalyze: (data: JobInputData) => void;
}

const InputModule: React.FC<InputModuleProps> = ({ onAnalyze }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'email' | 'upload'>('manual');
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
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = (e) => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        try {
          const base64 = await fileToBase64(file);
          setUploadPreview(base64);
        } catch (err) {
          alert("Failed to process image preview.");
        }
      } else {
        setUploadPreview(null);
      }
    }
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
      // Unified Upload (File or Image)
      if (!selectedFile) {
        alert("Please select a file or screenshot first.");
        return;
      }
      
      setLoadingFile(true);
      try {
        if (selectedFile.type.startsWith('image/')) {
          const base64 = await fileToBase64(selectedFile);
          finalData = {
            title: 'Visual Job Offer',
            company: 'Analyzing Visuals...',
            salary: 'N/A',
            location: 'N/A',
            email: 'N/A',
            website: 'N/A',
            description: 'Image-based analysis requested.',
            sourceType: 'screenshot',
            screenshot: base64
          };
        } else {
          const content = await readFileContent(selectedFile);
          finalData = {
            title: selectedFile.name,
            company: 'Extracted from Document',
            salary: 'N/A',
            location: 'N/A',
            email: 'N/A',
            website: 'N/A',
            description: content || `Analysis request for file: ${selectedFile.name}`,
            sourceType: 'file'
          };
        }
      } catch (err) {
        alert("Could not process the uploaded file.");
        setLoadingFile(false);
        return;
      }
      setLoadingFile(false);
    }

    onAnalyze(finalData);
  };

  const getInputClass = (value: string) => {
    const base = "w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300 font-medium text-slate-200 placeholder-slate-500 shadow-sm";
    const bgColor = value.length > 0 ? "bg-slate-700 border-blue-900/30" : "bg-slate-800 border-slate-700";
    return `${base} ${bgColor}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transition-all duration-500">
      <div className="flex border-b bg-slate-50 overflow-x-auto no-scrollbar">
        {(['manual', 'email', 'upload'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSelectedFile(null);
              setUploadPreview(null);
            }}
            className={`flex-1 min-w-[140px] py-4 text-xs md:text-sm font-bold transition-all duration-300 relative ${
              activeTab === tab 
                ? 'bg-white text-blue-600' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
            }`}
          >
            {tab === 'manual' && <><i className="fas fa-edit mr-2"></i> Manual Details</>}
            {tab === 'email' && <><i className="fas fa-envelope mr-2"></i> Paste Email</>}
            {tab === 'upload' && <><i className="fas fa-file-export mr-2"></i> Upload Offer</>}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 animate-in slide-in-from-left duration-300"></div>}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        {activeTab === 'manual' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800 flex items-center">
                Job Title <span className="text-red-500 ml-1">*</span>
              </label>
              <input required name="title" value={formData.title} onChange={handleManualChange} placeholder="e.g. Senior Software Engineer" className={getInputClass(formData.title)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">Company Name <span className="text-red-500 ml-1">*</span></label>
              <input required name="company" value={formData.company} onChange={handleManualChange} placeholder="e.g. Google" className={getInputClass(formData.company)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">Salary / Stipend</label>
              <input name="salary" value={formData.salary} onChange={handleManualChange} placeholder="e.g. $120,000 / year" className={getInputClass(formData.salary)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">Location</label>
              <input name="location" value={formData.location} onChange={handleManualChange} placeholder="e.g. New York, NY" className={getInputClass(formData.location)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">Recruiter Email</label>
              <input name="email" value={formData.email} onChange={handleManualChange} placeholder="e.g. hr@company.com" className={getInputClass(formData.email)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">Website URL</label>
              <input name="website" value={formData.website} onChange={handleManualChange} placeholder="e.g. https://company.com" className={getInputClass(formData.website)} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-800">Job Description <span className="text-red-500 ml-1">*</span></label>
              <textarea required name="description" value={formData.description} onChange={handleManualChange} rows={5} placeholder="Paste the full job description here..." className={getInputClass(formData.description)}></textarea>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="space-y-2 animate-in fade-in duration-500">
            <label className="text-sm font-bold text-slate-800">Recruitment Email Content <span className="text-red-500 ml-1">*</span></label>
            <textarea required value={emailContent} onChange={(e) => setEmailContent(e.target.value)} rows={12} placeholder="Paste the entire body of the email you received..." className={getInputClass(emailContent)}></textarea>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="animate-in zoom-in-95 duration-500">
            <div 
              className={`relative min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden ${selectedFile ? 'border-blue-500 bg-slate-900' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
              onClick={() => document.getElementById('unifiedFileInput')?.click()}
            >
              {selectedFile ? (
                <div className="relative w-full flex flex-col items-center p-6">
                  {uploadPreview ? (
                    <img src={uploadPreview} className="max-h-[250px] object-contain rounded-lg shadow-2xl mb-4" alt="Preview" />
                  ) : (
                    <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                      <i className="fas fa-file-alt text-3xl text-white"></i>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setUploadPreview(null); }}
                      className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                  <p className="text-blue-400 font-bold text-lg text-center">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type || 'Unknown Type'}</p>
                  <p className="text-blue-500 font-bold text-xs mt-4 uppercase tracking-widest">Click to Replace File</p>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                    <i className="fas fa-cloud-upload-alt text-3xl"></i>
                  </div>
                  <h3 className="text-slate-800 font-extrabold text-xl mb-2 text-center">Click to select a document or screenshot</h3>
                  <p className="text-sm text-slate-500 px-6 text-center max-w-md">
                    Accepts PDF, DOCX, TXT, and all Image formats (Max 5MB). AI will automatically detect fraud indicators in both text and visuals.
                  </p>
                </>
              )}
              <input id="unifiedFileInput" type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,image/*" onChange={handleFileChange} />
            </div>
            {!selectedFile && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                   { icon: 'fa-file-pdf', name: 'PDF Support' },
                   { icon: 'fa-image', name: 'Screenshots' },
                   { icon: 'fa-file-word', name: 'Word Docs' },
                   { icon: 'fa-file-alt', name: 'Plain Text' }
                 ].map((feat, i) => (
                   <div key={i} className="flex flex-col items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                     <i className={`fas ${feat.icon} text-blue-600 mb-2`}></i>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{feat.name}</span>
                   </div>
                 ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-10 flex justify-end">
          <button 
            type="submit"
            disabled={loadingFile}
            className={`px-12 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 transition transform hover:scale-[1.02] active:scale-95 flex items-center ${loadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loadingFile ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                Processing...
              </>
            ) : (
              <>Scan Offer Intelligence <i className="fas fa-microchip ml-3"></i></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputModule;
