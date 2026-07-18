import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, BrainCircuit, ShieldCheck, Network, HeartHandshake, Lock, ChevronDown, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MedicalScene } from '../components/three/MedicalScene';
import { motion } from 'framer-motion';

export const Landing = () => {
  const { user } = useAuth();
  const { resolved, setPreference } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [openNetworkPolicies, setOpenNetworkPolicies] = useState({ 1: false, 2: false });
  const [openIntelligencePolicies, setOpenIntelligencePolicies] = useState({ 1: false, 2: false });

  // Generate background particles once
  const particles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      size: Math.sin(i * 9.8) * 1.5 + 3, // sizes between 1.5px and 4.5px
      x: (Math.sin(i * 12.9 + 2) * 0.5 + 0.5) * 100,
      y: (Math.cos(i * 78.2 + 5) * 0.5 + 0.5) * 100,
      duration: (Math.sin(i * 45.6 + 1) * 0.5 + 0.5) * 12 + 10,
      delay: (Math.sin(i * 92.1 + 3) * 0.5 + 0.5) * 4
    }));
  }, []);

  // Handle transparent to solid navbar on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const cardsContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
    },
    hover: {
      y: -10,
      scale: 1.02,
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-sans selection:bg-indigo-500/30 dark:selection:bg-indigo-500/50 transition-colors duration-300">
      
      {/* Dynamic Top Navigation */}
      <nav className={`fixed top-0 inset-x-0 h-20 z-50 transition-all duration-500 flex justify-center ${
        scrolled ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10 shadow-lg' : 'bg-transparent'
      }`}>
        <div className="w-full max-w-7xl px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-lg shadow-indigo-500/20 p-1">
              <img src="/logo.png" alt="MediCare-AI Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">MediCare-AI</span>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            <Link to="/vision" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Vision</Link>
            <Link to="/network" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Global Network</Link>
            <Link to="/intelligence" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Intelligence</Link>
            <Link to="/security" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Security</Link>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setPreference(resolved === 'dark' ? 'light' : 'dark')}
              className="p-2.5 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors bg-slate-200/50 dark:bg-white/10 backdrop-blur-md rounded-full border border-slate-300/30 dark:border-white/20 hover:bg-slate-200 dark:hover:bg-white/20 cursor-pointer shadow-sm flex items-center justify-center"
              title={`Switch to ${resolved === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {resolved === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-indigo-600" />}
            </button>

            {user ? (
              <Link to="/dashboard" className="text-sm font-bold text-indigo-600 dark:text-white bg-indigo-500/10 dark:bg-indigo-600/20 border border-indigo-500/20 dark:border-indigo-500/30 px-6 py-2.5 rounded-full hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 backdrop-blur-md shadow-md">
                Enter Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Sign in
                </Link>
                <Link to="/signup" className="relative overflow-hidden bg-indigo-600 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 hover:bg-indigo-700 dark:hover:bg-slate-200 hover:shadow-lg hover:shadow-indigo-500/20">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* SLIDE 1: The Vision (Hero) */}
      <section 
        id="vision"
        className="relative min-h-screen flex items-center justify-center px-6 bg-cover bg-center bg-fixed transition-colors duration-300"
        style={{ backgroundImage: "url('/slide1.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/90 via-slate-50/70 to-slate-100 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-900 transition-colors duration-300"></div>
        <MedicalScene variant="hero" className="absolute inset-0 z-[1] opacity-[0.80] mix-blend-multiply dark:mix-blend-screen transition-opacity" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center pt-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200/50 dark:bg-white/10 backdrop-blur-md border border-slate-300/30 dark:border-white/20 mb-8 shadow-md">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold tracking-widest uppercase text-slate-700 dark:text-white">System Online</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.05] mb-8 text-slate-900 dark:text-white drop-shadow-2xl transition-colors">
            The intelligent core for <br className="hidden md:block"/> modern healthcare.
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed mb-12 font-medium drop-shadow-lg transition-colors">
            A transcendent platform that unifies hospital infrastructure, patient data, and predictive artificial intelligence into one pristine experience.
          </p>

          <div className="depth-stage flex flex-col sm:flex-row justify-center gap-6 w-full sm:w-auto">
            {!user && (
               <Link to="/signup" className="depth-card bg-indigo-600 dark:bg-white text-white dark:text-slate-900 px-10 py-5 font-black text-lg transition-all duration-300 flex items-center justify-center gap-3 hover:shadow-indigo-500/20 dark:hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                 Enter the Network <ArrowRight className="h-6 w-6" />
               </Link>
            )}
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-70">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500 dark:text-white">Scroll to discover</span>
          <div className="w-0.5 h-10 bg-gradient-to-b from-slate-500 to-transparent dark:from-white dark:to-transparent"></div>
        </div>
      </section>

      {/* SLIDE 2: Global Network */}
      <section 
        id="network"
        className="relative min-h-screen flex items-center px-6 bg-cover bg-center bg-fixed transition-colors duration-300"
        style={{ backgroundImage: "url('/slide2.png')" }}
      >
        <div className="absolute inset-0 bg-slate-50/80 dark:bg-slate-900/80 transition-colors duration-300"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 dark:to-transparent transition-colors duration-300"></div>
        <MedicalScene variant="dashboard" className="absolute inset-y-0 right-0 w-full lg:w-1/2 opacity-[0.45] mix-blend-multiply dark:mix-blend-screen transition-opacity" />
        
        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 py-32">
          <div className="flex flex-col justify-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 backdrop-blur-xl border border-indigo-400/20 dark:border-indigo-400/30 flex items-center justify-center mb-8 shadow-sm">
              <Network className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-tight transition-colors">
              A deeply connected <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400">global framework.</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-10 max-w-xl transition-colors">
              Eliminate data silos. Our proprietary infrastructure syncs massive patient cohorts, lab telemetry, and clinical notes across borders with zero latency. You are no longer managing a clinic; you are operating a node in a global intelligence network.
            </p>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="border-l-2 border-indigo-500/30 dark:border-indigo-500/50 pl-4">
                <div className="text-4xl font-black text-slate-900 dark:text-white mb-1 transition-colors">4ms</div>
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Global Latency</div>
              </div>
              <div className="border-l-2 border-indigo-500/30 dark:border-indigo-500/50 pl-4">
                <div className="text-4xl font-black text-slate-900 dark:text-white mb-1 transition-colors">99.99%</div>
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Uptime SLA</div>
              </div>
            </div>

            {/* Interactive Network Policies Accordion */}
            <div className="mt-10 space-y-4 max-w-xl">
              <div className="border-t border-slate-200 dark:border-white/10 pt-4">
                <button 
                  onClick={() => setOpenNetworkPolicies(p => ({ ...p, 1: !p[1] }))}
                  className="w-full flex items-center justify-between text-left group focus:outline-none"
                >
                  <span className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Data Sovereignty Policy (GDPR/HIPAA)
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-transform duration-300 ${openNetworkPolicies[1] ? 'rotate-180 text-indigo-600 dark:text-white' : ''}`} />
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openNetworkPolicies[1] ? 'max-h-28 opacity-100 mt-3' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed transition-colors">
                    Patient medical charts and clinical telemetry are localized automatically to comply with regional health regulations. EU patient records remain in EU-West storage nodes, and US medical files are restricted to US-East clusters.
                  </p>
                </div>
              </div>

              <div className="border-t border-b border-slate-200 dark:border-white/10 py-4">
                <button 
                  onClick={() => setOpenNetworkPolicies(p => ({ ...p, 2: !p[2] }))}
                  className="w-full flex items-center justify-between text-left group focus:outline-none"
                >
                  <span className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Low-Latency Edge Failover Policy
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-transform duration-300 ${openNetworkPolicies[2] ? 'rotate-180 text-indigo-600 dark:text-white' : ''}`} />
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openNetworkPolicies[2] ? 'max-h-28 opacity-100 mt-3' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed transition-colors">
                    In case of a regional node failure, routing instantly fails over to the next closest secondary edge node. Only cryptographically validated incremental updates are synced to maintain database consistency.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SLIDE 3: Predictive Intelligence */}
      <section 
        id="intelligence"
        className="relative min-h-screen flex items-center px-6 bg-cover bg-center bg-fixed transition-colors duration-300"
        style={{ backgroundImage: "url('/slide3.png')" }}
      >
        <div className="absolute inset-0 bg-slate-50/70 dark:bg-slate-900/70 transition-colors duration-300"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/60 to-slate-50/90 dark:from-slate-900 dark:via-slate-900/60 dark:to-slate-900/90 transition-colors duration-300"></div>
        <MedicalScene variant="hero" role="admin" className="absolute inset-y-0 right-0 w-full lg:w-1/2 opacity-[0.35] mix-blend-multiply dark:mix-blend-screen transition-opacity" />
        
        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 py-32">
          <div className="flex flex-col justify-center">
            <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 dark:bg-fuchsia-500/20 backdrop-blur-xl border border-fuchsia-400/20 dark:border-fuchsia-400/30 flex items-center justify-center mb-8 shadow-sm">
              <BrainCircuit className="w-8 h-8 text-fuchsia-600 dark:text-fuchsia-400" />
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-tight transition-colors">
              Deterministic <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-pink-500 dark:from-fuchsia-400 dark:to-pink-400">predictive AI.</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-10 max-w-xl transition-colors">
              We don't just store records; we analyze them. The MediCare-AI neural engine constantly evaluates your patient cohorts, predicting high-risk conditions before symptoms even manifest. Actionable foresight, delivered automatically.
            </p>
            
            <div className="depth-card bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-8 max-w-md w-full text-left">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Live Telemetry</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500"></span>
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-slate-200 dark:border-white/10 pb-4">
                  <span className="text-slate-700 dark:text-white font-medium">Anomaly Detection</span>
                  <span className="text-2xl font-black text-fuchsia-600 dark:text-fuchsia-400">Active</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-slate-700 dark:text-white font-medium">Diagnostic Accuracy</span>
                  <span className="text-2xl font-black text-fuchsia-600 dark:text-fuchsia-400">99.2%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block"></div> {/* Spacer for left alignment */}
        </div>
      </section>

      {/* SLIDE 4: Zero-Trust Security */}
      <section 
        id="security"
        className="relative min-h-screen flex items-center px-6 bg-cover bg-center bg-fixed transition-colors duration-300"
        style={{ backgroundImage: "url('/slide4.png')" }}
      >
        <div className="absolute inset-0 bg-slate-50/80 dark:bg-slate-900/80 transition-colors duration-300"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 dark:to-transparent transition-colors duration-300"></div>
        <MedicalScene variant="hero" role="doctor" className="absolute inset-y-0 right-0 w-full lg:w-1/2 opacity-[0.35] mix-blend-multiply dark:mix-blend-screen transition-opacity" />
        
        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 py-32">
          <div className="flex flex-col justify-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 backdrop-blur-xl border border-emerald-400/20 dark:border-emerald-400/30 flex items-center justify-center mb-8 shadow-sm">
              <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-tight transition-colors">
              Military-grade <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400">zero-trust vault.</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-10 max-w-xl transition-colors">
              Your patient data is protected by uncompromising cryptographic protocols. We employ end-to-end encryption, continuous biometric authorization, and hardware-backed keys. It is mathematically impossible for unauthorized entities to access your data.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <span className="px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-300 font-bold tracking-widest uppercase text-xs">HIPAA Compliant</span>
              <span className="px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/30 text-emerald-300 dark:text-emerald-300 font-bold tracking-widest uppercase text-xs">SOC2 Type II</span>
              <span className="px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/30 text-emerald-300 dark:text-emerald-300 font-bold tracking-widest uppercase text-xs">AES-256 Encrypted</span>
            </div>
          </div>
        </div>
      </section>

      {/* SLIDE 5: The Invitation (Final CTA) */}
      <section 
        className="relative min-h-[80vh] flex items-center justify-center px-6 bg-cover bg-center bg-fixed border-t border-slate-200 dark:border-white/10 transition-colors duration-300"
        style={{ backgroundImage: "url('/slide5.png')" }}
      >
        <div className="absolute inset-0 bg-slate-100/75 dark:bg-slate-950/75 backdrop-blur-[3px] transition-colors duration-300"></div>
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none z-0"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
        <MedicalScene variant="hero" className="absolute inset-0 opacity-[0.60] mix-blend-multiply dark:mix-blend-screen z-0 transition-opacity" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center animate-fade-in">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white mb-8 transition-colors">
            The future of medicine <br/> is waiting for you.
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 font-medium mb-12 max-w-2xl mx-auto transition-colors">
            Join the most advanced clinical network on the planet. Select your portal to begin the onboarding sequence.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/signup" className="bg-indigo-600 dark:bg-white text-white dark:text-slate-900 px-8 py-5 rounded-2xl font-black text-lg transition-all duration-300 hover:bg-indigo-700 dark:hover:bg-slate-200 hover:shadow-lg flex items-center justify-center gap-3 hover:-translate-y-1">
              Sign Up <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="bg-slate-200/50 dark:bg-white/10 text-slate-700 dark:text-white border border-slate-300/30 dark:border-white/20 px-8 py-5 rounded-2xl font-black text-lg transition-all duration-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:shadow-md flex items-center justify-center gap-3 hover:-translate-y-1 backdrop-blur-md">
              Sign In to Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white flex items-center justify-center overflow-hidden p-0.5 shadow-sm">
              <img src="/logo.png" alt="MediCare-AI Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-white transition-colors">MediCare-AI</span>
          </div>
          <div className="flex gap-8 text-xs font-bold tracking-widest uppercase text-slate-500 dark:text-slate-500">
            <Link to="/privacy" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/status" className="hover:text-indigo-600 dark:hover:text-white transition-colors">System Status</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};
