import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Stethoscope, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MedicalScene } from '../components/three/MedicalScene';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Fix bug: pass email and password as an object
      await signIn({ email, password });
      toast.success('Authentication successful');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    image: "url('/bg_doctor.png')",
    overlay: 'bg-emerald-900/40',
    icon: <Stethoscope className="text-white h-5 w-5" />,
    iconBg: 'bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md',
    title: 'Clinical Portal',
    btn: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/40',
    border: 'border-emerald-400'
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 font-sans relative bg-cover bg-center"
      style={{ backgroundImage: theme.image }}
    >
      <div className={`absolute inset-0 ${theme.overlay} backdrop-blur-sm mix-blend-multiply`}></div>
      <MedicalScene variant="hero" role="doctor" className="absolute inset-0 z-[1] opacity-[0.45] mix-blend-screen" />
      
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-1 text-sm font-bold text-white hover:text-slate-200 transition-colors z-10 drop-shadow-md">
        <ChevronLeft className="h-4 w-4" /> Back to home
      </Link>

      <div className="w-full max-w-sm z-10">
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className={`w-12 h-12 rounded-xl ${theme.iconBg} flex items-center justify-center mb-6 shadow-2xl`}>
            {theme.icon}
          </div>
          <h1 className="text-3xl font-black text-white mb-2 drop-shadow-lg tracking-tight">{theme.title}</h1>
          <p className="text-sm font-bold text-white/80 drop-shadow-md">Sign in to continue to MediCare-AI.</p>
        </div>

        <div className={`depth-card bg-white/10 backdrop-blur-2xl border border-white/20 p-6 md:p-8 border-t-4 ${theme.border}`}>
          <form onSubmit={handleLogin} className="space-y-5">
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-white drop-shadow-sm">Email address</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white transition-all shadow-inner"
                placeholder="doctor@medicare.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white drop-shadow-sm">Password</label>
                <Link to="/forgot-password" className="text-xs font-bold text-white/70 hover:text-white transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white transition-all shadow-inner"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full text-white px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5 ${theme.btn}`}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Secure Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm font-bold text-white/80 mt-8 drop-shadow-md">
          Don't have an account?{' '}
          <Link to="/signup" className="font-black text-white hover:underline underline-offset-4">
            Request access
          </Link>
        </p>

      </div>
    </div>
  );
};
