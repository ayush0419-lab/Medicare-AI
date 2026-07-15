import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, BrainCircuit, ChevronDown, CheckCircle, Eye, ShieldAlert, Cpu } from 'lucide-react';
import { MedicalScene } from '../components/three/MedicalScene';

export const PredictiveIntelligencePage = () => {
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
      icon: <ShieldAlert className="w-5 h-5 text-fuchsia-400" />,
      iconBg: 'bg-fuchsia-500/10 border-fuchsia-500/20 group-hover:bg-fuchsia-500/20',
      titleColor: 'group-hover:text-fuchsia-300',
      title: '1. AI Safety & Bias Mitigation Policy',
      content: 'Our neural predictions undergo automatic daily alignment and evaluation. Suggested diagnostic scores are validated against independent medical databases to eliminate algorithm drift and demographic biases, ensuring consistent, unbiased predictions.'
    },
    {
      id: 2,
      icon: <Eye className="w-5 h-5 text-indigo-400" />,
      iconBg: 'bg-indigo-500/10 border-indigo-500/20 group-hover:bg-indigo-500/20',
      titleColor: 'group-hover:text-indigo-300',
      title: '2. Transparent Decisioning Policy (Explainable AI)',
      content: 'Every AI-suggested risk assessment or cohort metric is accompanied by explainability indexes. Clinicians can view which symptoms or history parameters most heavily weighted the prediction score, establishing clear clinical accountability.'
    },
    {
      id: 3,
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      iconBg: 'bg-cyan-500/10 border-cyan-500/20 group-hover:bg-cyan-500/20',
      titleColor: 'group-hover:text-cyan-300',
      title: '3. Generative Diagnostics & Sanitization Policy',
      content: 'Summarized clinical documents and treatment recommendations are drafted using generative medical pipelines with strict sanitization layers. All Personally Identifiable Information (PII) is scrubbed client-side before model ingestion.'
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
          <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/20 backdrop-blur-xl border border-fuchsia-400/30 flex items-center justify-center mb-6 shadow-2xl">
            <BrainCircuit className="w-8 h-8 text-fuchsia-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
            Predictive Intelligence
          </h1>
          <p className="text-lg text-slate-300 max-w-xl font-medium">
            Discover the neural architecture, diagnostic safety regulations, and model transparency of Medicare-AI.
          </p>
        </div>

        {/* Diagnostic Accuracy Banner */}
        <div className="depth-card bg-fuchsia-500/10 border border-fuchsia-500/20 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <BrainCircuit className="w-10 h-10 text-fuchsia-400 animate-pulse" />
            <div>
              <h3 className="text-xl font-bold text-white">99.2% Diagnostic Accuracy</h3>
              <p className="text-sm text-slate-300">Continuous risk assessments and anomaly detection active.</p>
            </div>
          </div>
          <div className="text-sm font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 px-4 py-2 rounded-full">
            Model: Gemini 1.5 Flash
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

        {/* Footer info inside Intelligence page */}
        <p className="text-center text-xs text-slate-500 mt-12">
          Predictions are computer-generated clinical simulations and must be approved by a licensed healthcare provider before clinical execution.
        </p>
      </div>
    </div>
  );
};
