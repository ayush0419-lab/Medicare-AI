import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { 
  User, Lock, Loader2, Camera, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Settings = () => {
  const { user, requestPasswordReset } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const [activeTab, setActiveTab] = useState('general');
  
  const [formData, setFormData] = useState({
    full_name: '',
    role: '',
    avatar_url: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [resettingPwd, setResettingPwd] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        role: profile.role || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    setResettingPwd(true);
    try {
      await requestPasswordReset(user.email);
      toast.success('Password reset email sent');
    } catch {
      toast.error('Failed to send reset email');
    } finally {
      setResettingPwd(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      
      {/* Minimal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 mb-8">
        <div>
          <h2 className="text-2xl heading-elite">Settings</h2>
          <p className="text-sm subheading-elite mt-1">Manage your account settings and preferences.</p>
        </div>
      </div>

      <div className="depth-stage flex flex-col md:flex-row gap-12">
        
        {/* Minimal Sidebar Navigation */}
        <aside className="w-full md:w-56 shrink-0">
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-4 md:pb-0 hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                  ? 'bg-slate-100 text-slate-900' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Settings Area */}
        <div className="depth-card stripe-card flex-1 p-6 md:p-8">
          
          {activeTab === 'general' && (
            <div className="space-y-8">
              
              <div className="border-b border-slate-200/80 pb-8">
                <h3 className="text-base font-semibold text-slate-900 mb-6">Profile Information</h3>
                
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center relative group overflow-hidden">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-slate-400">
                        {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <button className="btn-minimal-outline mb-2">Upload avatar</button>
                    <p className="text-xs text-slate-500">JPG, GIF or PNG. 1MB max.</p>
                  </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-5 max-w-lg">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                    <input 
                      type="text" 
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="input-elite"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Role</label>
                    <input 
                      type="text" 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="input-elite"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <input 
                      type="email" 
                      value={user?.email || ''}
                      disabled
                      className="input-elite bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500 mt-1">Please contact support to change your email.</p>
                  </div>

                  <div className="pt-4">
                    <button type="submit" disabled={isSaving} className="btn-minimal">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save changes
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8">
              <div className="border-b border-slate-200/80 pb-8">
                <h3 className="text-base font-semibold text-slate-900 mb-6">Password</h3>
                <p className="text-sm text-slate-500 mb-6">Receive an email with a secure link to update your password.</p>
                <button 
                  onClick={handlePasswordReset}
                  disabled={resettingPwd}
                  className="btn-minimal-outline"
                >
                  {resettingPwd && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Send password reset email
                </button>
              </div>

              <div className="border-b border-slate-200/80 pb-8">
                <h3 className="text-base font-semibold text-slate-900 mb-6">Two-factor authentication</h3>
                <p className="text-sm text-slate-500 mb-6">Add an extra layer of security to your account. We recommend using a hardware key.</p>
                <button className="btn-minimal-outline" disabled>
                  Enable 2FA
                </button>
              </div>
              
              <div className="pb-8">
                <h3 className="text-base font-semibold text-red-600 mb-6">Danger zone</h3>
                <p className="text-sm text-slate-500 mb-6">Permanently delete your account and all of your content.</p>
                <button 
                  className="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
                  onClick={() => toast.error('Contact support to delete an active provider account.')}
                >
                  Delete account
                </button>
              </div>
            </div>
          )}



        </div>
      </div>
    </div>
  );
};
