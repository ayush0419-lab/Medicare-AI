import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch profile from profiles table ────────────────────────────────────
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') console.error('Profile fetch error:', error);
      setProfile(data || null);
    } catch (err) {
      console.error('Profile fetch exception:', err);
      setProfile(null);
    }
  };

  // ── Initialize session on mount ──────────────────────────────────────────
  useEffect(() => {
    let active = true;

    // Listen for auth changes - automatically retrieves initial session on subscribe
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        if (!active) return;
        setSession(s);
        setUser(s?.user ?? null);
        try {
          if (s?.user) {
            await fetchProfile(s.user.id);
          } else {
            setProfile(null);
          }
        } catch (err) {
          console.error('onAuthStateChange profile error:', err);
        } finally {
          if (active) setLoading(false);
        }
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // ── Sign Up ──────────────────────────────────────────────────────────────
  const signUp = async ({ email, password, fullName, role, phone, specialty, organization }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, phone },
      },
    });
    if (error) throw error;

    // Insert profile (the trigger also does this, but we add extra fields)
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        role,
        phone: phone || null,
        specialty: role === 'doctor' ? (specialty || null) : null,
        organization: role === 'admin' ? (organization || null) : null,
      });
      if (profileError) console.error('Profile insert error:', profileError);
      await fetchProfile(data.user.id);
    }

    return data;
  };

  // ── Sign In ──────────────────────────────────────────────────────────────
  const signIn = async ({ email, password }) => {
    // Ensure email & password are trimmed
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    // Profile will be fetched by onAuthStateChange listener
    return data;
  };

  // ── Custom OTP (Email via Resend / SMS via Twilio, Edge Functions) ────────
  const sendOtpLogin = async ({ email, phone }) => {
    if (!email && !phone) throw new Error('Provide an email or phone number');

    const identifier = email || phone;
    const type = email ? 'email' : 'sms';

    const res = await supabase.functions.invoke('send-otp', {
      body: { identifier, type, name: null },
    });

    if (res.error) throw res.error;
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  };

  const verifyOtp = async ({ email, phone, token }) => {
    const identifier = email || phone;
    const type = email ? 'email' : 'sms';

    const res = await supabase.functions.invoke('verify-otp', {
      body: { identifier, code: token, type },
    });

    if (res.error) throw res.error;
    if (res.data?.error) throw new Error(res.data.error);

    // Edge function returns an action_link — we exchange it for a session
    // by navigating the user transparently through the link
    const { action_link } = res.data;
    if (action_link) {
      // Supabase action_link sets the session cookie when opened
      window.location.href = action_link;
    }

    return res.data;
  };

  // ── Password Reset ───────────────────────────────────────────────────────
  const requestPasswordReset = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  };

  const updateUserPassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  };

  // ── Sign Out ─────────────────────────────────────────────────────────────
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  // ── Update Profile ───────────────────────────────────────────────────────
  const updateProfile = async (updates) => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    sendOtpLogin,
    verifyOtp,
    requestPasswordReset,
    updateUserPassword,
    signOut,
    updateProfile,
    fetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
