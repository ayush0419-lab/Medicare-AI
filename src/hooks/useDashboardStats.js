import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const useDashboardStats = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_dashboard_stats', {
        user_role: profile.role,
        user_id: profile.id
      });

      if (rpcError) throw rpcError;
      setStats(data);
    } catch (err) {
      console.error('Stats fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [profile?.id, profile?.role]);

  return { stats, loading, error, refreshStats: fetchStats };
};
