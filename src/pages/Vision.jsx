import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BrainCircuit, ShieldCheck, Network, HeartHandshake, Lock, ChevronLeft } from 'lucide-react';
import { MedicalScene } from '../components/three/MedicalScene';
import { motion } from 'framer-motion';

export const VisionPage = () => {
  // Generate background particles
  const particles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      size: Math.sin(i * 9.8) * 1.5 + 3,
      x: (Math.sin(i * 12.9 + 2) * 0.5 + 0.5) * 100,
      y: (Math.cos(i * 78.2 + 5) * 0.5 + 0.5) * 100,
      duration: (Math.sin(i * 45.6 + 1) * 0.5 + 0.5) * 12 + 10,
      delay: (Math.sin(i * 92.1 + 3) * 0.5 + 0.5) * 4
    }));
  }, []);

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
    <div className="min-h-screen bg-slate-900 text-white font-sans relative flex items-center px-6 py-24 overflow-hidden vision-grid">
      {/* Dark Overlays */}
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm mix-blend-multiply z-0"></div>
      
      {/* Medical Scene 3D Background */}
      <MedicalScene variant="hero" className="absolute inset-0 z-0 opacity-25 mix-blend-screen" />

      {/* Glow Spheres */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Back button */}
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-1 text-sm font-bold text-slate-300 hover:text-white transition-colors z-30 drop-shadow-md">
        <ChevronLeft className="h-4 w-4" /> Back to home
      </Link>

      {/* Animated Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute bg-cyan-400/20 rounded-full pointer-events-none z-0"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0.15, 0.7, 0.15],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* SVG connection lines behind the cards */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 z-0 hidden lg:block" viewBox="0 0 1000 1000" fill="none">
        <motion.path 
          d="M 500,250 L 500,750 M 250,500 L 750,500" 
          stroke="url(#grid-gradient)" 
          strokeWidth="1" 
          strokeDasharray="8 8"
          animate={{ strokeDashoffset: [0, -24] }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        />
        <defs>
          <linearGradient id="grid-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4FD1C5" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#4FD1C5" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-10 gap-16 items-center">
        
        {/* Left Column (40% width / 4 cols in a 10-col grid) */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="lg:col-span-4 flex flex-col items-start text-left"
        >
          <motion.span 
            variants={itemVariants} 
            className="text-xs font-bold tracking-[0.3em] uppercase text-[#4FD1C5] mb-4"
          >
            Our Vision
          </motion.span>
          
          <motion.h2 
            variants={itemVariants}
            className="text-5xl lg:text-[60px] font-black text-white leading-[1.1] mb-6 tracking-tighter"
          >
            Building the <br/> Future of <br/> Intelligent <br/> Healthcare
          </motion.h2>
          
          <motion.p 
            variants={itemVariants}
            className="text-lg text-slate-300 leading-relaxed font-medium mb-8 max-w-lg"
          >
            "To create a healthcare ecosystem where artificial intelligence empowers every medical decision, connects every healthcare provider, and ensures every patient receives faster, safer, and more personalized care."
          </motion.p>
          
          <motion.div variants={itemVariants}>
            <Link 
              to="/signup" 
              className="glass-btn-glow px-8 py-4 rounded-full font-bold text-sm inline-flex items-center gap-3 transition-all duration-300"
            >
              Explore Our Mission <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Right Column (60% width / 6 cols in a 10-col grid) */}
        <div className="lg:col-span-6 w-full">
          <motion.div 
            variants={cardsContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full"
          >
            {/* Card 1 */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="depth-card-premium p-8 relative flex flex-col items-start cursor-pointer select-none group"
            >
              <div className="shine-effect" />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/0 to-[#8B5CF6]/0 group-hover:to-[#8B5CF6]/5 transition-all duration-500 rounded-[24px] z-0" />
              
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-6 relative z-10">
                <motion.div
                  variants={{
                    hover: { scale: 1.1 }
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Network className="w-6 h-6 text-[#4FD1C5]" />
                </motion.div>
                <motion.div 
                  variants={{
                    hover: { scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }
                  }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-slate-900"
                />
                <motion.div 
                  variants={{
                    hover: { scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }
                  }}
                  transition={{ repeat: Infinity, duration: 1.8, delay: 0.3 }}
                  className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-purple-400 border border-slate-900"
                />
              </div>

              <h3 className="text-xl font-bold text-white mb-3 relative z-10">Connected Healthcare</h3>
              <p className="text-sm text-slate-300 leading-relaxed relative z-10">
                Hospitals, laboratories, pharmacies, and specialists working together through one intelligent network.
              </p>
              
              <div className="mt-6 w-full h-12 relative overflow-hidden opacity-30 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <svg className="w-full h-full" viewBox="0 0 200 48" fill="none">
                  <motion.path 
                    d="M 10,24 C 50,44 70,4 110,24 C 150,44 170,4 190,24" 
                    stroke="#4FD1C5" 
                    strokeWidth="1.5" 
                    strokeDasharray="4 4"
                    variants={{
                      hover: { strokeDashoffset: [0, -20] }
                    }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  />
                  <circle cx="10" cy="24" r="3" fill="#4FD1C5" />
                  <circle cx="110" cy="24" r="3" fill="#8B5CF6" />
                  <circle cx="190" cy="24" r="3" fill="#4FD1C5" />
                </svg>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="depth-card-premium p-8 relative flex flex-col items-start cursor-pointer select-none group"
            >
              <div className="shine-effect" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/0 via-[#8B5CF6]/0 to-cyan-500/0 group-hover:to-cyan-500/5 transition-all duration-500 rounded-[24px] z-0" />
              
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-6 relative z-10">
                <BrainCircuit className="w-6 h-6 text-[#8B5CF6]" />
                <motion.div 
                  variants={{
                    hover: { opacity: [0, 0.8, 0], scale: [0.8, 1.4, 0.8] }
                  }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="absolute inset-0 rounded-2xl bg-purple-400/20 blur-md pointer-events-none"
                />
              </div>

              <h3 className="text-xl font-bold text-white mb-3 relative z-10">AI-Assisted Decisions</h3>
              <p className="text-sm text-slate-300 leading-relaxed relative z-10">
                Every diagnosis is supported by predictive AI, helping clinicians make informed decisions faster.
              </p>

              <div className="mt-6 w-full h-12 relative flex items-center justify-start gap-2 opacity-30 group-hover:opacity-100 transition-opacity duration-300 z-10">
                {[1, 2, 3, 4, 5].map((dot) => (
                  <motion.div 
                    key={dot}
                    variants={{
                      hover: { scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }
                    }}
                    transition={{ repeat: Infinity, duration: 1, delay: dot * 0.15 }}
                    className="w-2.5 h-2.5 rounded-full bg-purple-400"
                  />
                ))}
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="depth-card-premium p-8 relative flex flex-col items-start cursor-pointer select-none group"
            >
              <div className="shine-effect" />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/0 to-[#8B5CF6]/0 group-hover:to-[#8B5CF6]/5 transition-all duration-500 rounded-[24px] z-0" />
              
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-6 relative z-10">
                <HeartHandshake className="w-6 h-6 text-[#4FD1C5]" />
              </div>

              <h3 className="text-xl font-bold text-white mb-3 relative z-10">Patient-Centered Care</h3>
              <p className="text-sm text-slate-300 leading-relaxed relative z-10">
                Personalized treatments, continuous monitoring, and proactive healthcare designed around every patient.
              </p>

              <div className="mt-6 w-full h-12 relative overflow-hidden opacity-30 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <svg className="w-full h-full" viewBox="0 0 200 48" fill="none">
                  <motion.path 
                    d="M 10,24 L 60,24 L 70,12 L 80,36 L 90,20 L 100,24 L 190,24" 
                    stroke="#4FD1C5" 
                    strokeWidth="2" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    variants={{
                      hover: { pathLength: [0, 1], opacity: [0.3, 1, 0.3] }
                    }}
                    transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
                  />
                </svg>
              </div>
            </motion.div>

            {/* Card 4 */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="depth-card-premium p-8 relative flex flex-col items-start cursor-pointer select-none group"
            >
              <div className="shine-effect" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/0 via-[#8B5CF6]/0 to-cyan-500/0 group-hover:to-cyan-500/5 transition-all duration-500 rounded-[24px] z-0" />
              
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-6 relative z-10">
                <ShieldCheck className="w-6 h-6 text-[#8B5CF6]" />
              </div>

              <h3 className="text-xl font-bold text-white mb-3 relative z-10">Trusted & Secure</h3>
              <p className="text-sm text-slate-300 leading-relaxed relative z-10">
                Privacy-first infrastructure with encrypted medical records and transparent AI.
              </p>

              <div className="mt-6 w-full h-12 relative overflow-hidden opacity-30 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-start">
                <div className="relative w-8 h-8 rounded-full border border-purple-500/20 flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <motion.div 
                    variants={{
                      hover: { rotate: 360 }
                    }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="absolute inset-0 w-full h-full"
                  >
                    <div className="absolute -top-1 left-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};
