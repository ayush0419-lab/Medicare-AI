import React, { useState, useEffect, useCallback } from 'react';
import { supabase, logAudit } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  Users, Calendar, Activity, ShieldAlert, Settings, MapPin, Heart,
  ClipboardList, Bell, Star, FileText, Download, Trash2, Edit, Plus,
  X, Check, AlertCircle, RefreshCw, PlusCircle, Search, HelpCircle, Save, Loader2, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export const AdminConsole = () => {
  const { profile } = useAuth();
  
  // Tab Management
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, patients, appointments, hospitals, records, sos, audits, reviews, alerts, reports, settings

  // General Loading & Database States
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [records, setRecords] = useState([]);
  const [audits, setAudits] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState('All');

  // Modal / Form States
  const [isHospitalFormOpen, setIsHospitalFormOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);
  const [hospName, setHospName] = useState('');
  const [hospLoc, setHospLoc] = useState('');
  const [hospAddress, setHospAddress] = useState('');
  const [hospContact, setHospContact] = useState('');
  const [hospSpecialties, setHospSpecialties] = useState('');

  // Announcement States
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementType, setAnnouncementType] = useState('info');

  // Reschedule States
  const [reschedulingAppt, setReschedulingAppt] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  // Settings State
  const [aiModel, setAiModel] = useState('gpt-4o-mini');
  const [maintMode, setMaintMode] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);

  // 🔒 Admin-only route guard
  if (profile && profile.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          Only <span className="font-semibold text-rose-400">Administrators</span> can access the Master Console.
        </p>
      </div>
    );
  }

  // Fetch Database Data dynamically
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Users/Profiles
      const { data: profData } = await supabase.from('profiles').select('*');
      const allProfiles = profData || [];
      setPatients(allProfiles.filter(p => p.role === 'patient'));
      setDoctors(allProfiles.filter(p => p.role === 'doctor'));

      // 2. Fetch Appointments
      const { data: aptData } = await supabase.from('appointments').select('*').order('appointment_date', { ascending: false });
      setAppointments(aptData || []);

      // 3. Fetch Hospitals
      const { data: hospData } = await supabase.from('hospitals').select('*');
      setHospitals(hospData || []);

      // 4. Fetch Medical Records
      const { data: recData } = await supabase.from('medical_records').select('*').order('created_at', { ascending: false });
      setRecords(recData || []);

      // 5. Fetch SOS Alerts
      const { data: sosData } = await supabase.from('emergency_sos').select('*').order('created_at', { ascending: false });
      setSosAlerts(sosData || []);

      // 6. Fetch Audit Logs
      const { data: auditData } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
      setAudits(auditData || []);

      // 7. Fetch Feedback & Reviews
      const { data: feedbackData } = await supabase.from('feedback_reviews').select('*').order('created_at', { ascending: false });
      setReviews(feedbackData || []);

    } catch (err) {
      console.error("Error loading master dashboard databases:", err);
      toast.error("Failed to load console registry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time Subscriptions
  useEffect(() => {
    const sosSubscription = supabase
      .channel('sos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_sos' }, () => {
        toast('Emergency SOS update detected!', { icon: '🚨' });
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sosSubscription);
    };
  }, [fetchData]);

  /* ─── Patient Management Actions ─── */
  const handleBlockUnblock = async (patientId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'suspended' ? 'patient' : 'suspended';
      const { error } = await supabase
        .from('profiles')
        .update({ role: newStatus })
        .eq('id', patientId);

      if (error) throw error;
      toast.success(`Patient account is now: ${newStatus === 'suspended' ? 'Blocked' : 'Active'}`);
      logAudit("Toggle Patient Status", `Patient ID: ${patientId} status changed to ${newStatus}`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle block status.");
    }
  };

  const handleDeletePatient = async (patientId) => {
    if (!window.confirm("Delete this patient profile permanently?")) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', patientId);
      if (error) throw error;
      toast.success("Patient profile removed.");
      logAudit("Delete Patient Account", `Patient ID: ${patientId} deleted`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete patient.");
    }
  };

  /* ─── Appointment Actions ─── */
  const handleCancelAppointment = async (aptId) => {
    try {
      const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', aptId);
      if (error) throw error;
      toast.success("Appointment Cancelled.");
      logAudit("Cancel Appointment", `Appointment ID: ${aptId} cancelled by admin`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel appointment.");
    }
  };

  const handleUpdateAptStatus = async (aptId, status) => {
    try {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', aptId);
      if (error) throw error;
      toast.success(`Appointment status updated to ${status}.`);
      logAudit("Update Appointment Status", `Appointment ID: ${aptId} status set to ${status}`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate || !newTime) return;
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          appointment_date: newDate,
          appointment_time: newTime,
          status: 'rescheduled'
        })
        .eq('id', reschedulingAppt.id);

      if (error) throw error;
      toast.success("Appointment rescheduled!");
      logAudit("Reschedule Appointment", `Appointment ID: ${reschedulingAppt.id} set to ${newDate} at ${newTime}`);
      setReschedulingAppt(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reschedule.");
    }
  };

  /* ─── Hospital Actions ─── */
  const handleOpenHospitalForm = (hosp = null) => {
    if (hosp) {
      setEditingHospital(hosp);
      setHospName(hosp.name);
      setHospLoc(hosp.location || '');
      setHospAddress(hosp.address || '');
      setHospContact(hosp.contact || '');
      setHospSpecialties(hosp.specialties?.join(', ') || '');
    } else {
      setEditingHospital(null);
      setHospName('');
      setHospLoc('');
      setHospAddress('');
      setHospContact('');
      setHospSpecialties('');
    }
    setIsHospitalFormOpen(true);
  };

  const handleHospitalSubmit = async (e) => {
    e.preventDefault();
    if (!hospName) return;

    const specsArray = hospSpecialties ? hospSpecialties.split(',').map(s => s.trim()) : [];

    const payload = {
      name: hospName,
      location: hospLoc,
      address: hospAddress,
      contact: hospContact,
      specialties: specsArray
    };

    try {
      if (editingHospital) {
        const { error } = await supabase.from('hospitals').update(payload).eq('id', editingHospital.id);
        if (error) throw error;
        toast.success("Hospital updated!");
        logAudit("Update Hospital Info", `Hospital ID: ${editingHospital.id}`);
      } else {
        const { error } = await supabase.from('hospitals').insert([payload]);
        if (error) throw error;
        toast.success("Hospital node added!");
        logAudit("Add Hospital Node", `Added ${hospName}`);
      }
      setIsHospitalFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save hospital.");
    }
  };

  const handleDeleteHospital = async (hospId) => {
    if (!window.confirm("Remove this hospital node?")) return;
    try {
      const { error } = await supabase.from('hospitals').delete().eq('id', hospId);
      if (error) throw error;
      toast.success("Hospital removed.");
      logAudit("Delete Hospital Node", `Hospital ID: ${hospId}`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete hospital.");
    }
  };

  /* ─── Emergency SOS Actions ─── */
  const handleResolveSos = async (sosId) => {
    try {
      const { error } = await supabase.from('emergency_sos').update({ status: 'resolved' }).eq('id', sosId);
      if (error) throw error;
      toast.success("Emergency SOS status set to Resolved.");
      logAudit("Resolve SOS Alert", `SOS Alert ID: ${sosId} resolved by admin`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to resolve SOS alert.");
    }
  };

  /* ─── Announcement Action ─── */
  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementTitle || !announcementMsg) return;
    try {
      const targetRoles = announcementType === 'health' ? ['patient'] : ['doctor', 'patient'];
      
      // Fetch target users
      const { data: targets } = await supabase.from('profiles').select('id, role');
      const filteredTargets = (targets || []).filter(t => targetRoles.includes(t.role));

      // Bulk create notifications
      const notificationsPayload = filteredTargets.map(t => ({
        user_id: t.id,
        title: announcementTitle,
        message: announcementMsg,
        type: announcementType === 'maintenance' ? 'warning' : 'info'
      }));

      if (notificationsPayload.length > 0) {
        const { error } = await supabase.from('notifications').insert(notificationsPayload);
        if (error) throw error;
      }

      toast.success("System announcements sent successfully!");
      logAudit("Send Announcement", `Title: ${announcementTitle}`);
      setAnnouncementTitle('');
      setAnnouncementMsg('');
    } catch (err) {
      console.error(err);
      toast.error("Failed to send announcements.");
    }
  };

  /* ─── CSV Export Functionality ─── */
  const handleExportData = (type) => {
    let dataToExport = [];
    let headers = '';
    let filename = '';

    if (type === 'patients') {
      dataToExport = patients;
      headers = 'ID,Full Name,Email,Phone,Gender,Blood Type,Created At\n';
      filename = 'patients_report.csv';
    } else if (type === 'doctors') {
      dataToExport = doctors;
      headers = 'ID,Full Name,Email,Phone,Specialty,License,Hospital,Created At\n';
      filename = 'doctors_report.csv';
    } else if (type === 'appointments') {
      dataToExport = appointments;
      headers = 'ID,Date,Time,Status,Consultation Type,Created At\n';
      filename = 'appointments_report.csv';
    }

    if (dataToExport.length === 0) {
      toast.error("No data available to export.");
      return;
    }

    const csvContent = headers + dataToExport.map(row => {
      if (type === 'patients') {
        return `"${row.id}","${row.full_name}","${row.email || ''}","${row.phone || ''}","${row.gender || ''}","${row.blood_type || ''}","${row.created_at}"`;
      } else if (type === 'doctors') {
        return `"${row.id}","${row.full_name}","${row.email || ''}","${row.phone || ''}","${row.specialty || ''}","${row.license_number || ''}","${row.organization || ''}","${row.created_at}"`;
      } else {
        return `"${row.id}","${row.appointment_date}","${row.appointment_time}","${row.status}","${row.consultation_type || ''}","${row.created_at}"`;
      }
    }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filename} exported successfully!`);
    logAudit("Export CSV Report", `Type: ${type}`);
  };

  // Filtering Search Lists
  const filteredPatientsList = patients.filter(p => 
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAppointmentsList = appointments.filter(a => 
    a.appointment_time?.includes(searchQuery) ||
    a.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 p-6 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden font-sans shadow-2xl">
      {/* Background decoration elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f2fe05_1px,transparent_1px),linear-gradient(to_bottom,#00f2fe05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        
        {/* Masthead */}
        <div className="border-b border-white/10 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1 shadow-md">
                <Settings className="w-3.5 h-3.5" /> Operations Headquarters
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
              Master Admin Control Console
            </h1>
          </div>

          <button onClick={fetchData} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2 cursor-pointer transition">
            <RefreshCw className="w-3.5 h-3.5" /> Sync Registry
          </button>
        </div>

        {/* Tab Selector Links */}
        <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
          {[
            { id: 'analytics', label: 'Analytics Dashboard', icon: Activity },
            { id: 'patients', label: 'Patient Directory', icon: Users },
            { id: 'appointments', label: 'Appointments Registry', icon: Calendar },
            { id: 'hospitals', label: 'Hospitals Registry', icon: MapPin },
            { id: 'records', label: 'Medical Document Store', icon: FileText },
            { id: 'sos', label: 'Emergency Monitoring', icon: ShieldAlert },
            { id: 'audits', label: 'Audit Activities', icon: ClipboardList },
            { id: 'reviews', label: 'Ratings & Reviews', icon: Star },
            { id: 'alerts', label: 'Announcements Editor', icon: Bell },
            { id: 'reports', label: 'Export Reports', icon: Download },
            { id: 'settings', label: 'System Prefs', icon: Settings }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setSearchQuery(''); }}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 border cursor-pointer ${
                activeTab === t.id 
                  ? 'bg-indigo-650 border-indigo-500 text-white shadow-md' 
                  : 'bg-slate-950/50 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Dynamic Views Panel */}
        {loading ? (
          <div className="text-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-500" />
            <p className="text-xs">Fetching system registries...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              
              {/* TAB 1: ANALYTICS & CHARTS */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="depth-card bg-slate-900/40 border border-white/10 p-5 rounded-2xl">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Daily Patients Growth</p>
                      <h3 className="text-2xl font-black text-white mt-1">{patients.length} Registered</h3>
                      <div className="h-24 flex items-end justify-between mt-6 gap-2">
                        {Array.from({ length: 7 }).map((_, i) => (
                          <div key={i} className="flex-1 bg-white/5 rounded-t relative h-16">
                            <div className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-t h-[60%]" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="depth-card bg-slate-900/40 border border-white/10 p-5 rounded-2xl">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Daily Doctor Registrations</p>
                      <h3 className="text-2xl font-black text-white mt-1">{doctors.length} Registered</h3>
                      <div className="h-24 flex items-end justify-between mt-6 gap-2">
                        {Array.from({ length: 7 }).map((_, i) => (
                          <div key={i} className="flex-1 bg-white/5 rounded-t relative h-16">
                            <div className="absolute bottom-0 left-0 right-0 bg-cyan-500 rounded-t h-[40%]" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="depth-card bg-slate-900/40 border border-white/10 p-5 rounded-2xl">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Emergency SOS Events</p>
                      <h3 className="text-2xl font-black text-white mt-1">{sosAlerts.length} SOS Logged</h3>
                      <div className="h-24 flex items-end justify-between mt-6 gap-2">
                        {Array.from({ length: 7 }).map((_, i) => (
                          <div key={i} className="flex-1 bg-white/5 rounded-t relative h-16">
                            <div className="absolute bottom-0 left-0 right-0 bg-rose-500 rounded-t h-[80%]" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="depth-card bg-slate-900/40 border border-white/10 p-6 rounded-2xl">
                    <h4 className="text-xs font-bold text-white mb-4">Total System Statistics</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4">
                        <p className="text-[10px] text-slate-500 uppercase font-black">Hospitals</p>
                        <p className="text-xl font-extrabold text-white mt-1">{hospitals.length}</p>
                      </div>
                      <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4">
                        <p className="text-[10px] text-slate-500 uppercase font-black">Appointments</p>
                        <p className="text-xl font-extrabold text-white mt-1">{appointments.length}</p>
                      </div>
                      <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4">
                        <p className="text-[10px] text-slate-500 uppercase font-black">Audit Trails</p>
                        <p className="text-xl font-extrabold text-white mt-1">{audits.length}</p>
                      </div>
                      <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4">
                        <p className="text-[10px] text-slate-500 uppercase font-black">Reviews</p>
                        <p className="text-xl font-extrabold text-white mt-1">{reviews.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PATIENTS DIRECTORY */}
              {activeTab === 'patients' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search patient by name or email..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/20">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 bg-white/5 text-[9px] uppercase font-bold tracking-wider">
                          <th className="p-3">Full Name</th>
                          <th className="p-3">Email Address</th>
                          <th className="p-3">Blood Type / Gender</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPatientsList.map(pat => (
                          <tr key={pat.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 text-xs font-semibold">
                            <td className="p-3 text-white font-bold">{pat.full_name}</td>
                            <td className="p-3 text-slate-400">{pat.email || 'No email registered'}</td>
                            <td className="p-3 text-slate-350">{pat.blood_type || 'N/A'} &bull; <span className="capitalize">{pat.gender || 'N/A'}</span></td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                pat.role === 'suspended' ? 'bg-rose-500/10 text-rose-450 border border-rose-500/25' : 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/25'
                              }`}>
                                {pat.role === 'suspended' ? 'Blocked' : 'Active'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleBlockUnblock(pat.id, pat.role)}
                                  className={`px-2 py-1 rounded text-[9px] font-black uppercase cursor-pointer border ${
                                    pat.role === 'suspended' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' : 'bg-amber-500/10 border-amber-500/20 text-amber-450'
                                  }`}
                                >
                                  {pat.role === 'suspended' ? 'Unblock' : 'Block'}
                                </button>
                                <button
                                  onClick={() => handleDeletePatient(pat.id)}
                                  className="p-1 bg-rose-950/45 hover:bg-rose-650 text-rose-450 hover:text-white border border-rose-550/20 rounded-lg cursor-pointer transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: APPOINTMENTS */}
              {activeTab === 'appointments' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search appointments by status or type..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/20">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 bg-white/5 text-[9px] uppercase font-bold tracking-wider">
                          <th className="p-3">Visit Date</th>
                          <th className="p-3">Time Slot</th>
                          <th className="p-3">Type</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppointmentsList.map(apt => (
                          <tr key={apt.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 text-xs font-semibold">
                            <td className="p-3 text-white font-bold">{new Date(apt.appointment_date).toLocaleDateString()}</td>
                            <td className="p-3 text-slate-400 font-mono">{apt.appointment_time}</td>
                            <td className="p-3 text-indigo-400 capitalize">{apt.consultation_type}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                                apt.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' :
                                apt.status === 'scheduled' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-450'
                              }`}>
                                {apt.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setReschedulingAppt(apt)}
                                  className="px-2 py-1 bg-indigo-650/40 text-indigo-400 border border-indigo-550/20 rounded text-[9px] font-black uppercase cursor-pointer"
                                >
                                  Reschedule
                                </button>
                                {apt.status !== 'completed' && (
                                  <button
                                    onClick={() => handleUpdateAptStatus(apt.id, 'completed')}
                                    className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-black uppercase cursor-pointer"
                                  >
                                    Complete
                                  </button>
                                )}
                                {apt.status !== 'cancelled' && (
                                  <button
                                    onClick={() => handleCancelAppointment(apt.id)}
                                    className="px-2 py-1 bg-rose-500/10 text-rose-450 border border-rose-500/20 rounded text-[9px] font-black uppercase cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: HOSPITALS */}
              {activeTab === 'hospitals' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white">Hospitals Node Directory</h3>
                    <button
                      onClick={() => handleOpenHospitalForm()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Hospital Node
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hospitals.map(h => (
                      <div key={h.id} className="depth-card bg-slate-900/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                        <div>
                          <h4 className="text-white font-extrabold text-sm flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-amber-400" /> {h.name}
                          </h4>
                          <p className="text-[11px] text-slate-450 mt-1">{h.location}</p>
                          <p className="text-[11px] text-slate-500 mt-2">{h.address}</p>
                          <p className="text-[11px] text-slate-500">Contact: {h.contact || 'No phone'}</p>
                          {h.specialties?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {h.specialties.map(s => (
                                <span key={s} className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[8px] font-black uppercase px-2 py-0.5 rounded">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-5 border-t border-white/5 pt-4 flex gap-2 justify-end">
                          <button
                            onClick={() => handleOpenHospitalForm(h)}
                            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-white/10 text-xs font-bold text-slate-350 rounded-xl cursor-pointer"
                          >
                            Edit Node
                          </button>
                          <button
                            onClick={() => handleDeleteHospital(h.id)}
                            className="px-3 py-1.5 bg-rose-950/45 hover:bg-rose-650 text-xs font-bold text-rose-450 hover:text-white rounded-xl cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: MEDICAL RECORDS */}
              {activeTab === 'records' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/20">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 bg-white/5 text-[9px] uppercase font-bold tracking-wider">
                          <th className="p-3">Record ID</th>
                          <th className="p-3">Diagnosis Summary</th>
                          <th className="p-3">Prescription Log</th>
                          <th className="p-3">Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map(rec => (
                          <tr key={rec.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 text-xs font-semibold">
                            <td className="p-3 text-slate-500 font-mono text-[10px]">{rec.id.slice(0, 8)}...</td>
                            <td className="p-3 text-white font-bold">{rec.diagnosis}</td>
                            <td className="p-3 text-slate-350 truncate max-w-xs">{rec.prescription || 'No medicines logged'}</td>
                            <td className="p-3 text-slate-450 font-mono">{new Date(rec.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: EMERGENCY SOS */}
              {activeTab === 'sos' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/20">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 bg-white/5 text-[9px] uppercase font-bold tracking-wider">
                          <th className="p-3">SOS alert id</th>
                          <th className="p-3">Location Coordinates</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sosAlerts.map(alert => (
                          <tr key={alert.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 text-xs font-semibold">
                            <td className="p-3 text-white font-mono">{alert.id.slice(0, 8)}...</td>
                            <td className="p-3 text-slate-400 font-mono">Lat: {alert.location_lat || 'N/A'} &bull; Long: {alert.location_long || 'N/A'}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                alert.status === 'active' ? 'bg-rose-500/10 text-rose-450 border border-rose-500/20 animate-pulse' : 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                              }`}>
                                {alert.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {alert.status === 'active' && (
                                <button
                                  onClick={() => handleResolveSos(alert.id)}
                                  className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded text-[9px] font-black uppercase cursor-pointer"
                                >
                                  Resolve SOS
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 7: AUDIT LOGS */}
              {activeTab === 'audits' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/20">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 bg-white/5 text-[9px] uppercase font-bold tracking-wider">
                          <th className="p-3">Timestamp</th>
                          <th className="p-3">Admin / Action</th>
                          <th className="p-3">Details / Parameters</th>
                          <th className="p-3">IP Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {audits.map(log => (
                          <tr key={log.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 text-xs font-semibold">
                            <td className="p-3 text-slate-450 font-mono">{new Date(log.created_at).toLocaleString()}</td>
                            <td className="p-3 text-indigo-400 font-bold">{log.action}</td>
                            <td className="p-3 text-white">{log.details || 'None'}</td>
                            <td className="p-3 text-slate-500 font-mono">{log.ip_address}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 8: FEEDBACK & REVIEWS */}
              {activeTab === 'reviews' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.map(rev => (
                    <div key={rev.id} className="depth-card bg-slate-900/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1 mb-2">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star key={idx} className={`w-3.5 h-3.5 ${idx < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-650'}`} />
                          ))}
                        </div>
                        <p className="text-slate-300 text-xs font-semibold leading-relaxed italic">"{rev.review}"</p>
                      </div>
                      <p className="text-[9px] text-slate-550 mt-4 font-mono">{new Date(rev.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 9: ANNOUNCEMENTS */}
              {activeTab === 'alerts' && (
                <div className="depth-card bg-slate-900/40 border border-white/10 p-6 rounded-2xl max-w-2xl mx-auto">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5"><Bell className="w-4 h-4 text-rose-500" /> Send System Announcement</h3>
                  
                  <form onSubmit={handleSendAnnouncement} className="space-y-4">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Announcement Type</label>
                      <select
                        value={announcementType}
                        onChange={e => setAnnouncementType(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-350"
                      >
                        <option value="info">General Announcement (All Users)</option>
                        <option value="maintenance">Maintenance Notice (Clinicians & Patients)</option>
                        <option value="health">Health Awareness Alert (Patients Only)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Server Maintenance Schedule"
                        value={announcementTitle}
                        onChange={e => setAnnouncementTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Message Body</label>
                      <textarea
                        rows="4"
                        placeholder="Describe announcement notes..."
                        value={announcementMsg}
                        onChange={e => setAnnouncementMsg(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Bell className="w-4 h-4" /> Send Announcement
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 10: REPORTS & EXPORT */}
              {activeTab === 'reports' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { id: 'patients', title: 'Export Patients Registry', desc: 'Active patient profiles, contact cards, and registrations.' },
                    { id: 'doctors', title: 'Export Clinicians Registry', desc: 'Assigned hospitals, medical specialties, and verified licenses.' },
                    { id: 'appointments', title: 'Export Appointments Log', desc: 'Visit lists, timestamps, status flags, and schedules.' }
                  ].map(item => (
                    <div key={item.id} className="depth-card bg-slate-900/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                      <div>
                        <h4 className="text-white font-extrabold text-sm">{item.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => handleExportData(item.id)}
                        className="mt-6 w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-550/20 text-indigo-400 hover:text-indigo-350 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer transition"
                      >
                        <Download className="w-4 h-4" /> Export CSV File
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 11: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="depth-card bg-slate-900/40 border border-white/10 p-6 rounded-2xl max-w-2xl mx-auto space-y-6">
                  <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">Website & System Configuration</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-white">AI Copilot Reasoning Model</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Select backend model for diagnostic summaries.</p>
                      </div>
                      <select
                        value={aiModel}
                        onChange={e => setAiModel(e.target.value)}
                        className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="gpt-4o-mini">gpt-4o-mini (Default)</option>
                        <option value="gpt-4o">gpt-4o (Clinical)</option>
                        <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                      </select>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <div>
                        <h4 className="text-xs font-bold text-white">Maintenance Mode</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Temporarily restrict patient appointments.</p>
                      </div>
                      <button
                        onClick={() => setMaintMode(!maintMode)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                          maintMode ? 'bg-indigo-650' : 'bg-slate-800'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                          maintMode ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <div>
                        <h4 className="text-xs font-bold text-white">Automated Email Alerts</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Notify users of prescription releases.</p>
                      </div>
                      <button
                        onClick={() => setEmailAlerts(!emailAlerts)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                          emailAlerts ? 'bg-indigo-650' : 'bg-slate-800'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                          emailAlerts ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}

      </div>

      {/* HOSPITAL MODAL */}
      <AnimatePresence>
        {isHospitalFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-white/15 rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto relative custom-scrollbar space-y-4">
              <button onClick={() => setIsHospitalFormOpen(false)} className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white cursor-pointer transition"><X className="w-5 h-5" /></button>

              <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
                <MapPin className="w-5 h-5 text-indigo-400" />
                {editingHospital ? 'Edit Hospital Information' : 'Add Hospital Node'}
              </h2>

              <form onSubmit={handleHospitalSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Hospital Name</label>
                  <input
                    type="text"
                    value={hospName}
                    onChange={e => setHospName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Location Coordinates / City</label>
                  <input
                    type="text"
                    placeholder="e.g. New Delhi, India"
                    value={hospLoc}
                    onChange={e => setHospLoc(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Full Physical Address</label>
                  <input
                    type="text"
                    value={hospAddress}
                    onChange={e => setHospAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={hospContact}
                      onChange={e => setHospContact(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Specialties (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="Cardiology, Oncology, Orthopedics"
                      value={hospSpecialties}
                      onChange={e => setHospSpecialties(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save Hospital Information
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RESCHEDULE MODAL */}
      <AnimatePresence>
        {reschedulingAppt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-white/15 rounded-3xl p-6 w-full max-w-md relative custom-scrollbar space-y-4">
              <button onClick={() => setReschedulingAppt(null)} className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white cursor-pointer transition"><X className="w-5 h-5" /></button>

              <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Reschedule Appointment
              </h2>

              <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Select New Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white cursor-pointer"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Select New Time Slot</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:30 AM"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save Rescheduled Time
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
