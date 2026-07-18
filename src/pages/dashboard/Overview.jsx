import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { usePatients } from '../../hooks/usePatients';
import { useAppointments } from '../../hooks/useAppointments';
import { 
  Users, Calendar, Activity, Clock, CheckCircle, AlertCircle, 
  FileText, Plus, Eye, BookOpen, Heart, ShieldAlert, Sparkles, 
  ArrowRight, Search, FileSignature, ClipboardList, X, ChevronRight,
  TrendingUp, Award, UserPlus, Stethoscope, MapPin
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Skeleton Shimmer for Metrics/Lists
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg ${className}`} />
);

const MetricSkeleton = () => (
  <div className="depth-card holo-surface p-6 flex flex-col justify-between h-32">
    <div className="flex justify-between items-center">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-4 w-4 rounded" />
    </div>
    <Skeleton className="h-8 w-16 mt-3" />
  </div>
);

export const Overview = () => {
  const { profile } = useAuth();
  const { patients, loading: patientsLoading } = usePatients();
  const { appointments, loading: aptLoading, updateStatus } = useAppointments();
  const navigate = useNavigate();

  // Admin Specific States
  const [adminStats, setAdminStats] = useState({
    allProfiles: [],
    allReports: [],
    loading: true
  });
  const [showAdminApproveModal, setShowAdminApproveModal] = useState(false);
  const [showAdminAppointmentsModal, setShowAdminAppointmentsModal] = useState(false);
  const [showAdminPatientsModal, setShowAdminPatientsModal] = useState(false);
  const [showAdminHospitalsModal, setShowAdminHospitalsModal] = useState(false);

  const fetchAdminData = async () => {
    try {
      const { data: pData } = await supabase.from('profiles').select('*');
      const { data: rData } = await supabase.from('report_analyses').select('*');
      setAdminStats({
        allProfiles: pData || [],
        allReports: rData || [],
        loading: false
      });
    } catch (err) {
      console.error("Error loading admin overview stats:", err);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAdminData();
    }
  }, [profile]);

  // Modals States for Quick Actions
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showPatientSidebar, setShowPatientSidebar] = useState(false);

  // Form States for Prescriptions
  const [prescriptionForm, setPrescriptionForm] = useState({
    patientId: '',
    medication: '',
    dosage: '',
    duration: '',
    instructions: ''
  });

  // Form States for Notes
  const [notesForm, setNotesForm] = useState({
    patientId: '',
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });

  const isLoading = patientsLoading || aptLoading;

  // Filtered lists for metrics
  const upcomingApt = isLoading ? [] : appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed');
  const pendingApts = isLoading ? [] : appointments.filter(a => a.status === 'pending');
  const completedApts = isLoading ? [] : appointments.filter(a => a.status === 'completed');
  const highRisk = isLoading ? [] : patients.filter(p => p.risk_level === 'High');

  // Filter for today's appointments
  const todayApts = isLoading ? [] : appointments.filter(a => {
    const aptDate = new Date(a.scheduled_at).toDateString();
    const todayDate = new Date().toDateString();
    return aptDate === todayDate && a.status !== 'cancelled';
  });

  // Handlers for Compose Prescriptions
  const handlePrescriptionSubmit = (e) => {
    e.preventDefault();
    if (!prescriptionForm.patientId || !prescriptionForm.medication) {
      toast.error("Please fill in the patient and medication.");
      return;
    }
    const patientName = patients.find(p => p.profile_id === prescriptionForm.patientId)?.full_name || 'Patient';
    toast.success(`Digital prescription composed for ${patientName}!`);
    setShowPrescriptionModal(false);
    setPrescriptionForm({ patientId: '', medication: '', dosage: '', duration: '', instructions: '' });
  };

  // Handlers for SOAP Notes
  const handleNotesSubmit = (e) => {
    e.preventDefault();
    if (!notesForm.patientId || !notesForm.assessment) {
      toast.error("Please fill in the patient and assessment.");
      return;
    }
    const patientName = patients.find(p => p.profile_id === notesForm.patientId)?.full_name || 'Patient';
    toast.success(`SOAP notes successfully saved for ${patientName}!`);
    setShowNotesModal(false);
    setNotesForm({ patientId: '', subjective: '', objective: '', assessment: '', plan: '' });
  };

  // Render Admin Dashboard View
  if (profile?.role === 'admin') {
    const totalPatients = adminStats.allProfiles.filter(p => p.role === 'patient').length;
    const totalDoctors = adminStats.allProfiles.filter(p => p.role === 'doctor').length;
    const pendingApprovals = adminStats.allProfiles.filter(p => p.role === 'doctor' && p.approved === false).length;
    const activeUsers = adminStats.allProfiles.length;
    const totalAppointmentsCount = appointments.length;

    // Merge recent activities
    const recentActivities = [
      ...adminStats.allProfiles.filter(p => p.role === 'patient').map(p => ({
        type: 'registration',
        title: 'New Patient Registered',
        desc: p.full_name,
        time: new Date(p.created_at)
      })),
      ...adminStats.allProfiles.filter(p => p.role === 'doctor').map(p => ({
        type: 'doctor_signup',
        title: 'Doctor Account Created',
        desc: `Dr. ${p.full_name} (${p.specialty || 'General'})`,
        time: new Date(p.created_at),
        approved: p.approved,
        id: p.id
      })),
      ...appointments.map(a => ({
        type: 'booking',
        title: 'Appointment Booked',
        desc: `Appointment scheduled for ${new Date(a.appointment_date).toLocaleDateString()}`,
        time: new Date(a.created_at)
      })),
      ...adminStats.allReports.map(r => ({
        type: 'report',
        title: 'Medical Report Uploaded',
        desc: `${r.file_name} (${r.report_type.replace('_', ' ')})`,
        time: new Date(r.created_at)
      }))
    ].sort((a, b) => b.time - a.time).slice(0, 8);

    // Chart analytics (Appointments by day of week)
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const apptsByDay = daysOfWeek.map((day, idx) => {
      return appointments.filter(a => {
        const d = new Date(a.created_at).getDay();
        const mapped = d === 0 ? 6 : d - 1;
        return mapped === idx;
      }).length;
    });

    const maxAppts = Math.max(...apptsByDay, 1);

    // Chart analytics (User growth by day of week)
    const userGrowthByDay = daysOfWeek.map((day, idx) => {
      return adminStats.allProfiles.filter(p => {
        const d = new Date(p.created_at).getDay();
        const mapped = d === 0 ? 6 : d - 1;
        return mapped === idx;
      }).length;
    });

    const maxGrowth = Math.max(...userGrowthByDay, 1);

    // Toggle Doctor Approval Handler
    const handleToggleDoctorApproval = async (docId, currentStatus) => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ approved: !currentStatus })
          .eq('id', docId);

        if (error) throw error;
        toast.success(`Doctor approval status updated!`);
        fetchAdminData();
      } catch (err) {
        console.error(err);
        toast.error("Failed to update doctor approval status.");
      }
    };

    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1 shadow-md">
                <Sparkles className="w-3.5 h-3.5" /> Admin Control Room
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
              System Admin Overview
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Welcome back, {profile?.full_name || 'System Admin'}. Manage clinical staff, appointments, patients, and hospital nodes.
            </p>
          </div>
        </div>

        {/* Dashboard Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          
          <motion.div whileHover={{ y: -4 }} className="depth-card bg-slate-900/45 border border-white/10 p-5 rounded-2xl flex flex-col justify-between h-32 shadow-xl">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Patients</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-2xl font-black text-white mt-2">{totalPatients}</h3>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="depth-card bg-slate-900/45 border border-white/10 p-5 rounded-2xl flex flex-col justify-between h-32 shadow-xl">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Doctors</span>
              <Stethoscope className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-black text-white mt-2">{totalDoctors}</h3>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="depth-card bg-slate-900/45 border border-white/10 p-5 rounded-2xl flex flex-col justify-between h-32 shadow-xl">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Appointments</span>
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-black text-white mt-2">{totalAppointmentsCount}</h3>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="depth-card bg-slate-900/45 border border-white/10 p-5 rounded-2xl flex flex-col justify-between h-32 shadow-xl">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Users</span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-2xl font-black text-white mt-2">{activeUsers}</h3>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="depth-card bg-slate-900/45 border border-white/10 p-5 rounded-2xl flex flex-col justify-between h-32 shadow-xl">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Hospitals</span>
              <MapPin className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-2xl font-black text-white mt-2">5</h3>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className={`depth-card border p-5 rounded-2xl flex flex-col justify-between h-32 shadow-xl ${
            pendingApprovals > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-900/45 border-white/10'
          }`}>
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Approvals Pending</span>
              <ShieldAlert className={`w-4 h-4 ${pendingApprovals > 0 ? 'text-rose-450' : 'text-slate-400'}`} />
            </div>
            <h3 className="text-2xl font-black text-white mt-2">{pendingApprovals}</h3>
          </motion.div>

        </div>

        {/* Quick Action Buttons */}
        <div className="depth-card bg-slate-900/40 border border-white/10 p-5 rounded-2xl space-y-3">
          <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Quick Action Console</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => setShowAdminApproveModal(true)} 
              className="py-3 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 rounded-xl text-xs font-bold text-rose-450 transition cursor-pointer text-center"
            >
              Approve Doctors
            </button>
            <button 
              onClick={() => setShowAdminAppointmentsModal(true)}
              className="py-3 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 rounded-xl text-xs font-bold text-emerald-400 transition cursor-pointer text-center"
            >
              View Appointments
            </button>
            <button 
              onClick={() => setShowAdminPatientsModal(true)}
              className="py-3 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/25 rounded-xl text-xs font-bold text-indigo-400 transition cursor-pointer text-center"
            >
              Manage Patients
            </button>
            <button 
              onClick={() => setShowAdminHospitalsModal(true)}
              className="py-3 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 rounded-xl text-xs font-bold text-amber-450 transition cursor-pointer text-center"
            >
              Manage Hospitals
            </button>
          </div>
        </div>

        {/* Charts & Activities layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ANALYTICS CHARTS (55%) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Daily Appointments chart */}
            <div className="depth-card bg-slate-900/40 border border-white/10 p-6 rounded-2xl">
              <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5 mb-6">
                <Calendar className="w-4 h-4 text-cyan-400" /> Daily Appointments Flow
              </h4>

              <div className="flex items-end justify-between h-48 pt-4 px-2">
                {apptsByDay.map((val, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-grow group">
                    <span className="text-[9px] font-bold text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-mono">{val}</span>
                    <div className="w-7 bg-white/5 rounded-t-lg relative overflow-hidden h-36">
                      <motion.div 
                        initial={{ height: 0 }} 
                        animate={{ height: `${(val / maxAppts) * 100}%` }} 
                        transition={{ duration: 0.8 }} 
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-600 to-indigo-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold mt-2">{daysOfWeek[idx]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* User Growth Chart */}
            <div className="depth-card bg-slate-900/40 border border-white/10 p-6 rounded-2xl">
              <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5 mb-6">
                <TrendingUp className="w-4 h-4 text-indigo-400" /> User Sign-up Growth
              </h4>

              <div className="flex items-end justify-between h-48 pt-4 px-2">
                {userGrowthByDay.map((val, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-grow group">
                    <span className="text-[9px] font-bold text-indigo-450 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-mono">{val}</span>
                    <div className="w-7 bg-white/5 rounded-t-lg relative overflow-hidden h-36">
                      <motion.div 
                        initial={{ height: 0 }} 
                        animate={{ height: `${(val / maxGrowth) * 100}%` }} 
                        transition={{ duration: 0.8 }} 
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-600 to-purple-650"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold mt-2">{daysOfWeek[idx]}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RECENT ACTIVITIES FEED (45%) */}
          <div className="lg:col-span-5 depth-card bg-slate-900/40 border border-white/10 p-6 rounded-2xl space-y-4">
            <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5 border-b border-white/5 pb-3">
              <Activity className="w-4 h-4 text-rose-500" /> Recent Activities
            </h4>

            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {recentActivities.map((act, index) => (
                <div key={index} className="flex gap-3.5 items-start p-3 bg-slate-950/40 border border-white/5 rounded-xl text-xs font-semibold">
                  
                  {/* Action specific Icon indicator */}
                  <span className={`p-2 rounded-lg shrink-0 ${
                    act.type === 'registration' ? 'bg-cyan-500/10 text-cyan-400' :
                    act.type === 'doctor_signup' ? 'bg-indigo-500/10 text-indigo-400' :
                    act.type === 'booking' ? 'bg-emerald-500/10 text-emerald-450' : 'bg-purple-500/10 text-purple-400'
                  }`}>
                    {act.type === 'registration' ? <UserPlus className="w-3.5 h-3.5" /> :
                     act.type === 'doctor_signup' ? <Stethoscope className="w-3.5 h-3.5" /> :
                     act.type === 'booking' ? <Calendar className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold">{act.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{act.desc}</p>
                    <p className="text-[9px] text-slate-500 mt-1 font-mono">{act.time.toLocaleDateString()} {act.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>

                  {/* Approve toggle switch directly in Feed */}
                  {act.type === 'doctor_signup' && (
                    <button
                      onClick={() => handleToggleDoctorApproval(act.id, act.approved)}
                      className={`px-2 py-1 rounded text-[8px] font-black uppercase shrink-0 cursor-pointer border ${
                        act.approved 
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-450' 
                          : 'bg-rose-500/10 border-rose-500/25 text-rose-450'
                      }`}
                    >
                      {act.approved ? 'Active' : 'Approve'}
                    </button>
                  )}

                </div>
              ))}
            </div>
          </div>

        </div>

        {/* MODAL 1: APPROVE DOCTORS */}
        <AnimatePresence>
          {showAdminApproveModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-white/15 rounded-3xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto relative custom-scrollbar">
                <button onClick={() => setShowAdminApproveModal(false)} className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white cursor-pointer transition"><X className="w-5 h-5" /></button>
                
                <h3 className="text-base font-extrabold text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                  <Stethoscope className="w-5 h-5 text-indigo-400" /> Manage Doctor Approvals
                </h3>

                <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/40">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 bg-white/5 text-[9px] uppercase font-bold">
                        <th className="p-3">Doctor Name</th>
                        <th className="p-3">Specialty</th>
                        <th className="p-3">License Number</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminStats.allProfiles.filter(p => p.role === 'doctor').map(doc => (
                        <tr key={doc.id} className="border-b border-white/5 last:border-0 text-xs font-semibold hover:bg-white/5 transition-colors">
                          <td className="p-3 text-white font-bold">Dr. {doc.full_name}</td>
                          <td className="p-3 text-slate-350">{doc.specialty || 'General Practice'}</td>
                          <td className="p-3 text-slate-400 font-mono">{doc.license_number || 'N/A'}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleToggleDoctorApproval(doc.id, doc.approved)}
                              className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer border ${
                                doc.approved 
                                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-450' 
                                  : 'bg-rose-500/10 border-rose-500/25 text-rose-450'
                              }`}
                            >
                              {doc.approved ? 'Approved (Active)' : 'Pending (Approve)'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL 2: VIEW APPOINTMENTS */}
        <AnimatePresence>
          {showAdminAppointmentsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-white/15 rounded-3xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto relative custom-scrollbar">
                <button onClick={() => setShowAdminAppointmentsModal(false)} className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white cursor-pointer transition"><X className="w-5 h-5" /></button>
                
                <h3 className="text-base font-extrabold text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                  <Calendar className="w-5 h-5 text-emerald-400" /> System Appointments Registry
                </h3>

                <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/40">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 bg-white/5 text-[9px] uppercase font-bold">
                        <th className="p-3">Date</th>
                        <th className="p-3">Time</th>
                        <th className="p-3">Type</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map(a => (
                        <tr key={a.id} className="border-b border-white/5 last:border-0 text-xs font-semibold hover:bg-white/5 transition-colors">
                          <td className="p-3 text-white font-bold">{new Date(a.appointment_date).toLocaleDateString()}</td>
                          <td className="p-3 text-slate-350">{a.appointment_time}</td>
                          <td className="p-3 text-indigo-400 font-mono capitalize">{a.consultation_type || 'General'}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                              a.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-450' :
                              a.status === 'scheduled' ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400' : 'bg-amber-500/10 border-amber-500/25 text-amber-450'
                            }`}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL 3: MANAGE PATIENTS */}
        <AnimatePresence>
          {showAdminPatientsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-white/15 rounded-3xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto relative custom-scrollbar">
                <button onClick={() => setShowAdminPatientsModal(false)} className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white cursor-pointer transition"><X className="w-5 h-5" /></button>
                
                <h3 className="text-base font-extrabold text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                  <Users className="w-5 h-5 text-indigo-400" /> Registered Patients Directory
                </h3>

                <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/40">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 bg-white/5 text-[9px] uppercase font-bold">
                        <th className="p-3">Patient Name</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Gender</th>
                        <th className="p-3">Blood Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminStats.allProfiles.filter(p => p.role === 'patient').map(pat => (
                        <tr key={pat.id} className="border-b border-white/5 last:border-0 text-xs font-semibold hover:bg-white/5 transition-colors">
                          <td className="p-3 text-white font-bold">{pat.full_name || 'Patient'}</td>
                          <td className="p-3 text-slate-350">{pat.phone || 'N/A'}</td>
                          <td className="p-3 text-slate-400 capitalize">{pat.gender || 'N/A'}</td>
                          <td className="p-3 text-rose-450 font-bold uppercase">{pat.blood_type || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL 4: MANAGE HOSPITALS */}
        <AnimatePresence>
          {showAdminHospitalsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-white/15 rounded-3xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative custom-scrollbar">
                <button onClick={() => setShowAdminHospitalsModal(false)} className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white cursor-pointer transition"><X className="w-5 h-5" /></button>
                
                <h3 className="text-base font-extrabold text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                  <MapPin className="w-5 h-5 text-amber-400" /> Active Hospital Nodes
                </h3>

                <div className="space-y-4">
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-white/10 text-xs text-slate-300 font-semibold">
                    <h4 className="text-white font-bold text-sm">City General Hospital</h4>
                    <p className="mt-1 text-slate-450">Specialty: General Medicine, Emergency</p>
                    <p className="mt-1 font-mono text-[10px] text-slate-500">Location: Central Town Circle</p>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-white/10 text-xs text-slate-300 font-semibold">
                    <h4 className="text-white font-bold text-sm">Metro Cardiac Research Lab</h4>
                    <p className="mt-1 text-slate-450">Specialty: Cardiology, Advanced Scans</p>
                    <p className="mt-1 font-mono text-[10px] text-slate-500">Location: Down Town Area</p>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-white/10 text-xs text-slate-300 font-semibold">
                    <h4 className="text-white font-bold text-sm">Apollo Endocrinology Center</h4>
                    <p className="mt-1 text-slate-450">Specialty: Diabetes & Hormones</p>
                    <p className="mt-1 font-mono text-[10px] text-slate-500">Location: North Wing Plaza</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    );
  }

  // Render Doctor Dashboard View
  if (profile?.role === 'doctor') {
    // Generate data for weekly bar chart
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const appointmentsByDay = daysOfWeek.map((day, index) => {
      // Group by day of week
      const count = appointments.filter(a => {
        const d = new Date(a.scheduled_at).getDay();
        // JavaScript getDay(): Sun=0, Mon=1, ..., Sat=6
        const mappedIndex = d === 0 ? 6 : d - 1; // map Sun to 6, Mon to 0
        return mappedIndex === index && a.status !== 'cancelled';
      }).length;
      return count;
    });

    const maxCount = Math.max(...appointmentsByDay, 1);

    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200/80 dark:border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1 shadow-md">
                <Sparkles className="w-3 h-3" /> Clinical Control Panel
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight bg-clip-text bg-gradient-to-r from-slate-900 dark:from-white via-slate-800 dark:via-slate-100 to-slate-500 dark:to-slate-400">
              Doctor Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
              Welcome back, Dr. {profile?.full_name?.split(' ')?.[0] || 'Clinician'}. Here is your patient stats, schedule flow, and pending approvals.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setShowPatientSidebar(true)}
              className="px-4 py-2 bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Users className="w-3.5 h-3.5" /> My Patients
            </button>
            <Link 
              to="/dashboard/appointments"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> View Appointments
            </Link>
          </div>
        </div>

        {/* Doctor Metrics Block */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <MetricSkeleton key={i} />)
          ) : (
            <>
              <div className="depth-card holo-surface p-5 flex flex-col justify-between h-28">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Total Patients</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{patients.length}</span>
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> Assigned</span>
                </div>
              </div>

              <div className="depth-card holo-surface p-5 flex flex-col justify-between h-28">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Today's Appts</span>
                  <Calendar className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{todayApts.length}</span>
                  <span className="text-[10px] font-bold text-slate-500">Scheduled</span>
                </div>
              </div>

              <div className="depth-card holo-surface p-5 flex flex-col justify-between h-28">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Upcoming Flow</span>
                  <Clock className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{upcomingApt.length}</span>
                  <span className="text-[10px] font-bold text-slate-500">Confirmed</span>
                </div>
              </div>

              <div className="depth-card holo-surface p-5 flex flex-col justify-between h-28">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Completed</span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{completedApts.length}</span>
                  <span className="text-[10px] font-bold text-emerald-500">Consultations</span>
                </div>
              </div>

              <div className="depth-card holo-surface p-5 flex flex-col justify-between h-28 col-span-2 md:col-span-1">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Pending Requests</span>
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{pendingApts.length}</span>
                  <span className="text-[10px] font-bold text-rose-500">Action Required</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions Portal Grid */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Clinical Quick Actions</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link 
              to="/dashboard/appointments"
              className="depth-card bg-slate-900/5 hover:bg-slate-900/10 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition hover:-translate-y-1 shadow-sm cursor-pointer text-slate-700 dark:text-slate-200 font-semibold"
            >
              <Calendar className="w-6 h-6 text-indigo-400" />
              <span className="text-xs">Schedule flow</span>
            </Link>
            
            <button 
              onClick={() => setShowPatientSidebar(true)}
              className="depth-card bg-slate-900/5 hover:bg-slate-900/10 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition hover:-translate-y-1 shadow-sm cursor-pointer text-slate-700 dark:text-slate-200 font-semibold"
            >
              <Users className="w-6 h-6 text-cyan-400" />
              <span className="text-xs">My Patients</span>
            </button>

            <Link 
              to="/dashboard/report-analyzer"
              className="depth-card bg-slate-900/5 hover:bg-slate-900/10 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition hover:-translate-y-1 shadow-sm cursor-pointer text-slate-700 dark:text-slate-200 font-semibold"
            >
              <FileText className="w-6 h-6 text-emerald-400" />
              <span className="text-xs">Report Analyzer</span>
            </Link>

            <button 
              onClick={() => {
                if (patients.length === 0) {
                  toast.error("No patients assigned to write prescriptions.");
                  return;
                }
                setShowPrescriptionModal(true);
              }}
              className="depth-card bg-slate-900/5 hover:bg-slate-900/10 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition hover:-translate-y-1 shadow-sm cursor-pointer text-slate-700 dark:text-slate-200 font-semibold"
            >
              <FileSignature className="w-6 h-6 text-purple-400" />
              <span className="text-xs">Digital Rx</span>
            </button>

            <button 
              onClick={() => {
                if (patients.length === 0) {
                  toast.error("No patients assigned to write clinical notes.");
                  return;
                }
                setShowNotesModal(true);
              }}
              className="depth-card bg-slate-900/5 hover:bg-slate-900/10 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition hover:-translate-y-1 shadow-sm cursor-pointer col-span-2 md:col-span-1 text-slate-700 dark:text-slate-200 font-semibold"
            >
              <ClipboardList className="w-6 h-6 text-amber-400" />
              <span className="text-xs">SOAP Notes</span>
            </button>
          </div>
        </div>

        {/* Charts & Graphs Block */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Weekly Appointments Chart */}
          <div className="lg:col-span-7 depth-card bg-slate-900/5 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Consultation Volume</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">Weekly Appointments</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-md">Mon - Sun</span>
            </div>

            <div className="h-64 w-full flex items-end justify-between gap-3 px-2 pt-6 relative border-b border-slate-200 dark:border-white/5">
              {daysOfWeek.map((day, idx) => {
                const val = appointmentsByDay[idx] || 0;
                const pct = (val / maxCount) * 85; // cap at 85% height
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="text-[10px] font-mono font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {val}
                    </div>
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="w-full bg-gradient-to-t from-indigo-600/70 to-indigo-400/80 rounded-t-lg group-hover:from-indigo-500 group-hover:to-cyan-400 transition-colors shadow-lg relative"
                    >
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg" />
                    </motion.div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-tight pb-1">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Patient Stats: Risk Level breakdown */}
          <div className="lg:col-span-5 depth-card bg-slate-900/5 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Demographics & Safety</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">Patient Statistics</h3>
            </div>

            <div className="space-y-5 my-6 flex-1 flex flex-col justify-center">
              {/* High Risk */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-rose-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> High Risk</span>
                  <span className="text-slate-900 dark:text-slate-200">{highRisk.length} ({patients.length > 0 ? Math.round((highRisk.length / patients.length) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${patients.length > 0 ? (highRisk.length / patients.length) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Medium Risk */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-amber-500 flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Medium Risk</span>
                  <span className="text-slate-900 dark:text-slate-200">
                    {patients.filter(p => p.risk_level === 'Medium').length} ({patients.length > 0 ? Math.round((patients.filter(p => p.risk_level === 'Medium').length / patients.length) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${patients.length > 0 ? (patients.filter(p => p.risk_level === 'Medium').length / patients.length) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Low Risk */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-emerald-500 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Low Risk</span>
                  <span className="text-slate-900 dark:text-slate-200">
                    {patients.filter(p => p.risk_level === 'Low' || !p.risk_level).length} ({patients.length > 0 ? Math.round((patients.filter(p => p.risk_level === 'Low' || !p.risk_level).length / patients.length) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${patients.length > 0 ? (patients.filter(p => p.risk_level === 'Low' || !p.risk_level).length / patients.length) * 100 : 0}%` }} />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex justify-between">
              <span>Risk Level Metrics</span>
              <span>Updated Live</span>
            </div>
          </div>
        </div>

        {/* Split Grid: Recent Activity & Notifications Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Recent Appointments Activity */}
          <div className="lg:col-span-7 depth-card bg-slate-900/5 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-4 mb-4">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Recent Consultations</h3>
                <Link to="/dashboard/appointments" className="text-xs text-indigo-500 hover:text-indigo-400 font-bold flex items-center gap-0.5">Schedule Flow <ChevronRight className="w-3.5 h-3.5" /></Link>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="py-3 flex justify-between">
                      <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-16" /></div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))
                ) : appointments.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-sm">No recent consultation logs.</div>
                ) : (
                  appointments.slice(0, 4).map(apt => (
                    <div key={apt.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-55 dark:hover:bg-slate-800/10 px-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-950 flex items-center justify-center font-bold text-slate-700 dark:text-white text-[10px]">
                          {apt.patient?.avatar_url ? (
                            <img src={apt.patient.avatar_url} alt={apt.patient.full_name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            (apt.patient?.full_name || 'PT').split(' ').map(p => p[0]).join('')
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{apt.patient?.full_name || 'Patient'}</p>
                          <p className="text-slate-500 font-medium">{apt.type} consultation</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide border ${
                          apt.status === 'completed' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : apt.status === 'cancelled'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {apt.status}
                        </span>
                        <p className="text-slate-400 mt-1 font-mono">{new Date(apt.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Clinical Notifications Feed & Emergency Alerts */}
          <div className="lg:col-span-5 depth-card bg-slate-900/5 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/5 pb-4 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" /> Notifications & Alerts
            </h3>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {/* Emergency Alert (Simulated Critical Alert) */}
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex gap-3 text-xs text-rose-400">
                <ShieldAlert className="w-5 h-5 shrink-0 animate-bounce" />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[9px] text-rose-500">Critical Alert (SOS)</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 mt-1">SOS Triggered: John Doe</p>
                  <p className="text-slate-500 mt-1 font-medium">Patient reported acute chest tightness. Coordinates and dispatcher status set to pending.</p>
                </div>
              </div>

              {/* Standard Notification 1 */}
              <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex gap-3 text-xs text-indigo-400 dark:text-indigo-300">
                <Calendar className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[9px] text-indigo-400">New Request</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 mt-1">Booking Request: Sarah Smith</p>
                  <p className="text-slate-500 mt-1 font-medium">Requested Video Consult for tomorrow at 2:30 PM. Action required in pending list.</p>
                </div>
              </div>

              {/* Standard Notification 2 */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex gap-3 text-xs text-slate-400">
                <FileText className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[9px] text-slate-500">Record Uploaded</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 mt-1">Medical Report: David Miller</p>
                  <p className="text-slate-500 mt-1 font-medium">Uploaded Thyroid Panel results. Report analyzer available for review.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- COMPOSE DIGITAL PRESCRIPTION DIALOG --- */}
        <AnimatePresence>
          {showPrescriptionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={() => setShowPrescriptionModal(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 relative z-10 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-indigo-400" /> Compose Digital Prescription (Rx)
                  </h3>
                  <button onClick={() => setShowPrescriptionModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handlePrescriptionSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Select Patient</label>
                    <select 
                      required
                      value={prescriptionForm.patientId}
                      onChange={e => setPrescriptionForm(prev => ({ ...prev, patientId: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                    >
                      <option value="">-- Choose Patient --</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.profile_id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Medication Name</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Metformin 500mg"
                        value={prescriptionForm.medication}
                        onChange={e => setPrescriptionForm(prev => ({ ...prev, medication: e.target.value }))}
                        className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Dosage Frequency</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Once daily after meals"
                        value={prescriptionForm.dosage}
                        onChange={e => setPrescriptionForm(prev => ({ ...prev, dosage: e.target.value }))}
                        className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Duration</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 30 days"
                      value={prescriptionForm.duration}
                      onChange={e => setPrescriptionForm(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Special Instructions</label>
                    <textarea 
                      rows="3"
                      placeholder="e.g. Monitor fasting glucose levels. Stop if experiencing side effects."
                      value={prescriptionForm.instructions}
                      onChange={e => setPrescriptionForm(prev => ({ ...prev, instructions: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
                    <button type="button" onClick={() => setShowPrescriptionModal(false)} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:text-white cursor-pointer font-bold">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer font-bold">Save & Transmit (Rx)</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- COMPOSE SOAP CLINICAL NOTES DIALOG --- */}
        <AnimatePresence>
          {showNotesModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={() => setShowNotesModal(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 relative z-10 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-amber-400" /> Compose SOAP Consultation Notes
                  </h3>
                  <button onClick={() => setShowNotesModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleNotesSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Select Patient</label>
                    <select 
                      required
                      value={notesForm.patientId}
                      onChange={e => setNotesForm(prev => ({ ...prev, patientId: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                    >
                      <option value="">-- Choose Patient --</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.profile_id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Subjective (Patient symptoms reported)</label>
                    <textarea 
                      rows="2"
                      placeholder="e.g. Patient reports minor headaches in the morning..."
                      value={notesForm.subjective}
                      onChange={e => setNotesForm(prev => ({ ...prev, subjective: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Objective (Vitals, exams, clinical findings)</label>
                    <textarea 
                      rows="2"
                      placeholder="e.g. BP 135/85 mmHg, Heart Rate 72 BPM, chest clear..."
                      value={notesForm.objective}
                      onChange={e => setNotesForm(prev => ({ ...prev, objective: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Assessment (Differential diagnoses / clinical rationale)</label>
                    <textarea 
                      rows="2"
                      required
                      placeholder="e.g. Borderline stage 1 hypertension. Normal glycemic index."
                      value={notesForm.assessment}
                      onChange={e => setNotesForm(prev => ({ ...prev, assessment: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Plan (Prescription, referrals, repeat tests)</label>
                    <textarea 
                      rows="2"
                      placeholder="e.g. Low sodium diet. Monitor BP daily for 2 weeks. Repeat lipid panel."
                      value={notesForm.plan}
                      onChange={e => setNotesForm(prev => ({ ...prev, plan: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
                    <button type="button" onClick={() => setShowNotesModal(false)} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:text-white cursor-pointer font-bold">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer font-bold">Save SOAP Note</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- MY PATIENTS SIDEBAR OVERLAY --- */}
        <AnimatePresence>
          {showPatientSidebar && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={() => setShowPatientSidebar(false)}
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="w-full max-w-md bg-slate-900 border-l border-white/10 h-full relative z-10 shadow-2xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-400" /> Assigned Patients
                    </h3>
                    <button onClick={() => setShowPatientSidebar(false)} className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
                  </div>

                  <div className="space-y-4 overflow-y-auto max-h-[75vh] pr-1 custom-scrollbar">
                    {patients.length === 0 ? (
                      <p className="text-center text-slate-500 text-sm font-medium py-12">No patients assigned yet.</p>
                    ) : (
                      patients.map(p => (
                        <div key={p.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center font-bold text-white text-xs shrink-0">
                              {p.profile?.avatar_url ? (
                                <img src={p.profile.avatar_url} alt={p.full_name} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                p.full_name.split(' ').map(part => part[0]).join('')
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{p.full_name}</p>
                              <p className="text-slate-400 text-xs mt-0.5">Condition: <span className="text-slate-300 font-semibold">{p.condition}</span></p>
                              <p className="text-slate-500 text-[10px] mt-1 font-mono">{p.profile?.phone || 'No phone'}</p>
                            </div>
                          </div>
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
                            p.risk_level === 'High' 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-md' 
                              : p.risk_level === 'Medium'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {p.risk_level || 'Low'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 mt-6">
                  <button 
                    onClick={() => {
                      setShowPatientSidebar(false);
                      toast.success("Navigating to patient directory...");
                      navigate('/dashboard/patients');
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-50 text-white hover:text-slate-950 transition font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    View Patient Directory <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- EXISTING PATIENT / DEFAULT DASHBOARD ---
  const upcomingAptPatient = isLoading ? [] : appointments.filter(a => a.status === 'scheduled').slice(0, 4);
  const highRiskPatient = isLoading ? [] : patients.filter(p => p.risk_level === 'High');

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header — always visible */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Welcome back, {profile?.full_name || 'MediCare User'}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/appointments" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md">Book Appointment</Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Metric Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
            </>
          ) : (
            <>
              <div className="depth-card holo-surface p-6 flex flex-col justify-between h-32">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-widest">Medical Records</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">{patients.length}</span>
                  <span className="text-[10px] font-bold text-slate-500">Linked Profile</span>
                </div>
              </div>

              <div className="depth-card holo-surface p-6 flex flex-col justify-between h-32">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-widest">Critical Indicators</span>
                  <Activity className="w-4 h-4 text-rose-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">{highRiskPatient.length}</span>
                  <span className="text-[10px] font-bold text-slate-500">High Risk Status</span>
                </div>
              </div>

              <div className="depth-card holo-surface p-6 flex flex-col justify-between h-32">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-widest">Appointments Today</span>
                  <Calendar className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                    {upcomingAptPatient.filter(a => new Date(a.scheduled_at).toDateString() === new Date().toDateString()).length}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">Scheduled Today</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Patient Activity Chart */}
        <div className="depth-card bg-slate-900/5 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-6 rounded-2xl lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Patient Activity</h3>
            <select className="text-sm bg-transparent border-none text-slate-500 font-medium focus:ring-0 cursor-pointer">
              <option>Last 30 days</option>
              <option>Last 7 days</option>
              <option>Year to date</option>
            </select>
          </div>
          <div className="h-64 w-full relative flex items-end justify-between gap-2">
            {[40, 55, 30, 70, 45, 90, 60, 40, 80, 50, 65, 85].map((height, i) => (
              <div
                key={i}
                className="w-full bg-slate-200 dark:bg-white/5 rounded-t-sm hover:bg-indigo-500/20 dark:hover:bg-indigo-500/20 transition-colors relative group cursor-pointer"
                style={{ height: `${height}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-mono">
                  {height * 2}
                </div>
              </div>
            ))}
            <div className="absolute bottom-0 inset-x-0 border-b border-slate-200 dark:border-white/5" />
          </div>
          <div className="flex justify-between mt-3 text-xs font-semibold text-slate-400">
            <span>Jan 1</span><span>Jan 15</span><span>Jan 30</span>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="depth-card bg-slate-900/5 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-4 mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Upcoming</h3>
              <Link to="/dashboard/appointments" className="text-xs text-indigo-500 hover:text-indigo-400 font-bold flex items-center gap-0.5">View all <ChevronRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[220px]">
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="py-2 flex justify-between">
                    <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))
              ) : upcomingAptPatient.length === 0 ? (
                <div className="py-8 text-center text-slate-550">No upcoming consultations.</div>
              ) : (
                upcomingAptPatient.map(apt => (
                  <div key={apt.id} className="flex items-center justify-between py-2 text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{apt.doctor?.full_name || 'Clinician'}</p>
                      <p className="text-slate-500">{apt.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-slate-500 font-mono">
                        {new Date(apt.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
