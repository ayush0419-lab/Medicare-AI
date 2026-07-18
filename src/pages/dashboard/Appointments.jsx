import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppointments } from '../../hooks/useAppointments';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  Search, Filter, Calendar, Clock, Video, Phone, 
  MessageSquare, MapPin, Star, User, Stethoscope, 
  Sparkles, X, Check, Trash2, AlertCircle, RefreshCw, 
  Award, DollarSign, Building, CheckCircle, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

// Specialty listing for filtering
const SPECIALTIES = [
  'All', 'Cardiology', 'Neurology', 'Orthopedics', 'Oncology',
  'Pediatrics', 'Dermatology', 'Psychiatry', 'Radiology', 'General Practice'
];

// Helper to generate consistent mock doctor metadata based on their UUID
const getDoctorMeta = (doc) => {
  if (!doc) return null;
  const hash = doc.id ? doc.id.split('-').join('') : 'default';
  const char1 = hash.charCodeAt(0) || 75;
  const char2 = hash.charCodeAt(1) || 84;
  const char3 = hash.charCodeAt(2) || 99;

  const experience = (char1 % 15) + 4;
  const rating = (4.2 + (char2 % 8) / 10).toFixed(1);
  const fee = 60 + (char3 % 6) * 10;
  const city = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'Boston'][char1 % 6];
  const hospital = doc.organization || `MediCare ${city} Clinic`;
  
  const slots = ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'];

  return {
    experience,
    rating,
    fee,
    city,
    hospital,
    slots
  };
};

export const Appointments = () => {
  const { profile } = useAuth();
  const { appointments, loading, refreshAppointments, scheduleAppointment, updateStatus } = useAppointments();
  
  // Dashboard states
  const [activeSubTab, setActiveSubTab] = useState('upcoming'); // 'upcoming' or 'past'
  const [patientView, setPatientView] = useState('list'); // 'list' or 'book'

  // Booking states
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedFee, setSelectedFee] = useState('All');
  const [selectedExp, setSelectedExp] = useState('All');

  // Booking details modal
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingType, setBookingType] = useState('Video'); // 'Video', 'Audio', 'Chat'
  const [bookingDate, setBookingDate] = useState('');
  const [bookingSlot, setBookingSlot] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reschedule state
  const [reschedulingApt, setReschedulingApt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');

  // Fetch doctors for patients
  useEffect(() => {
    if (profile?.role === 'patient' && patientView === 'book') {
      const fetchDoctors = async () => {
        setLoadingDoctors(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'doctor')
            .order('full_name', { ascending: true });
          if (error) throw error;
          setDoctors(data || []);
        } catch (err) {
          console.error("Error fetching doctors:", err);
          toast.error("Failed to load doctors list");
        } finally {
          setLoadingDoctors(false);
        }
      };
      fetchDoctors();
    }
  }, [profile?.role, patientView]);

  // Handle reschedule action
  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleSlot) {
      toast.error("Please choose a date and time slot.");
      return;
    }

    setSubmitting(true);
    try {
      const scheduledAt = new Date(`${rescheduleDate}T${convertSlotTo24h(rescheduleSlot)}`).toISOString();
      const updatedNotes = `[Rescheduled] ${reschedulingApt.notes || ''}`;
      
      const { error } = await supabase
        .from('appointments')
        .update({ 
          scheduled_at: scheduledAt,
          notes: updatedNotes,
          status: 'scheduled' // Reset status to scheduled
        })
        .eq('id', reschedulingApt.id);

      if (error) throw error;
      toast.success("Appointment rescheduled successfully!");
      setReschedulingApt(null);
      refreshAppointments();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reschedule appointment");
    } finally {
      setSubmitting(false);
    }
  };

  // Convert "02:00 PM" to "14:00"
  const convertSlotTo24h = (slot) => {
    const [time, modifier] = slot.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    return `${hours}:${minutes}`;
  };

  // Create booking
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!bookingDate || !bookingSlot) {
      toast.error("Please choose a date and time slot.");
      return;
    }

    setSubmitting(true);
    try {
      const scheduledAt = new Date(`${bookingDate}T${convertSlotTo24h(bookingSlot)}`).toISOString();
      const fullNotes = `[${bookingType} Consultation] ${bookingNotes}`;

      const aptData = {
        patient_id: profile.id,
        doctor_id: selectedDoctor.id,
        scheduled_at: scheduledAt,
        type: 'virtual', // Default standard type
        notes: fullNotes,
        status: 'scheduled'
      };

      const result = await scheduleAppointment(aptData);
      if (result) {
        setSelectedDoctor(null);
        setBookingNotes('');
        setBookingSlot('');
        setPatientView('list');
        refreshAppointments();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete booking");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  // Filter appointments for lists
  const upcomingApts = appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed');
  const pastApts = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled' || a.status === 'no-show');
  const currentList = activeSubTab === 'upcoming' ? upcomingApts : pastApts;

  // Filter Doctors on UI
  const filteredDoctors = doctors.filter(doc => {
    const meta = getDoctorMeta(doc);
    const matchesSearch = doc.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          meta?.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          meta?.hospital.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpec = selectedSpecialty === 'All' || doc.specialty === selectedSpecialty;
    const matchesFee = selectedFee === 'All' || 
                       (selectedFee === 'low' && meta?.fee <= 80) ||
                       (selectedFee === 'high' && meta?.fee > 80);
    const matchesExp = selectedExp === 'All' || 
                       (selectedExp === 'mid' && meta?.experience <= 10) ||
                       (selectedExp === 'senior' && meta?.experience > 10);
    return matchesSearch && matchesSpec && matchesFee && matchesExp;
  });

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 p-6 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden font-sans shadow-2xl">
      {/* Visual cyber grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f2fe05_1px,transparent_1px),linear-gradient(to_bottom,#00f2fe05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* ========================================================
            CASE A: DOCTOR DASHBOARD VIEW
            ======================================================== */}
        {profile?.role === 'doctor' && (
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-6 mb-6">
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <Calendar className="text-purple-400 w-8 h-8" /> Inbound Consultations
              </h1>
              <p className="text-slate-400 text-sm mt-1">Accept, cancel, or reschedule booking requests sent by your patients.</p>
            </div>

            {/* List tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-3">
              <button 
                onClick={() => setActiveSubTab('upcoming')}
                className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 cursor-pointer transition-all ${
                  activeSubTab === 'upcoming' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Upcoming Requests ({upcomingApts.length})
              </button>
              <button 
                onClick={() => setActiveSubTab('past')}
                className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 cursor-pointer transition-all ${
                  activeSubTab === 'past' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Past Logs ({pastApts.length})
              </button>
            </div>

            {/* Cards container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentList.map(apt => {
                const date = new Date(apt.scheduled_at);
                const isVideo = apt.notes?.includes('[Video');
                const isAudio = apt.notes?.includes('[Audio');
                
                return (
                  <div key={apt.id} className="depth-card bg-slate-900/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between hover:border-cyan-500/20 transition-all duration-300 relative group">
                    <div className="flex items-start gap-4">
                      {/* Date details */}
                      <div className="w-14 h-14 rounded-xl bg-slate-950 border border-white/10 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{date.toLocaleDateString([], { month: 'short' })}</span>
                        <span className="text-lg font-black text-white font-mono leading-none mt-1">{date.getDate()}</span>
                      </div>
                      
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-extrabold text-sm text-white truncate">{apt.patient?.full_name || 'Patient'}</h4>
                          <span className={`text-[10px] font-black border uppercase px-2 py-0.5 rounded ${
                            apt.status === 'confirmed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-semibold mt-1">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="flex items-center gap-1">
                            {isVideo ? <Video className="w-3.5 h-3.5 text-cyan-400" /> : isAudio ? <Phone className="w-3.5 h-3.5 text-purple-400" /> : <MessageSquare className="w-3.5 h-3.5 text-purple-400" />}
                            {isVideo ? 'Video' : isAudio ? 'Audio' : 'Chat'}
                          </span>
                        </div>
                        
                        {apt.notes && (
                          <p className="text-[11px] text-slate-500 leading-relaxed font-semibold mt-2.5 bg-slate-950/30 p-2 rounded-lg border border-white/5">
                            {apt.notes.replace(/\[.*?\]/, '')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick Action triggers */}
                    {activeSubTab === 'upcoming' && (
                      <div className="mt-4 pt-4 border-t border-white/5 flex gap-2 justify-end">
                        <button 
                          onClick={() => setReschedulingApt(apt)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 bg-white/5 text-slate-300 hover:text-white cursor-pointer transition"
                        >
                          Reschedule
                        </button>
                        {apt.status === 'scheduled' && (
                          <button 
                            onClick={() => updateStatus(apt.id, 'confirmed')}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition shadow-md shadow-emerald-600/10"
                          >
                            Accept
                          </button>
                        )}
                        <button 
                          onClick={() => updateStatus(apt.id, 'cancelled')}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition shadow-md shadow-rose-600/10"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {currentList.length === 0 && (
                <div className="col-span-2 depth-card bg-slate-900/30 border border-white/5 p-12 text-center text-slate-400">
                  <Calendar className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                  <p className="text-sm font-bold text-white">No incoming consultations</p>
                  <p className="text-xs text-slate-500 mt-1">There are no {activeSubTab} logs matching your account.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            CASE B: PATIENT VIEW
            ======================================================== */}
        {profile?.role === 'patient' && (
          <div className="space-y-6">
            
            {/* Header controls toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/10 pb-6 mb-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                  Appointment Booking
                </h1>
                <p className="text-slate-400 text-sm mt-1">Book online audio/video consultations and manage scheduled hospital appointments.</p>
              </div>

              {/* View toggle */}
              <div className="flex bg-slate-900/50 backdrop-blur-md rounded-2xl p-1 border border-white/5 shadow-inner self-start">
                <button
                  onClick={() => setPatientView('list')}
                  className={`py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    patientView === 'list'
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  My Appointments
                </button>
                <button
                  onClick={() => setPatientView('book')}
                  className={`py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    patientView === 'book'
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Book Consultation
                </button>
              </div>
            </div>

            {/* Sub-view: Timeline Booking List */}
            {patientView === 'list' && (
              <div className="space-y-6">
                <div className="flex gap-4 border-b border-white/10 pb-2.5">
                  <button 
                    onClick={() => setActiveSubTab('upcoming')}
                    className={`text-xs font-bold uppercase tracking-wider pb-1.5 border-b-2 cursor-pointer transition-all ${
                      activeSubTab === 'upcoming' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Upcoming Bookings ({upcomingApts.length})
                  </button>
                  <button 
                    onClick={() => setActiveSubTab('past')}
                    className={`text-xs font-bold uppercase tracking-wider pb-1.5 border-b-2 cursor-pointer transition-all ${
                      activeSubTab === 'past' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Past Consultations ({pastApts.length})
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentList.map(apt => {
                    const date = new Date(apt.scheduled_at);
                    const isVideo = apt.notes?.includes('[Video');
                    const isAudio = apt.notes?.includes('[Audio');
                    const meta = getDoctorMeta(apt.doctor);
                    
                    return (
                      <div key={apt.id} className="depth-card bg-slate-900/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between hover:border-cyan-500/20 transition-all duration-300 group">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl bg-slate-950 border border-white/10 flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{date.toLocaleDateString([], { month: 'short' })}</span>
                            <span className="text-lg font-black text-white font-mono leading-none mt-1">{date.getDate()}</span>
                          </div>
                          
                          <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <h4 className="font-extrabold text-sm text-white truncate">Dr. {apt.doctor?.full_name || 'Physician'}</h4>
                              <span className={`text-[10px] font-black border uppercase px-2 py-0.5 rounded ${
                                apt.status === 'confirmed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                                apt.status === 'cancelled' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              }`}>
                                {apt.status}
                              </span>
                            </div>
                            
                            <p className="text-xs text-purple-400 font-semibold">{apt.doctor?.specialty || 'General Practice'}</p>
                            
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-semibold mt-2.5">
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="flex items-center gap-1">
                                {isVideo ? <Video className="w-3.5 h-3.5 text-cyan-400" /> : isAudio ? <Phone className="w-3.5 h-3.5 text-purple-400" /> : <MessageSquare className="w-3.5 h-3.5 text-purple-400" />}
                                {isVideo ? 'Video' : isAudio ? 'Audio' : 'Chat'}
                              </span>
                            </div>
                            
                            {meta && (
                              <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">{meta.hospital}</p>
                            )}
                          </div>
                        </div>

                        {activeSubTab === 'upcoming' && (
                          <div className="mt-4 pt-4 border-t border-white/5 flex gap-2 justify-end">
                            <button 
                              onClick={() => setReschedulingApt(apt)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 bg-white/5 text-slate-300 hover:text-white cursor-pointer transition"
                            >
                              Reschedule
                            </button>
                            <button 
                              onClick={() => updateStatus(apt.id, 'cancelled')}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition"
                            >
                              Cancel Booking
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {currentList.length === 0 && (
                    <div className="col-span-2 depth-card bg-slate-900/30 border border-white/5 p-12 text-center text-slate-400">
                      <Calendar className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                      <p className="text-sm font-bold text-white">No active appointments found</p>
                      <p className="text-xs text-slate-500 mt-1">Tap "Book Consultation" to find and schedule a doctor consult.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-view: Advanced Search & Directory */}
            {patientView === 'book' && (
              <div className="space-y-6">
                
                {/* Search & filters row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search doctor, specialty, hospital or city..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 transition-all"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Specialty chips */}
                    <div className="flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <select 
                        value={selectedSpecialty} 
                        onChange={e => setSelectedSpecialty(e.target.value)}
                        className="bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="All">All Specialties</option>
                        {SPECIALTIES.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* Fee filter */}
                    <select 
                      value={selectedFee} 
                      onChange={e => setSelectedFee(e.target.value)}
                      className="bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="All">All Fees</option>
                      <option value="low">Under $80</option>
                      <option value="high">$80+</option>
                    </select>

                    {/* Experience filter */}
                    <select 
                      value={selectedExp} 
                      onChange={e => setSelectedExp(e.target.value)}
                      className="bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="All">All Experience</option>
                      <option value="mid">Under 10 years</option>
                      <option value="senior">10+ years</option>
                    </select>
                  </div>
                </div>

                {/* Loading state */}
                {loadingDoctors ? (
                  <div className="flex h-48 items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-cyan-500" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDoctors.map(doc => {
                      const meta = getDoctorMeta(doc);
                      
                      return (
                        <div key={doc.id} className="depth-card bg-slate-900/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between hover:border-cyan-500/20 transition-all duration-300 relative group">
                          <div>
                            {/* Doctor Avatar Details */}
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shrink-0 font-black text-cyan-400">
                                {doc.full_name?.split(' ').map(n => n[0]).join('') || <Stethoscope className="w-6 h-6" />}
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-extrabold text-sm text-white truncate">Dr. {doc.full_name}</h3>
                                <p className="text-xs text-cyan-400 font-semibold">{doc.specialty || 'General Practice'}</p>
                                
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <span className="flex items-center gap-0.5 text-xs text-amber-400"><Star className="w-3 h-3 fill-amber-400" /> {meta?.rating}</span>
                                  <span className="text-slate-500 text-[10px]">•</span>
                                  <span className="text-slate-400 text-[10px] font-semibold uppercase">{meta?.experience} Years Exp.</span>
                                </div>
                              </div>
                            </div>

                            {/* Details meta */}
                            <div className="space-y-2 mt-4 pt-4 border-t border-white/5 text-xs text-slate-400 font-semibold">
                              <div className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-slate-500" /> <span>{meta?.hospital}</span></div>
                              <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500" /> <span>{meta?.city}</span></div>
                              <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-slate-500" /> <span className="text-white font-bold">${meta?.fee} consultation fee</span></div>
                            </div>
                          </div>

                          <div className="mt-6">
                            <button
                              onClick={() => setSelectedDoctor(doc)}
                              className="w-full py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/30 text-white cursor-pointer transition-all flex items-center justify-center gap-1"
                            >
                              Book Consultation <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {filteredDoctors.length === 0 && (
                      <div className="col-span-3 depth-card bg-slate-900/30 border border-white/5 p-12 text-center text-slate-400">
                        <Stethoscope className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                        <p className="text-sm font-bold text-white">No doctors found</p>
                        <p className="text-xs text-slate-500 mt-1">Try resetting your filters or search keywords.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ========================================================
          MODAL A: BOOK APPOINTMENT FORM
          ======================================================== */}
      <AnimatePresence>
        {selectedDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setSelectedDoctor(null)} />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="depth-card bg-[#0b0f19] border border-white/10 rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-white text-base">Schedule Consultation</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">With Dr. {selectedDoctor.full_name}</p>
                </div>
                <button onClick={() => setSelectedDoctor(null)} className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              {/* Form body */}
              <form onSubmit={handleConfirmBooking} className="p-6 space-y-4">
                
                {/* 1. Type selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Consultation Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'Video', icon: Video, color: 'text-cyan-400 hover:bg-cyan-500/10' },
                      { type: 'Audio', icon: Phone, color: 'text-purple-400 hover:bg-purple-500/10' },
                      { type: 'Chat', icon: MessageSquare, color: 'text-purple-400 hover:bg-purple-500/10' }
                    ].map(item => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setBookingType(item.type)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                          bookingType === item.type 
                            ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-sm' 
                            : 'border-white/5 bg-slate-900/40 text-slate-400 ' + item.color
                        }`}
                      >
                        {React.createElement(item.icon, { className: "w-4 h-4" })}
                        <span>{item.type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Date Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Choose Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* 3. Slot Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Available Slots</label>
                  <div className="grid grid-cols-2 gap-2">
                    {getDoctorMeta(selectedDoctor)?.slots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setBookingSlot(slot)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                          bookingSlot === slot
                            ? 'border-cyan-500 bg-cyan-500/10 text-white'
                            : 'border-white/5 bg-slate-900/40 text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Symptoms / Notes (Optional)</label>
                  <textarea
                    placeholder="Briefly describe what you would like to discuss..."
                    value={bookingNotes}
                    onChange={e => setBookingNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 h-16 resize-none"
                  />
                </div>

                {/* Confirm */}
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setSelectedDoctor(null)} 
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-white/5 bg-slate-900/40 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Booking'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL B: RESCHEDULE FORM
          ======================================================== */}
      <AnimatePresence>
        {reschedulingApt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setReschedulingApt(null)} />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="depth-card bg-[#0b0f19] border border-white/10 rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-white text-base">Reschedule Booking</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Adjust date or timing</p>
                </div>
                <button onClick={() => setReschedulingApt(null)} className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleReschedule} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Choose New Date</label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={e => setRescheduleDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Choose Time Slot</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'].map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setRescheduleSlot(slot)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                          rescheduleSlot === slot
                            ? 'border-cyan-500 bg-cyan-500/10 text-white'
                            : 'border-white/5 bg-slate-900/40 text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setReschedulingApt(null)} 
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-white/5 bg-slate-900/40 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Reschedule'}
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
