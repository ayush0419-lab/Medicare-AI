import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, KeyRound, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MedicalScene } from '../components/three/MedicalScene';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(email);
      toast.success('Password reset link sent to your email');
      setEmail('');
    } catch (error) {
      toast.error(error.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 font-sans relative bg-cover bg-center"
      style={{ backgroundImage: "url('/slide5.png')" }}
    >
      <div className="absolute inset-0 bg-white/40 backdrop-blur-md"></div>
      <MedicalScene variant="hero" role="hospital" className="absolute inset-0 z-[1] opacity-50" />

      <Link to="/login" className="absolute top-8 left-8 flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-indigo-700 transition-colors z-10">
        <ChevronLeft className="h-4 w-4" /> Back to login
      </Link>

      <div className="w-full max-w-sm z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-6">
            <KeyRound className="text-slate-900 h-5 w-5" />
          </div>
          <h1 className="text-3xl heading-elite mb-2 drop-shadow-sm">Reset Password</h1>
          <p className="text-sm font-semibold text-slate-600 drop-shadow-sm">Enter your email to receive a reset link.</p>
        </div>

        <div className="depth-card bg-white/60 backdrop-blur-xl border border-white/60 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Email address</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
                placeholder="user@medicare.com"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5 hover:bg-slate-800"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
