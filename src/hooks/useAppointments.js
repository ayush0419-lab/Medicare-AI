import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const useAppointments = () => {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAppointments = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patient_id (
            full_name,
            avatar_url
          ),
          doctor:doctor_id (
            full_name,
            avatar_url,
            specialty
          )
        `);

      if (profile.role === 'doctor') {
        query = query.eq('doctor_id', profile.id);
      } else if (profile.role === 'patient') {
        query = query.eq('patient_id', profile.id);
      }

      const { data, error: fetchError } = await query.order('scheduled_at', { ascending: true });

      if (fetchError) throw fetchError;
      setAppointments(data || []);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();

    const filterCol = profile?.role === 'doctor' ? 'doctor_id' : 'patient_id';
    const channel = supabase
      .channel(`appointments_${profile?.id || 'anon'}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: profile?.role === 'admin' ? undefined : `${filterCol}=eq.${profile?.id}`,
      }, () => {
        fetchAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.role]);

  const scheduleAppointment = async (aptData) => {
    try {
      const { data, error: addError } = await supabase
        .from('appointments')
        .insert([aptData])
        .select()
        .single();

      if (addError) throw addError;
      toast.success('Appointment scheduled');
      return data;
    } catch (err) {
      toast.error(err.message);
      return null;
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (updateError) throw updateError;
      toast.success(`Appointment ${status}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return { appointments, loading, error, refreshAppointments: fetchAppointments, scheduleAppointment, updateStatus };
};
