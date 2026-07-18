import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  Search, Stethoscope, X, Star, Phone, Mail,
  Calendar, Users, Award, ChevronRight, Loader2,
  ShieldCheck, Clock, TrendingUp, Trash2, Edit,
  Plus, Check, CheckCircle2, AlertCircle, Save,
  UserCheck, UserX, ShieldAlert, Award as QualIcon, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const SPECIALTIES = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Oncology',
  'Pediatrics', 'Dermatology', 'Psychiatry', 'Radiology', 'General Practice'
];

export const Doctors = () => {
  const { profile } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Approved, Pending, Suspended

  // Modals & Details State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('General Practice');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [organization, setOrganization] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);

  // 🔒 Admin-only page — block access for doctors and patients
  if (profile && profile.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          Only <span className="font-semibold text-rose-400">Administrators</span> can view the Doctors directory.
          Please contact your system admin if you need access.
        </p>
      </div>
    );
  }

  // Fetch Doctors List
  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'doctor')
        .order('full_name', { ascending: true });
      if (error) throw error;
      setDoctors(data || []);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      toast.error('Failed to load doctor profiles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Open Form Modal (Add / Edit)
  const handleOpenForm = (doc = null) => {
    if (doc) {
      setEditingDoctor(doc);
      setFullName(doc.full_name || '');
      setEmail(doc.email || '');
      setPhone(doc.phone || '');
      setSpecialty(doc.specialty || 'General Practice');
      setLicenseNumber(doc.license_number || '');
      setOrganization(doc.organization || '');
      setQualifications(doc.qualifications || '');
      setExperienceYears(doc.experience_years || 0);
    } else {
      setEditingDoctor(null);
      setFullName('');
      setEmail('');
      setPhone('');
      setSpecialty('General Practice');
      setLicenseNumber('');
      setOrganization('');
      setQualifications('');
      setExperienceYears(0);
    }
    setIsFormOpen(true);
  };

  // Submit Add / Edit Doctor Profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName) {
      toast.error('Full Name is required.');
      return;
    }

    const payload = {
      full_name: fullName,
      email: email || null,
      phone: phone || null,
      specialty,
      license_number: licenseNumber || null,
      organization,
      qualifications,
      experience_years: Number(experienceYears) || 0,
      role: 'doctor',
      approved: editingDoctor ? editingDoctor.approved : true,
      verified: editingDoctor ? editingDoctor.verified : true
    };

    try {
      if (editingDoctor) {
        // Update existing doctor profile
        const { error } = await supabase
          .from('profiles')
          .update(payload)
          .eq('id', editingDoctor.id);

        if (error) throw error;
        toast.success('Doctor profile updated successfully!');
      } else {
        // Create new doctor profile (generates a random auth-linked matching ID)
        const newId = crypto.randomUUID();
        const { error } = await supabase
          .from('profiles')
          .insert([{ ...payload, id: newId }]);

        if (error) throw error;
        toast.success('New doctor profile added successfully!');
      }
      setIsFormOpen(false);
      fetchDoctors();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save doctor profile.');
    }
  };

  // Delete Doctor Profile
  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm("Are you sure you want to remove this doctor profile? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', doctorId);

      if (error) throw error;

      toast.success("Doctor profile removed successfully");
      setDoctors(prev => prev.filter(d => d.id !== doctorId));
      setSelectedDoctor(null);
    } catch (err) {
      console.error("Error removing doctor:", err);
      toast.error("Failed to remove doctor profile");
    }
  };

  // Approve Doctor Registration
  const handleApproveDoctor = async (doctorId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approved: true })
        .eq('id', doctorId);

      if (error) throw error;

      // Notify the doctor
      await supabase.from('notifications').insert([{
        user_id: doctorId,
        title: "Account Approved",
        message: "Your doctor account has been approved by the system administrator.",
        type: "info"
      }]);

      toast.success("Doctor account approved successfully!");
      fetchDoctors();
      if (selectedDoctor?.id === doctorId) {
        setSelectedDoctor(prev => ({ ...prev, approved: true }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve doctor registration.");
    }
  };

  // Reject / Suspend Doctor Registration
  const handleSuspendDoctor = async (doctorId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approved: false })
        .eq('id', doctorId);

      if (error) throw error;

      // Notify the doctor
      await supabase.from('notifications').insert([{
        user_id: doctorId,
        title: "Account Suspended",
        message: "Your doctor account status has been updated to suspended. Please contact admin.",
        type: "warning"
      }]);

      toast.success("Doctor account suspended successfully!");
      fetchDoctors();
      if (selectedDoctor?.id === doctorId) {
        setSelectedDoctor(prev => ({ ...prev, approved: false }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to suspend doctor account.");
    }
  };

  // Verify Doctor Credentials Toggle
  const handleToggleVerification = async (doctorId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verified: !currentStatus })
        .eq('id', doctorId);

      if (error) throw error;

      // Notify doctor
      await supabase.from('notifications').insert([{
        user_id: doctorId,
        title: "Account Verification Updated",
        message: `Your medical verification status has been updated to: ${!currentStatus ? 'Verified' : 'Unverified'}.`,
        type: "info"
      }]);

      toast.success("Doctor account verification status updated!");
      fetchDoctors();
      if (selectedDoctor?.id === doctorId) {
        setSelectedDoctor(prev => ({ ...prev, verified: !currentStatus }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update doctor verification status.");
    }
  };

  // Filters logic
  const filteredDoctors = doctors.filter(d => {
    const matchSearch =
      d.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.license_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchSpec = selectedSpecialty === 'All' || d.specialty === selectedSpecialty;

    let matchStatus = true;
    if (statusFilter === 'Approved') matchStatus = d.approved === true;
    else if (statusFilter === 'Pending') matchStatus = d.approved === false;
    else if (statusFilter === 'Suspended') matchStatus = d.approved === false;

    return matchSearch && matchSpec && matchStatus;
  });

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 p-6 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden font-sans shadow-2xl">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f2fe05_1px,transparent_1px),linear-gradient(to_bottom,#00f2fe05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        
        {/* Header Block */}
        <div className="border-b border-white/10 pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1 shadow-md">
                <Stethoscope className="w-3.5 h-3.5" /> Staff Directory
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
              Manage Doctor Accounts
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Verify credentials, approve applications, modify medical profiles, or suspend system access.
            </p>
          </div>

          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md self-start md:self-center"
          >
            <Plus className="w-4 h-4" /> Add Doctor Profile
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="depth-card bg-slate-900/40 border border-white/10 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
          
          {/* Search bar */}
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, specialty, email, or license..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Specialty Dropdown */}
          <div className="w-full md:w-48">
            <select
              value={selectedSpecialty}
              onChange={e => setSelectedSpecialty(e.target.value)}
              className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Specialties</option>
              {SPECIALTIES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved Only</option>
              <option value="Pending">Pending Approvals</option>
            </select>
          </div>

        </div>

        {/* Doctors Grid/Table */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-500" />
            <p className="text-xs">Fetching registered clinicians...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="depth-card bg-slate-900/30 border border-white/5 rounded-2xl p-16 text-center text-slate-400">
            <Stethoscope className="w-10 h-10 text-slate-650 mx-auto mb-4" />
            <h3 className="text-sm font-bold text-white">No Doctor Accounts Found</h3>
            <p className="text-xs text-slate-500 mt-1">There are no clinician accounts matching the active filter properties.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/20 backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 bg-white/5 text-[10px] uppercase font-bold tracking-wider">
                  <th className="p-4">Doctor Details</th>
                  <th className="p-4">License / Specialty</th>
                  <th className="p-4">Organization / Hospital</th>
                  <th className="p-4 text-center">Approved</th>
                  <th className="p-4 text-center">Verified</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.map(doctor => (
                  <tr key={doctor.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors text-xs font-semibold">
                    
                    {/* Name / Contact */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm">
                          {doctor.full_name?.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'Dr'}
                        </div>
                        <div>
                          <p className="text-white font-bold">Dr. {doctor.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">{doctor.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Specialty / License */}
                    <td className="p-4">
                      <p className="text-indigo-400 font-bold">{doctor.specialty || 'General Practice'}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Lic: {doctor.license_number || 'N/A'}</p>
                    </td>

                    {/* Organization / Hospital */}
                    <td className="p-4 text-slate-350">
                      {doctor.organization || 'Not Assigned'}
                    </td>

                    {/* Approved Toggle */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => doctor.approved ? handleSuspendDoctor(doctor.id) : handleApproveDoctor(doctor.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wide cursor-pointer transition ${
                          doctor.approved 
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-450' 
                            : 'bg-rose-500/10 border-rose-500/25 text-rose-450'
                        }`}
                      >
                        {doctor.approved ? 'Approved' : 'Suspended'}
                      </button>
                    </td>

                    {/* Verified Toggle */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleVerification(doctor.id, doctor.verified)}
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wide cursor-pointer transition ${
                          doctor.verified 
                            ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-455' 
                            : 'bg-slate-800 border-white/10 text-slate-450'
                        }`}
                      >
                        {doctor.verified ? 'Verified' : 'Unverified'}
                      </button>
                    </td>

                    {/* Actions buttons */}
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setSelectedDoctor(doctor)}
                          className="p-1.5 bg-slate-950 hover:bg-slate-900 border border-white/10 text-slate-300 rounded-lg cursor-pointer transition"
                          title="View Profile Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenForm(doctor)}
                          className="p-1.5 bg-indigo-650/40 hover:bg-indigo-650 text-indigo-400 hover:text-white border border-indigo-550/20 rounded-lg cursor-pointer transition"
                          title="Edit Profile"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDoctor(doctor.id)}
                          className="p-1.5 bg-rose-950/45 hover:bg-rose-650 text-rose-450 hover:text-white border border-rose-550/20 rounded-lg cursor-pointer transition"
                          title="Remove Profile"
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
        )}

      </div>

      {/* DETAIL DRAWER */}
      <AnimatePresence>
        {selectedDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/15 rounded-3xl p-6 w-full max-w-xl max-h-[85vh] overflow-y-auto font-sans shadow-2xl relative custom-scrollbar space-y-6"
            >
              <button 
                onClick={() => setSelectedDoctor(null)}
                className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Profile Details Hero */}
              <div className="flex gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold text-lg">
                  {selectedDoctor.full_name?.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'Dr'}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Dr. {selectedDoctor.full_name}</h3>
                  <p className="text-xs text-indigo-400 font-bold mt-0.5">{selectedDoctor.specialty || 'General Practice'}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">License: {selectedDoctor.license_number || 'N/A'}</p>
                </div>
              </div>

              {/* Advanced info segments */}
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div>
                  <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-black">Organization / Hospital</h4>
                  <p className="text-xs text-white font-bold mt-1">{selectedDoctor.organization || 'Not Assigned'}</p>
                </div>

                <div>
                  <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-black">Experience (Years)</h4>
                  <p className="text-xs text-white font-bold mt-1">{selectedDoctor.experience_years || 0} Years</p>
                </div>
              </div>

              {selectedDoctor.qualifications && (
                <div>
                  <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-black">Qualifications & Degrees</h4>
                  <p className="text-xs text-slate-350 mt-1 leading-relaxed font-semibold">{selectedDoctor.qualifications}</p>
                </div>
              )}

              <div className="border-t border-white/5 pt-4 space-y-2">
                <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-black">Contact Credentials</h4>
                <div className="bg-slate-950/40 border border-white/10 rounded-xl divide-y divide-white/5">
                  <div className="flex items-center gap-3 px-4 py-2.5 text-xs">
                    <Mail className="w-4 h-4 text-indigo-455" />
                    <span className="text-slate-300 font-medium">{selectedDoctor.email || 'No email registered'}</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2.5 text-xs">
                    <Phone className="w-4 h-4 text-indigo-455" />
                    <span className="text-slate-300 font-medium">{selectedDoctor.phone || 'No phone registered'}</span>
                  </div>
                </div>
              </div>

              {/* Status Actions panel */}
              <div className="border-t border-white/5 pt-4 flex gap-3">
                <button
                  onClick={() => selectedDoctor.approved ? handleSuspendDoctor(selectedDoctor.id) : handleApproveDoctor(selectedDoctor.id)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition border ${
                    selectedDoctor.approved 
                      ? 'bg-rose-500/10 hover:bg-rose-500/15 border-rose-500/25 text-rose-450' 
                      : 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/25 text-emerald-450'
                  }`}
                >
                  {selectedDoctor.approved ? 'Suspend Access' : 'Approve Access'}
                </button>
                <button
                  onClick={() => handleToggleVerification(selectedDoctor.id, selectedDoctor.verified)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition border ${
                    selectedDoctor.verified 
                      ? 'bg-slate-800 hover:bg-slate-750 border-white/10 text-slate-350' 
                      : 'bg-indigo-500/10 hover:bg-indigo-500/15 border-indigo-500/25 text-indigo-400'
                  }`}
                >
                  {selectedDoctor.verified ? 'Unverify Account' : 'Verify Account'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE / EDIT FORM MODAL */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/15 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto font-sans shadow-2xl relative custom-scrollbar space-y-5"
            >
              <button 
                onClick={() => setIsFormOpen(false)}
                className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-black text-white flex items-center gap-2 mb-2">
                <Stethoscope className="w-5 h-5 text-indigo-400" />
                {editingDoctor ? 'Edit Doctor Profile' : 'Add Doctor Profile'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sarah Jenkins"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Specialty</label>
                    <select
                      value={specialty}
                      onChange={e => setSpecialty(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {SPECIALTIES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="dr.jenkins@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Organization / Hospital</label>
                    <input
                      type="text"
                      placeholder="e.g. City General Hospital"
                      value={organization}
                      onChange={e => setOrganization(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Experience (Years)</label>
                    <input
                      type="number"
                      placeholder="5"
                      value={experienceYears}
                      onChange={e => setExperienceYears(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Medical License Number</label>
                  <input
                    type="text"
                    placeholder="e.g. REG-M-84729"
                    value={licenseNumber}
                    onChange={e => setLicenseNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Qualifications & Degrees</label>
                  <textarea
                    rows="3"
                    placeholder="e.g. MBBS, MD Cardiology (Stanford University)"
                    value={qualifications}
                    onChange={e => setQualifications(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition"
                >
                  <Save className="w-4 h-4" /> Save Doctor Profile
                </button>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
