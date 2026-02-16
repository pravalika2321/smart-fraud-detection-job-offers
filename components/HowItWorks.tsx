
import React from 'react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: 'fa-paste',
      title: 'Submit Data',
      desc: 'Paste a job description, email body, or upload a recruitment document.',
      topImage: null
    },
    {
      icon: 'fa-microchip',
      title: 'AI Scanning',
      desc: 'Our Gemini-powered NLP engine analyzes linguistic patterns and red flags.',
      topImage: null
    },
    {
      icon: 'fa-globe',
      title: 'Verified Checks',
      desc: 'We cross-reference domains, salaries, and company records automatically.',
      topImage: null
    },
    {
      icon: 'fa-clipboard-check',
      title: 'Get Result',
      desc: 'Receive a risk score and clear evidence-based explanations.',
      topImage: 'https://cdn-icons-png.flaticon.com/512/3502/3502601.png'
    }
  ];

  return (
    <section className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-20">
          <div className="inline-block px-4 py-1.5 mb-6 text-blue-600 font-bold text-xs tracking-widest uppercase bg-blue-50 rounded-full">
            The Process
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">Simple 4-Step Protection</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">Our streamlined workflow ensures you never fall victim to recruitment fraud.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-slate-100 -z-10"></div>
              )}
              <div className="flex flex-col items-center text-center">
                {/* Image or Icon Container */}
                <div className="w-24 h-24 mb-8 relative">
                  {step.topImage ? (
                    <div className="w-full h-full rounded-full overflow-hidden shadow-lg border-[4px] border-blue-50 group-hover:border-blue-200 group-hover:scale-110 transition-all duration-500 flex items-center justify-center bg-white p-5">
                      <img 
                        src={step.topImage} 
                        alt={step.title} 
                        className="w-full h-full object-contain filter drop-shadow-sm"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-blue-50 rounded-3xl flex items-center justify-center group-hover:bg-blue-600 transition-all duration-300 shadow-sm border border-blue-100 group-hover:border-transparent group-hover:shadow-blue-200">
                      <i className={`fas ${step.icon} text-3xl text-blue-600 group-hover:text-white transition-colors`}></i>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight group-hover:text-blue-600 transition-colors">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-[200px]">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
