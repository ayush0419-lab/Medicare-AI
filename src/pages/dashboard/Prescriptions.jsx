import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileSignature, Search, Calendar, User, Plus, Trash2, 
  Download, Eye, FileText, CheckCircle, RefreshCw, X, ArrowRight, ClipboardList
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

export const Prescriptions = () => {
  const { user, profile } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // Mode Selection: 'list' | 'create'
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // Create Prescription Form State
  const [form, setForm] = useState({
    patientId: '',
    appointmentId: '',
    diagnosis: '',
    symptoms: '',
    recommendedTests: '',
    followUpDate: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
  });

  const [saving, setSaving] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch Prescriptions based on role
      let prescriptionQuery = supabase.from('prescriptions').select(`
        *,
        patient:patient_id (
          full_name,
          phone
        ),
        doctor:doctor_id (
          full_name,
          specialty,
          phone
        )
      `);

      if (profile?.role === 'doctor') {
        prescriptionQuery = prescriptionQuery.eq('doctor_id', user.id);
      } else if (profile?.role === 'patient') {
        prescriptionQuery = prescriptionQuery.eq('patient_id', user.id);
      }
      
      const { data: presData, error: presErr } = await prescriptionQuery.order('created_at', { ascending: false });
      if (presErr) throw presErr;
      setPrescriptions(presData || []);

      // 2. Doctors need to fetch their patients & appointments for autofill dropdown
      if (profile?.role === 'doctor') {
        const { data: aptsData, error: aptsErr } = await supabase
          .from('appointments')
          .select(`
            id,
            patient_id,
            scheduled_at,
            patient:patient_id (
              full_name,
              phone
            )
          `)
          .eq('doctor_id', user.id)
          .order('scheduled_at', { ascending: false });

        if (aptsErr) throw aptsErr;
        setAppointments(aptsData || []);

        // Deduplicate patients list
        const uniquePatients = [];
        const seen = new Set();
        (aptsData || []).forEach(apt => {
          if (apt.patient && !seen.has(apt.patient_id)) {
            seen.add(apt.patient_id);
            uniquePatients.push({
              id: apt.patient_id,
              full_name: apt.patient.full_name,
              phone: apt.patient.phone
            });
          }
        });
        setPatients(uniquePatients);
      }
    } catch (err) {
      console.error('Error fetching prescriptions data:', err);
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  }, [user, profile?.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Autofill patient details from selected appointment
  const handleAppointmentSelect = (appointmentId) => {
    if (!appointmentId) {
      setForm(prev => ({ ...prev, appointmentId: '', patientId: '' }));
      return;
    }
    const apt = appointments.find(a => a.id === appointmentId);
    if (apt) {
      setForm(prev => ({ 
        ...prev, 
        appointmentId: appointmentId,
        patientId: apt.patient_id 
      }));
    }
  };

  // Medicines dynamic list helpers
  const handleMedicineChange = (index, field, value) => {
    const updated = [...form.medicines];
    updated[index][field] = value;
    setForm(prev => ({ ...prev, medicines: updated }));
  };

  const addMedicineRow = () => {
    setForm(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    }));
  };

  const removeMedicineRow = (index) => {
    if (form.medicines.length === 1) return;
    const updated = form.medicines.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, medicines: updated }));
  };

  // Professional PDF Generation using jsPDF
  const buildPDF = (prescriptionData, doctorMeta, patientMeta) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setTextColor(15, 23, 42); // slate-900

    // Header Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.text("MediCare-AI Clinic", 20, 25);
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text("Clinical Workspace & Prescription Portal", 20, 30);

    // Doctor Details (Right-aligned)
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Dr. ${doctorMeta?.full_name || 'Clinician'}`, 190, 25, { align: 'right' });
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text(doctorMeta?.specialty || 'General Practitioner', 190, 30, { align: 'right' });
    doc.text('Medicare-AI Health Hub', 190, 35, { align: 'right' });
    doc.text(doctorMeta?.phone || '+1 (555) 123-4567', 190, 40, { align: 'right' });

    // Header border divider
    doc.setDrawColor(226, 232, 240); // border-slate-200
    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45);

    // Patient info block
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text("PATIENT INFORMATION", 20, 54);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Patient Name: ${patientMeta?.full_name || 'Patient'}`, 20, 61);
    doc.text(`Contact: ${patientMeta?.phone || 'N/A'}`, 20, 66);
    doc.text(`Date: ${new Date(prescriptionData.created_at || Date.now()).toLocaleDateString()}`, 130, 61);
    doc.text(`Follow-up Date: ${prescriptionData.follow_up_date ? new Date(prescriptionData.follow_up_date).toLocaleDateString() : 'As Needed'}`, 130, 66);

    doc.line(20, 71, 190, 71);

    // Clinical Summary
    doc.setFont("Helvetica", "bold");
    doc.text("CLINICAL DIAGNOSIS", 20, 79);
    doc.setFont("Helvetica", "normal");
    doc.text(`Symptoms: ${prescriptionData.symptoms || 'None reported'}`, 20, 85);
    doc.text(`Diagnosis: ${prescriptionData.diagnosis || 'General Checkup'}`, 20, 90);

    doc.line(20, 95, 190, 95);

    // Rx Medicine Table block
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Rx", 20, 105);
    doc.setFontSize(10);

    doc.setFont("Helvetica", "bold");
    doc.text("Medicine Name", 20, 113);
    doc.text("Dosage", 80, 113);
    doc.text("Frequency", 110, 113);
    doc.text("Duration", 142, 113);
    doc.text("Instructions", 162, 113);

    doc.line(20, 115, 190, 115);

    doc.setFont("Helvetica", "normal");
    let y = 122;
    prescriptionData.medicines.forEach((med) => {
      doc.text(med.name || '-', 20, y);
      doc.text(med.dosage || '-', 80, y);
      doc.text(med.frequency || '-', 110, y);
      doc.text(med.duration || '-', 142, y);
      doc.text(med.instructions || '-', 162, y);
      y += 7;
    });

    doc.line(20, y, 190, y);
    y += 10;

    // Recommended Tests
    if (prescriptionData.recommended_tests) {
      doc.setFont("Helvetica", "bold");
      doc.text("RECOMMENDED TESTS", 20, y);
      y += 6;
      doc.setFont("Helvetica", "normal");
      doc.text(prescriptionData.recommended_tests, 20, y);
      y += 15;
    }

    // Professional footer border
    doc.line(20, 255, 190, 255);
    
    // Disclaimers
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("This is an electronically generated digital prescription powered by MediCare-AI.", 20, 261);
    doc.text("For emergency issues, contact your healthcare provider or nearest trauma ward immediately.", 20, 265);

    // Signature Area
    doc.setFontSize(10);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Dr. Signature", 160, 261, { align: 'center' });
    doc.setFont("Helvetica", "normal");
    doc.text("Authorized Signature", 160, 265, { align: 'center' });

    return doc;
  };

  // Save Prescription database trigger
  const handleSavePrescription = async (e) => {
    e.preventDefault();
    if (!form.patientId || !form.diagnosis) {
      toast.error('Patient and Diagnosis fields are required.');
      return;
    }

    setSaving(true);
    const toastId = toast.loading('Saving and generating prescription Rx...');

    try {
      // 1. Insert Prescription row metadata
      const { data: newPres, error: insertError } = await supabase
        .from('prescriptions')
        .insert([{
          doctor_id: user.id,
          patient_id: form.patientId,
          appointment_id: form.appointmentId || null,
          diagnosis: form.diagnosis,
          symptoms: form.symptoms || '',
          recommended_tests: form.recommendedTests || '',
          follow_up_date: form.followUpDate || null,
          medicines: form.medicines
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Fetch corresponding profile targets
      const patientProfile = patients.find(p => p.id === form.patientId);

      // 2. Generate PDF blob
      const doc = buildPDF(newPres, profile, patientProfile);
      const pdfBlob = doc.output('blob');

      // 3. Upload PDF blob to Supabase Storage Documents bucket
      const filePath = `${form.patientId}/prescription_${newPres.id}.pdf`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL or storage path
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // 4. Insert into patient_documents table so patient sees it in their Document Manager tab
      const { error: docError } = await supabase
        .from('patient_documents')
        .insert([{
          patient_id: form.patientId,
          file_name: `Prescription_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
          file_url: filePath,
          category: 'Prescriptions',
          file_size: pdfBlob.size
        }]);

      if (docError) {
        console.warn("Saving to patient_documents table failed, but storage was successful:", docError);
      }

      // 5. Update PDF url in prescriptions table
      const { error: updatePresErr } = await supabase
        .from('prescriptions')
        .update({ pdf_url: filePath })
        .eq('id', newPres.id);

      if (updatePresErr) throw updatePresErr;

      // 6. Push notification alert to patient dashboard
      const { error: notifErr } = await supabase
        .from('notifications')
        .insert([{
          user_id: form.patientId,
          title: "New Digital Prescription",
          message: `Dr. ${profile?.full_name} has generated a new digital prescription for you. You can download the PDF in your Documents panel.`,
          type: "success"
        }]);

      if (notifErr) {
        console.warn("Failed to push notification trigger:", notifErr);
      }

      toast.success('Digital Prescription saved and sent successfully!', { id: toastId });
      setViewMode('list');
      // Reset form
      setForm({
        patientId: '',
        appointmentId: '',
        diagnosis: '',
        symptoms: '',
        recommendedTests: '',
        followUpDate: '',
        medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
      });
      fetchData();
    } catch (err) {
      console.error('Error saving prescription:', err);
      toast.error(err.message || 'Failed to save digital prescription.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  // Download PDF locally from Storage
  const downloadPDFFile = async (filePath, fileName) => {
    const toastId = toast.loading('Downloading prescription PDF...');
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      // Trigger download trigger in browser
      const blob = new Blob([data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName || 'Prescription.pdf';
      link.click();
      toast.success('Download complete!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to download PDF file.', { id: toastId });
    }
  };

  // Search filter prescriptions list
  const filteredPrescriptions = prescriptions.filter(pres => {
    const doctorName = pres.doctor?.full_name?.toLowerCase() || '';
    const patientName = pres.patient?.full_name?.toLowerCase() || '';
    const diagnosis = pres.diagnosis?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    return doctorName.includes(query) || patientName.includes(query) || diagnosis.includes(query);
  });

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 p-6 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden font-sans shadow-2xl">
      {/* Background radial details */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f2fe05_1px,transparent_1px),linear-gradient(to_bottom,#00f2fe05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/10 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1 shadow-md">
                <FileSignature className="w-3.5 h-3.5" /> Rx prescription workspace
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
              Digital Prescriptions
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {profile?.role === 'doctor' 
                ? 'Create, edit, search, and securely transmit professional digital prescriptions directly to patient profiles.' 
                : 'Review your clinical consultation history prescriptions and download authorized PDF documents.'}
            </p>
          </div>

          {profile?.role === 'doctor' && viewMode === 'list' && (
            <button
              onClick={() => setViewMode('create')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md self-start"
            >
              <Plus className="w-4 h-4" /> Create Prescription
            </button>
          )}

          {viewMode === 'create' && (
            <button
              onClick={() => setViewMode('list')}
              className="px-4 py-2 bg-slate-900/50 hover:bg-slate-900 border border-white/10 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start"
            >
              Cancel Builder
            </button>
          )}
        </div>

        {/* ================= VIEW MODE: CREATE PRESCRIPTION ================= */}
        {viewMode === 'create' && profile?.role === 'doctor' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="depth-card bg-slate-900/40 border border-white/10 p-6 md:p-8 rounded-3xl"
          >
            <h3 className="text-base font-extrabold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-3">
              <ClipboardList className="w-5 h-5 text-indigo-400" /> Rx Prescription Builder
            </h3>

            <form onSubmit={handleSavePrescription} className="space-y-6 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Appointment select for auto-fill */}
                <div>
                  <label className="text-slate-400 block mb-1">Link Consultation / Appointment</label>
                  <select
                    value={form.appointmentId}
                    onChange={(e) => handleAppointmentSelect(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer font-semibold"
                  >
                    <option value="">-- Direct Prescription (No linked appointment) --</option>
                    {appointments.map(apt => (
                      <option key={apt.id} value={apt.id}>
                        {apt.patient?.full_name} - {new Date(apt.scheduled_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Direct Patient select */}
                <div>
                  <label className="text-slate-400 block mb-1">Select Patient *</label>
                  <select
                    required
                    value={form.patientId}
                    onChange={(e) => setForm(prev => ({ ...prev, patientId: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer font-semibold"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Diagnosis and Symptoms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-slate-400 block mb-1">Symptoms Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Mild cough, dry throat, fatigue"
                    value={form.symptoms}
                    onChange={(e) => setForm(prev => ({ ...prev, symptoms: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Clinical Diagnosis *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acute Bronchitis"
                    value={form.diagnosis}
                    onChange={(e) => setForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Medicines List Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <h4 className="text-sm font-bold text-indigo-400">Medicines (Rx)</h4>
                  <button
                    type="button"
                    onClick={addMedicineRow}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Medicine
                  </button>
                </div>

                {form.medicines.map((med, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-white/5 p-4 rounded-xl border border-white/5 relative">
                    <div className="md:col-span-3">
                      <label className="text-[10px] text-slate-400 block mb-1">Medicine Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Paracetamol 650mg"
                        value={med.name}
                        onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                        className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-1">Dosage</label>
                      <input
                        type="text"
                        placeholder="e.g. 1 tab"
                        value={med.dosage}
                        onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                        className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-1">Frequency</label>
                      <input
                        type="text"
                        placeholder="e.g. 1-0-1 (twice daily)"
                        value={med.frequency}
                        onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                        className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-1">Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 5 days"
                        value={med.duration}
                        onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                        className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-1">Instructions</label>
                      <input
                        type="text"
                        placeholder="e.g. After meals"
                        value={med.instructions}
                        onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                        className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div className="md:col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => removeMedicineRow(index)}
                        disabled={form.medicines.length === 1}
                        className="p-2 bg-slate-950 border border-white/10 text-rose-500 hover:bg-rose-500/10 rounded-xl transition cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommended Tests & Follow-up */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-slate-400 block mb-1">Recommended Diagnostic Tests</label>
                  <input
                    type="text"
                    placeholder="e.g. CBC Blood Test, Chest X-Ray"
                    value={form.recommendedTests}
                    onChange={(e) => setForm(prev => ({ ...prev, recommendedTests: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={form.followUpDate}
                    onChange={(e) => setForm(prev => ({ ...prev, followUpDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-55"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Save & Transmit Prescription
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ================= VIEW MODE: PRESCRIPTION LISTS ================= */}
        {viewMode === 'list' && (
          <div className="space-y-6">
            {/* Search filter row */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder={profile?.role === 'doctor' ? 'Search by patient name or diagnosis...' : 'Search by diagnosis...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {loading ? (
              <div className="depth-card bg-slate-900/30 border border-white/5 rounded-3xl p-16 flex flex-col items-center justify-center gap-4 min-h-[300px]">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-slate-400 text-sm font-semibold">Syncing prescriptions history...</p>
              </div>
            ) : filteredPrescriptions.length === 0 ? (
              <div className="depth-card bg-slate-900/30 border border-white/5 rounded-3xl p-16 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
                <FileText className="w-12 h-12 text-slate-500" />
                <h3 className="text-lg font-bold text-white">No prescriptions found</h3>
                <p className="text-slate-400 text-sm max-w-sm font-medium">
                  {searchQuery ? 'Adjust your search queries.' : 'No prescription records logged in this category.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredPrescriptions.map(pres => (
                  <div
                    key={pres.id}
                    className="depth-card bg-slate-900/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/20 transition-all duration-300 relative group"
                  >
                    <div>
                      {/* Top: Metadata */}
                      <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-2">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                            {new Date(pres.created_at).toLocaleDateString()}
                          </p>
                          <h4 className="font-extrabold text-sm text-white mt-1">
                            {profile?.role === 'doctor' 
                              ? `Patient: ${pres.patient?.full_name || 'Patient'}` 
                              : `Dr. ${pres.doctor?.full_name || 'Clinician'}`}
                          </h4>
                        </div>
                        <span className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <FileSignature className="w-4 h-4" />
                        </span>
                      </div>

                      {/* Content details */}
                      <div className="space-y-2 text-xs font-semibold">
                        <p className="text-slate-400">Diagnosis: <span className="text-slate-200 font-bold">{pres.diagnosis}</span></p>
                        {pres.symptoms && (
                          <p className="text-slate-400">Symptoms: <span className="text-slate-300">{pres.symptoms}</span></p>
                        )}
                        <p className="text-slate-400">Medicines: <span className="text-indigo-400 font-mono">{pres.medicines?.length || 0} items</span></p>
                        {pres.follow_up_date && (
                          <p className="text-slate-400">Follow-up: <span className="text-slate-300 font-mono">{new Date(pres.follow_up_date).toLocaleDateString()}</span></p>
                        )}
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="mt-6 pt-4 border-t border-white/5 flex gap-2 justify-end">
                      <button
                        onClick={() => setSelectedPrescription(pres)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-white/10 bg-white/5 text-slate-350 hover:text-white transition flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                      
                      {pres.pdf_url && (
                        <button
                          onClick={() => downloadPDFFile(
                            pres.pdf_url, 
                            `Prescription_${pres.diagnosis.replace(/\s+/g, '_')}_${new Date(pres.created_at).toLocaleDateString().replace(/\//g, '-')}.pdf`
                          )}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= PRESCRIPTION DETAILS MODAL ================= */}
        <AnimatePresence>
          {selectedPrescription && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={() => setSelectedPrescription(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-white/10 rounded-3xl max-w-2xl w-full p-6 relative z-10 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-indigo-400" /> Digital Prescription Details
                  </h3>
                  <button onClick={() => setSelectedPrescription(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-6 text-xs text-slate-300 font-semibold">
                  {/* Grid details */}
                  <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Clinician</p>
                      <p className="text-sm font-bold text-white">Dr. {selectedPrescription.doctor?.full_name || 'Clinician'}</p>
                      <p className="text-slate-400 mt-0.5">{selectedPrescription.doctor?.specialty || 'General Workspace'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Patient Details</p>
                      <p className="text-sm font-bold text-white">{selectedPrescription.patient?.full_name || 'Patient'}</p>
                      {selectedPrescription.patient?.phone && (
                        <p className="text-slate-400 mt-0.5 font-mono">Phone: {selectedPrescription.patient.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Diagnosis detail */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Symptoms Reported</p>
                      <p className="text-white bg-slate-950/40 p-2.5 rounded-lg border border-white/5">{selectedPrescription.symptoms || 'None reported'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Clinical Diagnosis</p>
                      <p className="text-white bg-slate-950/40 p-2.5 rounded-lg border border-white/5">{selectedPrescription.diagnosis}</p>
                    </div>
                  </div>

                  {/* Medicines table */}
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Rx Medications</p>
                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/40">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400 font-bold bg-white/5">
                            <th className="p-3 text-[10px] uppercase">Medicine Name</th>
                            <th className="p-3 text-[10px] uppercase">Dosage</th>
                            <th className="p-3 text-[10px] uppercase">Frequency</th>
                            <th className="p-3 text-[10px] uppercase">Duration</th>
                            <th className="p-3 text-[10px] uppercase">Special Instructions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPrescription.medicines?.map((med, index) => (
                            <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="p-3 font-bold text-white">{med.name}</td>
                              <td className="p-3 text-slate-350">{med.dosage || '-'}</td>
                              <td className="p-3 text-slate-350">{med.frequency || '-'}</td>
                              <td className="p-3 text-slate-350">{med.duration || '-'}</td>
                              <td className="p-3 text-slate-400 text-[10px]">{med.instructions || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tests and Follow-up */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Recommended Diagnostic Tests</p>
                      <p className="text-white bg-slate-950/40 p-2.5 rounded-lg border border-white/5">{selectedPrescription.recommended_tests || 'None'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Follow-up Schedule</p>
                      <p className="text-white bg-slate-950/40 p-2.5 rounded-lg border border-white/5 font-mono">
                        {selectedPrescription.follow_up_date ? new Date(selectedPrescription.follow_up_date).toLocaleDateString() : 'As needed'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
                  <button
                    onClick={() => setSelectedPrescription(null)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition cursor-pointer font-bold text-xs"
                  >
                    Close
                  </button>
                  {selectedPrescription.pdf_url && (
                    <button
                      onClick={() => downloadPDFFile(
                        selectedPrescription.pdf_url, 
                        `Prescription_${selectedPrescription.diagnosis.replace(/\s+/g, '_')}_${new Date(selectedPrescription.created_at).toLocaleDateString().replace(/\//g, '-')}.pdf`
                      )}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition flex items-center gap-1.5 cursor-pointer font-bold text-xs shadow-md"
                    >
                      <Download className="w-4 h-4" /> Download PDF
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
