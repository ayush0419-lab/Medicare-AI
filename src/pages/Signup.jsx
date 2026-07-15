import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Stethoscope, ChevronLeft, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MedicalScene } from '../components/three/MedicalScene';

export const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [role, setRole] = useState('patient'); // 'patient' or 'doctor'
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: role,
      });
      toast.success('Registration successful');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const theme = role === 'doctor' ? {
    image: "url('/bg_doctor.png')",
    overlay: 'bg-emerald-900/40',
    icon: <Stethoscope className="text-white h-5 w-5" />,
    iconBg: 'bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md',
    title: 'Clinical Registration',
    subtitle: 'Enter your clinical details to request access.',
    btn: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/40',
    border: 'border-emerald-400',
    nameLabel: 'Full Legal Name',
    namePlaceholder: 'Dr. Sarah Connor'
  } : {
    image: "url('/bg_patient.png')",
    overlay: 'bg-blue-900/40',
    icon: <User className="text-white h-5 w-5" />,
    iconBg: 'bg-blue-500/20 border border-blue-400/30 backdrop-blur-md',
    title: 'Patient Registration',
    subtitle: 'Enter your details to create a patient profile.',
    btn: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/40',
    border: 'border-blue-400',
    nameLabel: 'Full Name',
    namePlaceholder: 'Sarah Connor'
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 font-sans relative bg-cover bg-center transition-all duration-500"
      style={{ backgroundImage: theme.image }}
    >
      <div className={`absolute inset-0 ${theme.overlay} backdrop-blur-sm mix-blend-multiply transition-colors duration-500`}></div>
      <MedicalScene variant="hero" role={role} className="absolute inset-0 z-[1] opacity-[0.45] mix-blend-screen" />
      
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-1 text-sm font-bold text-white hover:text-slate-200 transition-colors z-10 drop-shadow-md">
        <ChevronLeft className="h-4 w-4" /> Back to home
      </Link>

      <div className="w-full max-w-sm z-10">
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className={`w-12 h-12 rounded-xl ${theme.iconBg} flex items-center justify-center mb-6 shadow-2xl transition-all duration-500`}>
            {theme.icon}
          </div>
          <h1 className="text-3xl font-black text-white mb-2 drop-shadow-lg tracking-tight transition-all duration-500">{theme.title}</h1>
          <p className="text-sm font-bold text-white/80 drop-shadow-md transition-all duration-500">{theme.subtitle}</p>
        </div>

        <div className={`depth-card bg-white/10 backdrop-blur-2xl border border-white/20 p-6 md:p-8 border-t-4 transition-all duration-500 ${theme.border}`}>
          
          {/* Tab Selector */}
          <div className="flex bg-white/10 backdrop-blur-md rounded-xl p-1 mb-6 border border-white/10">
            <button
              type="button"
              onClick={() => setRole('patient')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                role === 'patient'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                role === 'doctor'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Clinical
            </button>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-white drop-shadow-sm">{theme.nameLabel}</label>
              <input 
                type="text" 
                name="fullName"
                required 
                value={formData.fullName}
                onChange={handleChange}
                className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white transition-all shadow-inner"
                placeholder={theme.namePlaceholder}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-white drop-shadow-sm">Email address</label>
              <input 
                type="email" 
                name="email"
                required 
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white transition-all shadow-inner"
                placeholder="contact@email.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-white drop-shadow-sm">Create Password</label>
              <input 
                type="password" 
                name="password"
                required 
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white transition-all shadow-inner"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full text-white px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5 mt-4 cursor-pointer ${theme.btn}`}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Registration'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm font-bold text-white/80 mt-8 drop-shadow-md">
          Already have an account?{' '}
          <Link to="/login" className="font-black text-white hover:underline underline-offset-4">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
};
