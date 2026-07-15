import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ChevronLeft, Lock, FileText, Cpu, EyeOff, ChevronDown } from 'lucide-react';
import { MedicalScene } from '../components/three/MedicalScene';

export const PrivacyPolicy = () => {
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

  const policies = [
    {
      id: 1,
      icon: <Lock className="w-5 h-5 text-indigo-400" />,
      iconBg: 'bg-indigo-500/10 border-indigo-500/20 group-hover:bg-indigo-500/20',
      titleColor: 'group-hover:text-indigo-300',
      title: '1. Zero-Trust Data Architecture',
      content: 'At MediCare-AI, patient records are fortified using zero-trust end-to-end encryption. All medical records, clinical notes, and files are encrypted client-side before being synchronized with our database. We employ advanced cryptographic protocols, meaning our infrastructure team cannot access raw patient files.'
    },
    {
      id: 2,
      icon: <Cpu className="w-5 h-5 text-fuchsia-400" />,
      iconBg: 'bg-fuchsia-500/10 border-fuchsia-500/20 group-hover:bg-fuchsia-500/20',
      titleColor: 'group-hover:text-fuchsia-300',
      title: '2. Artificial Intelligence & Telemetry',
      content: 'Our deterministic predictive AI engine processes clinical datasets to assess patient health risks and suggest appointment layouts. All patient information processed by our AI algorithms (including Google Gemini AI) is fully anonymized. No personally identifiable information (PII) is transmitted to third-party language models or external AI servers.'
    },
    {
      id: 3,
      icon: <FileText className="w-5 h-5 text-emerald-400" />,
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20',
      titleColor: 'group-hover:text-emerald-300',
      title: '3. Compliance and Security Standards',
      content: 'MediCare-AI operates in strict accordance with global health data regulatory requirements, including HIPAA (Health Insurance Portability and Accountability Act) and SOC2 Type II standards. All database communication happens over TLS 1.3 channels, and backups are stored in a geographically redundant, encrypted vault.'
    },
    {
      id: 4,
      icon: <EyeOff className="w-5 h-5 text-cyan-400" />,
      iconBg: 'bg-cyan-500/10 border-cyan-500/20 group-hover:bg-cyan-500/20',
      titleColor: 'group-hover:text-cyan-300',
      title: '4. User Autonomy & Consent',
      content: 'Medical organizations and patients retain complete ownership of their data. You have the right to inspect access logs, revoke authentication sessions instantly, and securely delete records at any time. Our platforms do not sell, rent, or monetize patient or doctor telemetry under any circumstances.'
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
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 backdrop-blur-xl border border-indigo-400/30 flex items-center justify-center mb-6 shadow-2xl">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
            Privacy Policy
          </h1>
          <p className="text-lg text-slate-300 max-w-xl font-medium">
            Click any section below to expand and view the platform's security and telemetry handling protocols.
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
            {policies.map((policy) => {
              const isOpen = openSections[policy.id];
              return (
                <div 
                  key={policy.id} 
                  className="border-b border-white/5 pb-5 last:border-0 last:pb-0"
                >
                  <button 
                    onClick={() => toggleSection(policy.id)}
                    className="w-full flex items-center justify-between text-left focus:outline-none group py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border transition-colors ${policy.iconBg}`}>
                        {policy.icon}
                      </div>
                      <h2 className={`text-xl font-bold text-white transition-colors ${policy.titleColor}`}>
                        {policy.title}
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
                      {policy.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info inside Privacy page */}
        <p className="text-center text-xs text-slate-500 mt-12">
          If you have questions about your privacy rights or the encryption mechanisms, contact the MediCare-AI security operations center.
        </p>
      </div>
    </div>
  );
};
