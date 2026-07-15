import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const usePatients = () => {
  const { profile } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPatients = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Base query
      let query = supabase
        .from('patients')
        .select(`
          *,
          profile:profile_id (
            full_name,
            phone,
            avatar_url,
            gender,
            blood_type,
            date_of_birth
          )
        `);

      // Role-based filtering
      if (profile.role === 'doctor') {
        query = query.eq('assigned_doctor_id', profile.id);
      } else if (profile.role === 'patient') {
        query = query.eq('profile_id', profile.id);
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Normalize fields so the frontend can safely display them
      const normalizedData = (data || []).map(p => ({
        ...p,
        full_name: p.profile?.full_name || p.full_name || 'Unknown Patient',
        condition: p.condition || p.conditions?.[0] || 'None',
        risk_level: p.risk_level || (p.status === 'critical' ? 'High' : 'Low')
      }));

      setPatients(normalizedData);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();

    const channel = supabase
      .channel(`patients_${profile?.id || 'anon'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        fetchPatients();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.role]);

  const addPatient = async (patientData) => {
    try {
      const insertData = {
        ...patientData,
        assigned_doctor_id: profile?.role === 'doctor' ? profile.id : null
      };
      const { data, error: addError } = await supabase
        .from('patients')
        .insert([insertData])
        .select()
        .single();

      if (addError) throw addError;
      toast.success('Patient added successfully');
      return data;
    } catch (err) {
      toast.error(err.message);
      return null;
    }
  };

  const uploadMedicalReport = async (patientId, file, reportType = 'other') => {
    if (!profile) return null;
    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}-${Math.random()}.${fileExt}`;
      const filePath = `reports/${fileName}`;

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // documents bucket is PRIVATE — use signed URL (1 hour expiry)
      const { data: signedData, error: signedError } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600);

      if (signedError) throw signedError;
      const publicUrl = signedData.signedUrl;

      // Save to report_analyses
      const { data: record, error: dbError } = await supabase
        .from('report_analyses')
        .insert([{
          patient_id: patientId,
          uploaded_by: profile.id,
          report_type: reportType,
          file_url: publicUrl,
          file_name: file.name,
          status: 'pending'
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      toast.success('Document uploaded successfully!', { id: toastId });
      return record;
    } catch (err) {
      toast.error('Failed to upload document: ' + err.message, { id: toastId });
      return null;
    }
  };

  return { patients, loading, error, refreshPatients: fetchPatients, addPatient, uploadMedicalReport };
};
