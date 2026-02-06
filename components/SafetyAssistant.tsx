
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatWithAssistant } from '../geminiService';

const SafetyAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi there! I am your FraudGuard AI Assistant. 🤖\n\nI specialize in helping you find legitimate internships and job offers. I can verify government portals like NSP, AICTE, and Skill India, or help you spot red flags in a message you received. What\'s on your mind? 💼' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!customInput) setInput('');
    setIsTyping(true);

    try {
      const response = await chatWithAssistant([...messages, userMsg]);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having a bit of trouble connecting to my brain. Please try again!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickQueries = [
    { name: 'Internship Tips', query: 'How can I stay safe while looking for internships?' },
    { name: 'Check Email', query: 'What are the red flags in a recruitment email?' },
    { name: 'NSP Support', query: 'Help me with the National Scholarship Portal (NSP).' },
    { name: 'AICTE Info', query: 'How does the AICTE internship portal work?' }
  ];

  const robotAvatar = "https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&q=80&w=100&h=100";
  const userAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=User";

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-2rem)] sm:w-[380px] md:w-[420px] h-[75vh] sm:h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 sm:p-5 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img src={robotAvatar} alt="AI Avatar" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/50 object-cover bg-white shadow-sm" />
                <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-400 border-2 border-blue-600 rounded-full"></div>
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base leading-tight">FraudGuard Assistant</h3>
                <p className="text-[9px] sm:text-[10px] text-blue-100 uppercase tracking-widest font-bold">Expert AI Career Protection</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              <i className="fas fa-chevron-down"></i>
            </button>
          </div>

          {/* Quick Links */}
          <div className="bg-slate-50 border-b border-slate-100 p-2 sm:p-3 flex space-x-2 overflow-x-auto no-scrollbar shadow-inner">
            {quickQueries.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q.query)}
                className="whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-full text-[10px] sm:text-xs font-bold text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
              >
                {q.name}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-grow p-4 overflow-y-auto space-y-4 sm:space-y-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50/50"
          >
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-blue-100 border border-blue-200 overflow-hidden shadow-sm">
                    <img src={robotAvatar} className="w-full h-full object-cover" alt="Robot" />
                  </div>
                )}
                <div className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 rounded-2xl text-[13px] sm:text-sm shadow-md leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none font-medium' 
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none font-normal'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 overflow-hidden border border-slate-200 shadow-sm">
                    <img src={userAvatar} className="w-full h-full" alt="User" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start items-center space-x-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 bg-blue-100 overflow-hidden">
                  <img src={robotAvatar} className="w-full h-full object-cover" alt="Robot" />
                </div>
                <div className="bg-white p-2 sm:p-3 rounded-2xl border border-slate-100 rounded-tl-none shadow-sm flex space-x-1">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 sm:p-5 bg-white border-t border-slate-100">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask our AI assistant..."
                className="flex-grow px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-[13px] sm:text-sm font-medium transition-all"
              />
              <button 
                onClick={() => handleSend()}
                disabled={isTyping || !input.trim()}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg active:scale-90"
              >
                <i className="fas fa-paper-plane text-xs sm:text-base"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 transform hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-slate-900 rotate-180' : 'bg-blue-600'
        }`}
      >
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 border-2 sm:border-4 border-white rounded-full animate-pulse shadow-sm"></div>
        )}
        <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping group-hover:hidden pointer-events-none"></div>
        {isOpen ? (
          <i className="fas fa-times text-white text-lg sm:text-xl"></i>
        ) : (
          <img 
            src={robotAvatar} 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover transition-transform group-hover:rotate-12 bg-white" 
            alt="Robot Chat"
          />
        )}
      </button>
    </div>
  );
};

export default SafetyAssistant;
