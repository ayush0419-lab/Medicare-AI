import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, ChevronDown, CheckCircle, Key, Lock, Terminal, ShieldAlert } from 'lucide-react';
import { MedicalScene } from '../components/three/MedicalScene';

export const ZeroTrustSecurityPage = () => {
  const [openPolicies, setOpenPolicies] = useState({
    1: true, // First policy open by default
    2: false,
    3: false,
  });

  const togglePolicy = (id) => {
    setOpenPolicies(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const policies = [
    {
      id: 1,
      icon: <Key className="w-5 h-5 text-emerald-400" />,
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20',
      titleColor: 'group-hover:text-emerald-300',
      title: '1. Zero-Knowledge Cryptographic Key Policy',
      content: 'All database records are encrypted client-side using AES-GCM-256. Cryptographic keys are derived from user biometrics and login credentials. MediCare-AI infrastructure nodes store only opaque ciphertexts—no raw private keys are ever cached, transmitted, or accessible to system administrators.'
    },
    {
      id: 2,
      icon: <Lock className="w-5 h-5 text-indigo-400" />,
      iconBg: 'bg-indigo-500/10 border-indigo-500/20 group-hover:bg-indigo-500/20',
      titleColor: 'group-hover:text-indigo-300',
      title: '2. Multi-Factor Session Authorization Policy',
      content: 'Active clinical sessions automatically expire after 15 minutes of inactivity. Secondary multi-factor tokens (secure OTP delivered via Resend) or FIDO2/WebAuthn hardware security keys are required for any critical patient record modification or batch downloads.'
    },
    {
      id: 3,
      icon: <Terminal className="w-5 h-5 text-cyan-400" />,
      iconBg: 'bg-cyan-500/10 border-cyan-500/20 group-hover:bg-cyan-500/20',
      titleColor: 'group-hover:text-cyan-300',
      title: '3. Tamper-Proof Cryptographic Auditing Policy',
      content: 'Every query, update, or login event is appended to an immutable, cryptographically chained audit log ledger. Logs are replicated to separate compliance clusters instantly, enabling real-time forensics and audit reports for health authorities.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans relative flex flex-col items-center py-20 px-6 overflow-hidden">
      {/* Background and Scene */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm mix-blend-multiply z-0"></div>
      <MedicalScene variant="hero" role="doctor" className="absolute inset-0 z-0 opacity-20 mix-blend-screen" />

      {/* Back button */}
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-1 text-sm font-bold text-slate-300 hover:text-white transition-colors z-10 drop-shadow-md">
        <ChevronLeft className="h-4 w-4" /> Back to home
      </Link>

      <div className="max-w-4xl w-full z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 backdrop-blur-xl border border-emerald-400/30 flex items-center justify-center mb-6 shadow-2xl">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
            Zero-Trust Vault
          </h1>
          <p className="text-lg text-slate-300 max-w-xl font-medium">
            Learn about the end-to-end cryptographic policies, compliance standards, and authentication parameters of Medicare-AI.
          </p>
        </div>

        {/* Compliance Badges Banner */}
        <div className="depth-card bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <ShieldAlert className="w-10 h-10 text-emerald-400 animate-pulse" />
            <div>
              <h3 className="text-xl font-bold text-white">Military-Grade Encryption Active</h3>
              <p className="text-sm text-slate-300">HIPAA Compliant, SOC2 Type II, and AES-256 protected.</p>
            </div>
          </div>
          <div className="text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-4 py-2 rounded-full">
            Biometric Keys Enabled
          </div>
        </div>

        {/* Accordion Content Card */}
        <div className="depth-card bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 space-y-6 rounded-2xl">
          {/* Last Updated */}
          <div className="text-xs font-bold tracking-widest uppercase text-slate-400 border-b border-white/10 pb-4 mb-4">
            Last Updated: July 13, 2026
          </div>

          {/* Accordion List */}
          <div className="space-y-4">
            {policies.map((p) => {
              const isOpen = openPolicies[p.id];
              return (
                <div 
                  key={p.id} 
                  className="border-b border-white/5 pb-5 last:border-0 last:pb-0"
                >
                  <button 
                    onClick={() => togglePolicy(p.id)}
                    className="w-full flex items-center justify-between text-left focus:outline-none group py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border transition-colors ${p.iconBg}`}>
                        {p.icon}
                      </div>
                      <h2 className={`text-xl font-bold text-white transition-colors ${p.titleColor}`}>
                        {p.title}
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
                      {p.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info inside Security page */}
        <p className="text-center text-xs text-slate-500 mt-12">
          Clinical personnel must configure biometric authorization or pass a hardware security key test to access high-security zones.
        </p>
      </div>
    </div>
  );
};
