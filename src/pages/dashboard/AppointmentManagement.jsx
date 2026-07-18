import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, CheckCircle, AlertCircle, XCircle, Search, 
  Filter, Video, Phone, MessageSquare, Check, X, RefreshCw, 
  User, FileText, Sparkles, ChevronDown, Clock3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const AppointmentManagement = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'upcoming' | 'history'

  // Reschedule Modal States
  const [reschedulingApt, setReschedulingApt] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  // Fetch Inbound Appointments for Doctor
  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patient_id (
            full_name,
            avatar_url,
            phone
          )
        `)
        .eq('doctor_id', user.id)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error('Error fetching doctor appointments:', err);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Status update handler (database updates & notification dispatch)
  const handleUpdateStatus = async (apt, newStatus) => {
    const toastId = toast.loading(`Updating appointment status to ${newStatus}...`);
    try {
      // 1. Update appointment status in database
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', apt.id);

      if (updateError) throw updateError;

      // 2. Format notifications context
      let title = "Appointment Updated";
      let message = `Your appointment has been marked as ${newStatus}.`;
      let type = "info";

      if (newStatus === 'confirmed') {
        title = "Appointment Confirmed";
        message = `Dr. ${user.user_metadata?.full_name || 'your clinician'} has accepted your appointment scheduled for ${new Date(apt.scheduled_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.`;
        type = "success";
      } else if (newStatus === 'rejected') {
        title = "Appointment Declined";
        message = `Dr. ${user.user_metadata?.full_name || 'your clinician'} has declined your appointment request.`;
        type = "error";
      } else if (newStatus === 'cancelled') {
        title = "Appointment Cancelled";
        message = `Your consultation scheduled for ${new Date(apt.scheduled_at).toLocaleDateString()} has been cancelled.`;
        type = "error";
      } else if (newStatus === 'completed') {
        title = "Consultation Completed";
        message = `Your consultation with Dr. ${user.user_metadata?.full_name || 'your clinician'} is complete. You can view your record summary in your dashboard.`;
        type = "success";
      }

      // 3. Save notification record in database
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([{
          user_id: apt.patient_id,
          title: title,
          message: message,
          type: type
        }]);

      if (notificationError) {
        console.warn("Real-time notification failed to log, but status was updated successfully:", notificationError);
      }

      toast.success(`Appointment successfully ${newStatus}!`, { id: toastId });
      fetchAppointments();
    } catch (err) {
      console.error('Update status error:', err);
      toast.error(err.message || 'Failed to update status', { id: toastId });
    }
  };

  // Reschedule handler
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!reschedulingApt || !newDate || !newTime) return;

    setRescheduling(true);
    const toastId = toast.loading('Rescheduling appointment...');

    try {
      const scheduledDateTime = new Date(`${newDate}T${newTime}`).toISOString();

      // 1. Update appointment time in database
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ 
          scheduled_at: scheduledDateTime,
          status: 'scheduled' // Reset status to scheduled
        })
        .eq('id', reschedulingApt.id);

      if (updateError) throw updateError;

      // 2. Dispatch reschedule notification to patient
      const formattedTime = new Date(scheduledDateTime).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([{
          user_id: reschedulingApt.patient_id,
          title: "Appointment Rescheduled",
          message: `Dr. ${user.user_metadata?.full_name || 'your clinician'} has rescheduled your consultation. New time: ${formattedTime}.`,
          type: "warning"
        }]);

      if (notificationError) {
        console.warn("Reschedule notification log failed:", notificationError);
      }

      toast.success('Appointment rescheduled successfully!', { id: toastId });
      setReschedulingApt(null);
      setNewDate('');
      setNewTime('');
      fetchAppointments();
    } catch (err) {
      console.error('Reschedule error:', err);
      toast.error(err.message || 'Failed to reschedule appointment', { id: toastId });
    } finally {
      setRescheduling(false);
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'scheduled':
        return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400';
      case 'pending':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'completed':
        return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
      case 'cancelled':
      case 'rejected':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      default:
        return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
    }
  };

  // Consultation Type icon helper
  const getConsultTypeIcon = (notesText) => {
    const text = notesText?.toLowerCase() || '';
    if (text.includes('[video') || text.includes('video')) {
      return <Video className="w-3.5 h-3.5 text-cyan-400" />;
    }
    if (text.includes('[audio') || text.includes('audio') || text.includes('phone')) {
      return <Phone className="w-3.5 h-3.5 text-purple-400" />;
    }
    return <MessageSquare className="w-3.5 h-3.5 text-amber-400" />;
  };

  // Split appointments into tabs
  const today = new Date().toDateString();
  const now = new Date();

  const todayList = appointments.filter(a => {
    const aptDate = new Date(a.scheduled_at).toDateString();
    return aptDate === today && a.status !== 'cancelled' && a.status !== 'rejected' && a.status !== 'completed';
  });

  const upcomingList = appointments.filter(a => {
    const aptDate = new Date(a.scheduled_at);
    return aptDate.toDateString() !== today && aptDate > now && a.status !== 'cancelled' && a.status !== 'rejected' && a.status !== 'completed';
  });

  const historyList = appointments.filter(a => {
    const aptDate = new Date(a.scheduled_at);
    return a.status === 'completed' || a.status === 'cancelled' || a.status === 'rejected' || aptDate < now;
  });

  const getActiveTabList = () => {
    if (activeTab === 'today') return todayList;
    if (activeTab === 'upcoming') return upcomingList;
    return historyList;
  };

  // Apply filters (search name, date select, status dropdown)
  const filteredList = getActiveTabList().filter(apt => {
    const patientName = apt.patient?.full_name?.toLowerCase() || '';
    const matchesSearch = patientName.includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || apt.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter) {
      const selectDateStr = new Date(dateFilter).toDateString();
      const aptDateStr = new Date(apt.scheduled_at).toDateString();
      matchesDate = selectDateStr === aptDateStr;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 p-6 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden font-sans shadow-2xl">
      {/* Background radial details */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f2fe05_1px,transparent_1px),linear-gradient(to_bottom,#00f2fe05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto relative z-10"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1 shadow-md">
                <Sparkles className="w-3 h-3" /> Clinical Schedule
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
              Appointment Management
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl font-medium">
              Review patient consultation requests, accept bookings, modify scheduled timings, and track clinical history notes.
            </p>
          </div>
        </div>

        {/* Top metrics dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="depth-card holo-surface p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Total Inbound</span>
              <span className="text-xl font-extrabold text-white mt-1 block font-mono">{appointments.length} Total</span>
            </div>
          </div>

          <div className="depth-card holo-surface p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 animate-pulse">
              <Clock3 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Today's Queue</span>
              <span className="text-xl font-extrabold text-white mt-1 block font-mono">{todayList.length} Active</span>
            </div>
          </div>

          <div className="depth-card holo-surface p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Completed</span>
              <span className="text-xl font-extrabold text-white mt-1 block font-mono">{appointments.filter(a => a.status === 'completed').length} Patients</span>
            </div>
          </div>

          <div className="depth-card holo-surface p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Pending Requests</span>
              <span className="text-xl font-extrabold text-white mt-1 block font-mono">
                {appointments.filter(a => a.status === 'pending' || a.status === 'scheduled').length} Pending
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="flex gap-6 border-b border-white/10 pb-4 mb-6">
          <button 
            onClick={() => setActiveTab('today')}
            className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 cursor-pointer transition-all ${
              activeTab === 'today' ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Today's Queue ({todayList.length})
          </button>
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 cursor-pointer transition-all ${
              activeTab === 'upcoming' ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Upcoming Schedule ({upcomingList.length})
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 cursor-pointer transition-all ${
              activeTab === 'history' ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Appointment History ({historyList.length})
          </button>
        </div>

        {/* Filtering Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 items-center">
          {/* Patient name search */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Date Picker Filter */}
          <div className="md:col-span-3">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            />
          </div>

          {/* Status Dropdown */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* List Appointments Layout */}
        {loading ? (
          <div className="depth-card bg-slate-900/30 border border-white/5 rounded-3xl p-16 flex flex-col items-center justify-center gap-4 min-h-[300px]">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-slate-400 text-sm font-semibold">Syncing queue schedule from database...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="depth-card bg-slate-900/30 border border-white/5 rounded-3xl p-16 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
            <Calendar className="w-12 h-12 text-slate-500" />
            <h3 className="text-lg font-bold text-white">No consultations found</h3>
            <p className="text-slate-400 text-sm max-w-sm font-medium">
              {searchQuery || statusFilter !== 'All' || dateFilter
                ? 'Try adjusting your search queries or filter attributes.'
                : `There are no consultations logged in this queue.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredList.map(apt => {
                const date = new Date(apt.scheduled_at);
                const isVideo = apt.notes?.toLowerCase().includes('[video') || apt.notes?.toLowerCase().includes('video');
                const isAudio = apt.notes?.toLowerCase().includes('[audio') || apt.notes?.toLowerCase().includes('audio') || apt.notes?.toLowerCase().includes('phone');
                
                return (
                  <motion.div
                    key={apt.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      {/* Left: Glass Calendar Block */}
                      <div className="w-14 h-14 rounded-xl bg-slate-950 border border-white/10 flex flex-col items-center justify-center text-center shrink-0">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                          {date.toLocaleDateString([], { month: 'short' })}
                        </span>
                        <span className="text-lg font-black text-white font-mono leading-none mt-1">
                          {date.getDate()}
                        </span>
                      </div>

                      {/* Right: Info Area */}
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start mb-1.5 gap-2">
                          <h4 className="font-extrabold text-sm text-white truncate" title={apt.patient?.full_name || 'Patient'}>
                            {apt.patient?.full_name || 'Patient'}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase border shrink-0 ${getStatusBadge(apt.status)}`}>
                            {apt.status}
                          </span>
                        </div>

                        {/* Schedule detail and Consult Badge */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-semibold mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1 capitalize">
                            {getConsultTypeIcon(apt.notes)}
                            {isVideo ? 'video' : isAudio ? 'audio' : 'chat'} consult
                          </span>
                        </div>

                        {/* Patient Phone Details */}
                        {apt.patient?.phone && (
                          <p className="text-[10px] text-slate-500 font-mono mt-1">
                            Contact: {apt.patient.phone}
                          </p>
                        )}

                        {/* Notes details */}
                        {apt.notes && (
                          <p className="text-[11px] text-slate-500 leading-relaxed font-semibold mt-3 bg-slate-950/30 p-2 rounded-lg border border-white/5">
                            {apt.notes.replace(/\[.*?\]/, '')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Action buttons drawer */}
                    {['pending', 'scheduled', 'confirmed'].includes(apt.status) && (
                      <div className="mt-5 pt-4 border-t border-white/5 flex gap-2 justify-end">
                        {/* Reschedule Button */}
                        <button
                          onClick={() => {
                            setNewDate(apt.scheduled_at.split('T')[0]);
                            setNewTime(new Date(apt.scheduled_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }));
                            setReschedulingApt(apt);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 bg-white/5 text-slate-350 hover:text-white transition cursor-pointer"
                        >
                          Reschedule
                        </button>

                        {/* Accept / Reject actions */}
                        {(apt.status === 'pending' || apt.status === 'scheduled') && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(apt, 'confirmed')}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-sm shadow-emerald-600/10 flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Accept
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(apt, 'rejected')}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer shadow-sm shadow-rose-600/10 flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}

                        {/* Complete / Cancel actions */}
                        {apt.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(apt, 'completed')}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-sm shadow-emerald-600/10 flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" /> Complete
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(apt, 'cancelled')}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer shadow-sm shadow-rose-600/10 flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" /> Cancel
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* --- RESCHEDULE DIALOG --- */}
      <AnimatePresence>
        {reschedulingApt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setReschedulingApt(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 relative z-10 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" /> Reschedule Appointment
              </h3>
              <p className="text-xs text-slate-400 mb-4 font-semibold">
                Update date and time for: <span className="text-slate-200">{reschedulingApt.patient?.full_name || 'Patient'}</span>
              </p>

              <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="text-slate-400 block mb-1">Select New Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Select New Time</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
                  <button
                    type="button"
                    onClick={() => setReschedulingApt(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-350 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={rescheduling}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-55"
                  >
                    {rescheduling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Confirm Reschedule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
