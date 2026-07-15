import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ChevronLeft, Scale, AlertOctagon, HeartHandshake, Key, Activity, ChevronDown } from 'lucide-react';
import { MedicalScene } from '../components/three/MedicalScene';

export const TermsOfService = () => {
  const [openSections, setOpenSections] = useState({
    1: true, // First section open by default
    2: false,
    3: false,
    4: false,
  });

  const toggleSection = (id) => {
    setOpenSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const terms = [
    {
      id: 1,
      icon: <AlertOctagon className="w-5 h-5 text-rose-400" />,
      iconBg: 'bg-rose-500/10 border-rose-500/20 group-hover:bg-rose-500/20',
      titleColor: 'group-hover:text-rose-300',
      title: '1. Clinical AI Disclaimer (Not Medical Advice)',
      content: 'MediCare-AI provides advanced machine-learning predictions and clinical assistant interfaces. The platform is not a licensed medical provider and does not provide official medical diagnoses, treatments, or prescriptions. All predictive scores and suggested diagnoses are strictly computer-generated simulations and must be vetted by a qualified clinician.'
    },
    {
      id: 2,
      icon: <HeartHandshake className="w-5 h-5 text-indigo-400" />,
      iconBg: 'bg-indigo-500/10 border-indigo-500/20 group-hover:bg-indigo-500/20',
      titleColor: 'group-hover:text-indigo-300',
      title: '2. Professional Responsibilities',
      content: 'Medical professionals using the platform acknowledge that they retain sole clinical responsibility for patient outcomes. You agree to double-check AI-generated summaries, risk scores, and appointment schedules against primary patient charts and established standard-of-care practices before making clinical decisions.'
    },
    {
      id: 3,
      icon: <Key className="w-5 h-5 text-amber-400" />,
      iconBg: 'bg-amber-500/10 border-amber-500/20 group-hover:bg-amber-500/20',
      titleColor: 'group-hover:text-amber-300',
      title: '3. Credentials and Encryption Keys',
      content: 'Healthcare administrators and providers must maintain the confidentiality of all system credentials, multi-factor authentication tokens, and cryptographic keys. Any compromised API keys (including Gemini AI or Supabase credentials) must be rotated immediately. MediCare-AI is not liable for unauthorized access resulting from credential sharing.'
    },
    {
      id: 4,
      icon: <Activity className="w-5 h-5 text-emerald-400" />,
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20',
      titleColor: 'group-hover:text-emerald-300',
      title: '4. Service Availability and Telemetry',
      content: 'While we aim for a 99.99% uptime SLA, system maintenance, database synchronization intervals, or API adjustments can affect real-time performance. In emergencies, clinicians must rely on standard local hospital systems rather than depending solely on MediCare-AI cloud-based dashboards.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans relative flex flex-col items-center py-20 px-6 overflow-hidden">
      {/* Background and Scene */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm mix-blend-multiply z-0"></div>
      <MedicalScene variant="hero" role="admin" className="absolute inset-0 z-0 opacity-20 mix-blend-screen" />

      {/* Back button */}
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-1 text-sm font-bold text-slate-300 hover:text-white transition-colors z-10 drop-shadow-md">
        <ChevronLeft className="h-4 w-4" /> Back to home
      </Link>

      <div className="max-w-4xl w-full z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-500/20 backdrop-blur-xl border border-slate-400/30 flex items-center justify-center mb-6 shadow-2xl">
            <Scale className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
            Terms of Service
          </h1>
          <p className="text-lg text-slate-300 max-w-xl font-medium">
            Please read the legal terms, medical disclaimers, and user duties of the MediCare-AI clinical network.
          </p>
        </div>

        {/* Accordion Content Card */}
        <div className="depth-card bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 space-y-6 rounded-2xl">
          {/* Last Updated */}
          <div className="text-xs font-bold tracking-widest uppercase text-slate-400 border-b border-white/10 pb-4 mb-4">
            Last Updated: July 13, 2026
          </div>

          {/* Accordion List */}
          <div className="space-y-4">
            {terms.map((term) => {
              const isOpen = openSections[term.id];
              return (
                <div 
                  key={term.id} 
                  className="border-b border-white/5 pb-5 last:border-0 last:pb-0"
                >
                  <button 
                    onClick={() => toggleSection(term.id)}
                    className="w-full flex items-center justify-between text-left focus:outline-none group py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border transition-colors ${term.iconBg}`}>
                        {term.icon}
                      </div>
                      <h2 className={`text-xl font-bold text-white transition-colors ${term.titleColor}`}>
                        {term.title}
                      </h2>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : ''}`} />
                  </button>

                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0 pointer-events-none'
                    }`}
                  >
                    <p className="text-slate-300 leading-relaxed text-sm pl-11">
                      {term.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info inside Terms page */}
        <p className="text-center text-xs text-slate-500 mt-12">
          By utilizing the MediCare-AI service, you verify that you agree to all clinical disclaimers and professional security expectations.
        </p>
      </div>
    </div>
  );
};
