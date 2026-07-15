import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Network, ChevronDown, CheckCircle, Globe, Shield, RefreshCw } from 'lucide-react';
import { MedicalScene } from '../components/three/MedicalScene';

export const GlobalNetworkPage = () => {
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
      icon: <Globe className="w-5 h-5 text-[#4FD1C5]" />,
      iconBg: 'bg-cyan-500/10 border-cyan-500/20 group-hover:bg-cyan-500/20',
      titleColor: 'group-hover:text-cyan-300',
      title: '1. Data Sovereignty and Compliance (GDPR/HIPAA)',
      content: 'Patient medical records and clinical telemetry are localized automatically to comply with regional health regulations. EU patient records are restricted to EU-West storage nodes, and US medical charts are restricted to US-East clusters, ensuring complete regulatory alignment with zero-trust cross-border synchronization.'
    },
    {
      id: 2,
      icon: <Shield className="w-5 h-5 text-indigo-400" />,
      iconBg: 'bg-indigo-500/10 border-indigo-500/20 group-hover:bg-indigo-500/20',
      titleColor: 'group-hover:text-indigo-300',
      title: '2. Low-Latency Failover Protocols',
      content: 'In the event of a regional network outage, the platform instantly shifts routing to the next closest secondary edge node. Only cryptographically validated incremental updates (deltas) are synced to maintain database consistency and prevent data replication collisions.'
    },
    {
      id: 3,
      icon: <RefreshCw className="w-5 h-5 text-purple-400" />,
      iconBg: 'bg-purple-500/10 border-purple-500/20 group-hover:bg-purple-500/20',
      titleColor: 'group-hover:text-purple-300',
      title: '3. Real-Time Telemetry and Sync Integrity',
      content: 'All connected nodes run continuous background health checks. The synchronization engine uses client-side Conflict-Free Replicated Data Types (CRDTs) to merge local clinician updates with the master ledger within 4ms of network reconnection.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans relative flex flex-col items-center py-20 px-6 overflow-hidden">
      {/* Background and Scene */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm mix-blend-multiply z-0"></div>
      <MedicalScene variant="dashboard" className="absolute inset-0 z-0 opacity-20 mix-blend-screen" />

      {/* Back button */}
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-1 text-sm font-bold text-slate-300 hover:text-white transition-colors z-10 drop-shadow-md">
        <ChevronLeft className="h-4 w-4" /> Back to home
      </Link>

      <div className="max-w-4xl w-full z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 backdrop-blur-xl border border-indigo-400/30 flex items-center justify-center mb-6 shadow-2xl">
            <Network className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
            Global Network
          </h1>
          <p className="text-lg text-slate-300 max-w-xl font-medium">
            Learn how the MediCare-AI core connects nodes, edge routers, and local medical databases.
          </p>
        </div>

        {/* Global Latency Banner */}
        <div className="depth-card bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Globe className="w-10 h-10 text-indigo-400 animate-pulse" />
            <div>
              <h3 className="text-xl font-bold text-white">4ms Global Telemetry Sync</h3>
              <p className="text-sm text-slate-300">Synchronized ledger nodes across borders in real time.</p>
            </div>
          </div>
          <div className="text-sm font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-4 py-2 rounded-full">
            Uptime SLA: 99.99%
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

        {/* Footer info inside Global Network page */}
        <p className="text-center text-xs text-slate-500 mt-12">
          By operating a node on the MediCare-AI clinical network, clinics must abide by global data localization laws and edge routing sync protocols.
        </p>
      </div>
    </div>
  );
};
