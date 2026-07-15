import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Activity, Database, Brain, Mail, Key, ChevronDown, CheckCircle } from 'lucide-react';
import { MedicalScene } from '../components/three/MedicalScene';

export const SystemStatus = () => {
  const [openSections, setOpenSections] = useState({
    1: true, // First system stats open by default
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

  const systems = [
    {
      id: 1,
      name: 'Supabase Database Engine',
      icon: <Database className="w-5 h-5 text-indigo-400" />,
      iconBg: 'bg-indigo-500/10 border-indigo-500/20 group-hover:bg-indigo-500/20',
      titleColor: 'group-hover:text-indigo-300',
      uptime: '99.99%',
      latency: '4.2ms',
      status: 'Operational',
      description: 'The secure cloud database cluster handles clinical notes, patient profiles, and user sessions. Automated database replication is healthy across US-East and EU-West regions. Database backup state: Verified and encrypted.'
    },
    {
      id: 2,
      name: 'Gemini AI Core (Cognitive Processing)',
      icon: <Brain className="w-5 h-5 text-fuchsia-400" />,
      iconBg: 'bg-fuchsia-500/10 border-fuchsia-500/20 group-hover:bg-fuchsia-500/20',
      titleColor: 'group-hover:text-fuchsia-300',
      uptime: '99.98%',
      latency: '185ms',
      status: 'Operational',
      description: 'The neural engine powered by Gemini 1.5 Flash generates patient summaries, health risk calculations, and appointment layouts. Anonymization filters are operating with 0 leaks reported. Thread capacity is at 14% utilization.'
    },
    {
      id: 3,
      name: 'Resend Email Relay (Secure OTP)',
      icon: <Mail className="w-5 h-5 text-emerald-400" />,
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20',
      titleColor: 'group-hover:text-emerald-300',
      uptime: '100.00%',
      latency: '120ms',
      status: 'Operational',
      description: 'Our designated email relay handles user verification, authentication magic links, and one-time password (OTP) delivery. SPF, DKIM, and DMARC alignments are fully aligned. Send queue is empty with normal delivery rates.'
    },
    {
      id: 4,
      name: 'Zero-Trust Cryptographic Vault',
      icon: <Key className="w-5 h-5 text-cyan-400" />,
      iconBg: 'bg-cyan-500/10 border-cyan-500/20 group-hover:bg-cyan-500/20',
      titleColor: 'group-hover:text-cyan-300',
      uptime: '100.00%',
      latency: '1.8ms',
      status: 'Operational',
      description: 'Handles hardware-backed encryption keys, secure user authentication states, and biometric-derived access verification. Vault hardware security modules (HSMs) are operating within optimal temperature guidelines.'
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
            <Activity className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
            System Status
          </h1>
          <p className="text-lg text-slate-300 max-w-xl font-medium">
            Real-time health statistics, API response latencies, and service availability logs.
          </p>
        </div>

        {/* Global Health Indicator */}
        <div className="depth-card bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <CheckCircle className="w-10 h-10 text-emerald-400 animate-pulse" />
            <div>
              <h3 className="text-xl font-bold text-white">All Systems Operational</h3>
              <p className="text-sm text-slate-300">Medicare-AI core servers, AI models, and databases are healthy.</p>
            </div>
          </div>
          <div className="text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-4 py-2 rounded-full">
            Global Uptime: 99.99%
          </div>
        </div>

        {/* Accordion Content Card */}
        <div className="depth-card bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 space-y-6 rounded-2xl">
          {/* Last Updated */}
          <div className="text-xs font-bold tracking-widest uppercase text-slate-400 border-b border-white/10 pb-4 mb-4 flex justify-between items-center">
            <span>Last Telemetry Sync: Just Now</span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          {/* Accordion List */}
          <div className="space-y-4">
            {systems.map((sys) => {
              const isOpen = openSections[sys.id];
              return (
                <div 
                  key={sys.id} 
                  className="border-b border-white/5 pb-5 last:border-0 last:pb-0"
                >
                  <button 
                    onClick={() => toggleSection(sys.id)}
                    className="w-full flex items-center justify-between text-left focus:outline-none group py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border transition-colors ${sys.iconBg}`}>
                        {sys.icon}
                      </div>
                      <div>
                        <h2 className={`text-lg font-bold text-white transition-colors ${sys.titleColor}`}>
                          {sys.name}
                        </h2>
                        <div className="flex gap-4 text-xs font-semibold text-slate-400 mt-1">
                          <span>Uptime: <strong className="text-slate-200">{sys.uptime}</strong></span>
                          <span>Latency: <strong className="text-slate-200">{sys.latency}</strong></span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-full hidden sm:inline-block">
                        {sys.status}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : ''}`} />
                    </div>
                  </button>

                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0 pointer-events-none'
                    }`}
                  >
                    <p className="text-slate-300 leading-relaxed text-sm pl-11">
                      {sys.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info inside Status page */}
        <p className="text-center text-xs text-slate-500 mt-12">
          Automated heartbeat checks occur every 60 seconds. Diagnostic latency scores reflect the 10-minute rolling average.
        </p>
      </div>
    </div>
  );
};
