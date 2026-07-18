import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Plus, Search, Calendar, User, Clipboard, Activity, 
  Stethoscope, Save, Edit, Trash2, Eye, X, Check, Heart, PlusCircle, MinusCircle, 
  ChevronRight, Info, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const ConsultationNotes = () => {
  const { user } = useAuth();
  const [role, setRole] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modals / Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [viewingDetails, setViewingDetails] = useState(null);

  // Form Fields
  const [selectedApptId, setSelectedApptId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [recommendedTests, setRecommendedTests] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [medicines, setMedicines] = useState([]); // Array of { name, dosage, freq, duration }

  // Fetch User Role
  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('role').eq('id', user.id).single()
        .then(({ data }) => setRole(data?.role || 'patient'));
    }
  }, [user]);

  // Fetch Consultations and Appointments
  const fetchData = useCallback(async () => {
    if (!user || !role) return;
    setLoading(true);

    try {
      if (role === 'doctor') {
        // Fetch doctor's consultations
        const { data: cData, error: cErr } = await supabase
          .from('consultation_notes')
          .select(`
            *,
            patient:patient_id (
              full_name,
              avatar_url
            )
          `)
          .eq('doctor_id', user.id)
          .order('created_at', { ascending: false });

        if (cErr) throw cErr;
        setConsultations(cData || []);

        // Fetch doctor's appointments to link
        const { data: aData, error: aErr } = await supabase
          .from('appointments')
          .select(`
            id,
            appointment_date,
            appointment_time,
            patient_id,
            patient:patient_id (
              full_name
            )
          `)
          .eq('doctor_id', user.id)
          .eq('status', 'scheduled')
          .order('appointment_date', { ascending: true });

        if (aErr) throw aErr;
        setAppointments(aData || []);
      } else {
        // Fetch patient's consultations
        const { data: cData, error: cErr } = await supabase
          .from('consultation_notes')
          .select(`
            *,
            doctor:doctor_id (
              full_name
            )
          `)
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false });

        if (cErr) throw cErr;
        setConsultations(cData || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load consultation records.');
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Form Open
  const handleOpenForm = (existing = null) => {
    if (existing) {
      setSelectedConsultation(existing);
      setSelectedApptId(existing.appointment_id || '');
      setDiagnosis(existing.diagnosis);
      setSymptoms(existing.symptoms || '');
      setTreatmentNotes(existing.treatment_notes || '');
      setRecommendedTests(existing.recommended_tests || '');
      setFollowUpInstructions(existing.follow_up_instructions || '');
      setNextVisitDate(existing.next_visit_date || '');
      setMedicines(existing.prescribed_medicines || []);
    } else {
      setSelectedConsultation(null);
      setSelectedApptId('');
      setDiagnosis('');
      setSymptoms('');
      setTreatmentNotes('');
      setRecommendedTests('');
      setFollowUpInstructions('');
      setNextVisitDate('');
      setMedicines([]);
    }
    setIsFormOpen(true);
  };

  // Dynamic Medicine Handlers
  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const handleRemoveMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!diagnosis) {
      toast.error('Diagnosis is required.');
      return;
    }

    let targetPatientId = user.id;
    let appointmentIdVal = selectedApptId || null;

    if (role === 'doctor') {
      if (selectedConsultation) {
        targetPatientId = selectedConsultation.patient_id;
      } else {
        const matchingAppt = appointments.find(a => a.id === selectedApptId);
        if (!matchingAppt) {
          toast.error('Please select an appointment to link the notes to.');
          return;
        }
        targetPatientId = matchingAppt.patient_id;
      }
    }

    const payload = {
      patient_id: targetPatientId,
      doctor_id: user.id,
      appointment_id: appointmentIdVal,
      diagnosis,
      symptoms,
      treatment_notes: treatmentNotes,
      recommended_tests: recommendedTests,
      follow_up_instructions: followUpInstructions,
      next_visit_date: nextVisitDate ? nextVisitDate : null,
      prescribed_medicines: medicines
    };

    try {
      if (selectedConsultation) {
        // Update existing consultation
        const { error } = await supabase
          .from('consultation_notes')
          .update(payload)
          .eq('id', selectedConsultation.id);

        if (error) throw error;
        toast.success('Consultation notes updated successfully!');
      } else {
        // Insert new consultation
        const { error } = await supabase
          .from('consultation_notes')
          .insert([payload]);

        if (error) throw error;

        // Auto-create a general medical record for sync
        await supabase
          .from('medical_records')
          .insert([{
            patient_id: targetPatientId,
            doctor_id: user.id,
            diagnosis,
            notes: treatmentNotes,
            prescription: medicines.map(m => `${m.name} (${m.dosage}) - ${m.frequency}`).join('\n')
          }]);

        // Push notification to patient
        await supabase
          .from('notifications')
          .insert([{
            user_id: targetPatientId,
            title: "New Consultation Notes Added",
            message: `Dr. ${user.user_metadata?.full_name || 'your physician'} has uploaded the consultation summary for your visit.`,
            type: "info"
          }]);

        toast.success('Consultation notes saved & linked!');
      }

      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save consultation notes.');
    }
  };

  // Filter consultations
  const filteredConsultations = consultations.filter(c => {
    const patientName = role === 'doctor' 
      ? (c.patient?.full_name?.toLowerCase() || '') 
      : (c.doctor?.full_name?.toLowerCase() || '');
    
    const matchesSearch = patientName.includes(searchQuery.toLowerCase()) || 
                          c.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = !dateFilter || c.created_at.startsWith(dateFilter);

    return matchesSearch && matchesDate;
  });

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 p-6 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden font-sans shadow-2xl">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f2fe05_1px,transparent_1px),linear-gradient(to_bottom,#00f2fe05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Block */}
        <div className="border-b border-white/10 pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1 shadow-md">
                <Clipboard className="w-3.5 h-3.5" /> Clinical Documentation
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
              Consultation Notes
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {role === 'doctor' 
                ? 'Create, edit, and manage comprehensive SOAP consultation notes for your patients.' 
                : 'Access clinical visit notes, diagnosis, prescribed medicines, and instructions from your doctors.'
              }
            </p>
          </div>

          {role === 'doctor' && (
            <button
              onClick={() => handleOpenForm()}
              className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-650 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md self-start md:self-center"
            >
              <Plus className="w-4 h-4" /> Create Consultation Note
            </button>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="depth-card bg-slate-900/40 border border-white/10 p-5 rounded-2xl mb-6 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder={role === 'doctor' ? "Search by patient name or diagnosis..." : "Search by doctor or diagnosis..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="relative w-full sm:w-48">
            <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Consultation list */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
            <p className="text-xs">Fetching clinical consultation history...</p>
          </div>
        ) : filteredConsultations.length === 0 ? (
          <div className="depth-card bg-slate-900/30 border border-white/5 rounded-2xl p-16 text-center text-slate-400">
            <Clipboard className="w-10 h-10 text-slate-650 mx-auto mb-4" />
            <h3 className="text-sm font-bold text-white">No Consultation Notes Found</h3>
            <p className="text-xs text-slate-500 mt-1">There are no documented clinical visits matching the active filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConsultations.map(c => (
              <div 
                key={c.id}
                className="depth-card bg-slate-900/40 border border-white/10 p-5 rounded-2xl hover:border-white/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                      Visit
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <User className="w-4 h-4 text-cyan-400" />
                    {role === 'doctor' ? c.patient?.full_name : `Dr. ${c.doctor?.full_name}`}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 font-semibold line-clamp-1">
                    Diagnosis: <span className="text-indigo-400 font-bold">{c.diagnosis}</span>
                  </p>

                  {c.symptoms && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      Symptoms: {c.symptoms}
                    </p>
                  )}
                </div>

                <div className="mt-5 border-t border-white/5 pt-4 flex gap-2 justify-end">
                  <button
                    onClick={() => setViewingDetails(c)}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition text-slate-300"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>

                  {role === 'doctor' && (
                    <button
                      onClick={() => handleOpenForm(c)}
                      className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-650 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition text-white"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Note
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* CREATE/EDIT MODAL */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/15 rounded-3xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto font-sans shadow-2xl relative custom-scrollbar"
            >
              <button 
                onClick={() => setIsFormOpen(false)}
                className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-black text-white flex items-center gap-2 mb-5">
                <Clipboard className="w-5 h-5 text-indigo-400" />
                {selectedConsultation ? 'Edit Consultation Note' : 'Create Consultation Note'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Appointment select */}
                {!selectedConsultation && (
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Select Scheduled Appointment</label>
                    <select
                      value={selectedApptId}
                      onChange={(e) => setSelectedApptId(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-350 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      required
                    >
                      <option value="">-- Choose Patient Appointment --</option>
                      {appointments.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.patient?.full_name} - {new Date(a.appointment_date).toLocaleDateString()} ({a.appointment_time})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Diagnosis</label>
                    <input
                      type="text"
                      placeholder="e.g. Essential Hypertension"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Chief Symptoms</label>
                    <input
                      type="text"
                      placeholder="e.g. Mild headache, palpitations"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Treatment & Clinical Notes</label>
                  <textarea
                    rows="3"
                    placeholder="Describe clinical findings, physical check results, and diagnostic SOAP details..."
                    value={treatmentNotes}
                    onChange={(e) => setTreatmentNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Dynamic Prescribed Medicines Builder */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Prescribed Medicines</span>
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="text-xs font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" /> Add Medicine
                    </button>
                  </div>

                  {medicines.length === 0 ? (
                    <p className="text-[11px] text-slate-550 font-semibold italic text-center py-2">No medications added yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {medicines.map((m, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-950/40 p-3 rounded-xl border border-white/5">
                          <div className="col-span-4">
                            <input
                              type="text"
                              placeholder="Name"
                              value={m.name}
                              onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)}
                              className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                              required
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="text"
                              placeholder="Dosage (500mg)"
                              value={m.dosage}
                              onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                              className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="text"
                              placeholder="Freq"
                              value={m.frequency}
                              onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                              className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="text"
                              placeholder="Duration"
                              value={m.duration}
                              onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                              className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div className="col-span-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicine(idx)}
                              className="text-rose-450 hover:text-rose-400 cursor-pointer"
                            >
                              <MinusCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Recommended Tests</label>
                    <input
                      type="text"
                      placeholder="e.g. Lipid panel repeat, HbA1c"
                      value={recommendedTests}
                      onChange={(e) => setRecommendedTests(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Next Visit Date</label>
                    <input
                      type="date"
                      value={nextVisitDate}
                      onChange={(e) => setNextVisitDate(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Follow-up Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. Exercise for 30 minutes, limit caffeine intake"
                    value={followUpInstructions}
                    onChange={(e) => setFollowUpInstructions(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition"
                >
                  <Save className="w-4 h-4" /> Save Consultation Note
                </button>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILS VIEW MODAL */}
      <AnimatePresence>
        {viewingDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/15 rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto font-sans shadow-2xl relative custom-scrollbar space-y-6"
            >
              <button 
                onClick={() => setViewingDetails(null)}
                className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                  {new Date(viewingDetails.created_at).toLocaleDateString()} at {new Date(viewingDetails.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
                  <Clipboard className="w-5 h-5 text-indigo-400" />
                  Consultation Record
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-semibold">
                  Clinician: Dr. {viewingDetails.doctor?.full_name} &bull; Patient: {viewingDetails.patient?.full_name}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/5 pt-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-black">Diagnosis</h4>
                    <p className="text-sm font-bold text-white mt-1">{viewingDetails.diagnosis}</p>
                  </div>

                  {viewingDetails.symptoms && (
                    <div>
                      <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-black">Reported Symptoms</h4>
                      <p className="text-xs text-slate-350 mt-1 font-medium leading-relaxed">{viewingDetails.symptoms}</p>
                    </div>
                  )}

                  {viewingDetails.treatment_notes && (
                    <div>
                      <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-black">Treatment & Clinical Notes</h4>
                      <p className="text-xs text-slate-350 mt-1 font-medium leading-relaxed whitespace-pre-wrap">{viewingDetails.treatment_notes}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {viewingDetails.recommended_tests && (
                    <div>
                      <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-black">Recommended Diagnostic Tests</h4>
                      <p className="text-xs text-slate-350 mt-1 font-medium leading-relaxed">{viewingDetails.recommended_tests}</p>
                    </div>
                  )}

                  {viewingDetails.follow_up_instructions && (
                    <div>
                      <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-black">Follow-up Instructions</h4>
                      <p className="text-xs text-slate-350 mt-1 font-medium leading-relaxed">{viewingDetails.follow_up_instructions}</p>
                    </div>
                  )}

                  {viewingDetails.next_visit_date && (
                    <div>
                      <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-black">Next Follow-up Visit</h4>
                      <p className="text-xs text-cyan-400 mt-1 font-bold flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(viewingDetails.next_visit_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {viewingDetails.prescribed_medicines?.length > 0 && (
                <div className="border-t border-white/5 pt-4 space-y-2">
                  <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-black mb-2">Prescribed Medications</h4>
                  <div className="overflow-hidden border border-white/10 rounded-xl bg-slate-950/40">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 bg-white/5 text-[9px] uppercase font-bold">
                          <th className="p-2.5">Medicine Name</th>
                          <th className="p-2.5">Dosage</th>
                          <th className="p-2.5">Frequency</th>
                          <th className="p-2.5">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingDetails.prescribed_medicines.map((m, idx) => (
                          <tr key={idx} className="border-b border-white/5 last:border-0 text-xs font-semibold">
                            <td className="p-2.5 text-white">{m.name}</td>
                            <td className="p-2.5 text-slate-350">{m.dosage}</td>
                            <td className="p-2.5 text-slate-350">{m.frequency}</td>
                            <td className="p-2.5 text-slate-400 font-mono">{m.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <button
                onClick={() => setViewingDetails(null)}
                className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-slate-300 transition cursor-pointer"
              >
                Close Record
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
