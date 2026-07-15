import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  Search, Stethoscope, X, Star, Phone, Mail,
  Calendar, Users, Award, ChevronRight, Loader2,
  ShieldCheck, Clock, TrendingUp, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

const SPECIALTIES = [
  'All', 'Cardiology', 'Neurology', 'Orthopedics', 'Oncology',
  'Pediatrics', 'Dermatology', 'Psychiatry', 'Radiology', 'General Practice'
];

const AVATAR_COLORS = [
  'from-violet-500 to-indigo-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-fuchsia-500 to-purple-600',
];

const getAvatarColor = (name = '') => {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

const getInitials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

const STAT_MOCK = (id) => ({
  patients: 40 + ((id?.charCodeAt(0) || 7) % 60),
  rating: (4.2 + ((id?.charCodeAt(1) || 3) % 8) / 10).toFixed(1),
  years: 3 + ((id?.charCodeAt(2) || 2) % 18),
});

export const Doctors = () => {
  const { profile } = useAuth();

  // All hooks must be declared before any early return (React rules of hooks)
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // 🔒 Admin-only page — block access for doctors and patients
  if (profile && profile.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-rose-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          Only <span className="font-semibold text-indigo-600">Administrators</span> can view the Doctors directory.
          Please contact your system admin if you need access.
        </p>
      </div>
    );
  }

  useEffect(() => {
    const fetchDoctors = async () => {
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
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

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
      toast.error(err.message || "Failed to remove doctor profile");
    }
  };

  const filtered = doctors.filter(d => {
    const matchSearch =
      d.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSpec =
      selectedSpecialty === 'All' || d.specialty === selectedSpecialty;
    return matchSearch && matchSpec;
  });

  return (
    <div className="p-6 space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-indigo-600" />
            Doctors
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {doctors.length} registered physician{doctors.length !== 1 ? 's' : ''} on the platform
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search doctors…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/80 backdrop-blur border border-slate-200 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
          />
        </div>
      </div>

      {/* Specialty filter chips */}
      <div className="flex flex-wrap gap-2">
        {SPECIALTIES.map(spec => (
          <button
            key={spec}
            onClick={() => setSelectedSpecialty(spec)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
              ${selectedSpecialty === spec
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-white/70 text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
          >
            {spec}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm">Loading doctors…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
          <Stethoscope className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-medium">No doctors found</p>
          <p className="text-xs">Try a different search or specialty filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(doctor => {
            const stats = STAT_MOCK(doctor.id);
            const initials = getInitials(doctor.full_name);
            const avatarColor = getAvatarColor(doctor.full_name);
            return (
              <button
                key={doctor.id}
                onClick={() => setSelectedDoctor(doctor)}
                className="depth-card group text-left bg-white/70 backdrop-blur-sm border border-slate-100
                           rounded-2xl p-5 flex flex-col gap-4 hover:border-indigo-200 transition-all duration-200"
              >
                {/* Avatar + name */}
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColor}
                                  flex items-center justify-center text-white font-bold text-base flex-shrink-0`}>
                    {initials || <Stethoscope className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm leading-tight truncate">
                      Dr. {doctor.full_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-indigo-600 font-medium mt-0.5 truncate">
                      {doctor.specialty || 'General Practice'}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs text-slate-500">{stats.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-indigo-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-indigo-400 font-medium uppercase tracking-wide">Patients</p>
                    <p className="text-base font-bold text-indigo-700">{stats.patients}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-emerald-500 font-medium uppercase tracking-wide">Exp.</p>
                    <p className="text-base font-bold text-emerald-700">{stats.years}y</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verified</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      {selectedDoctor && (
        <DoctorDrawer
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onDelete={handleDeleteDoctor}
        />
      )}
    </div>
  );
};

/* ─── Detail Drawer ─────────────────────────────────────────────────────── */
const DoctorDrawer = ({ doctor, onClose, onDelete }) => {
  const { profile } = useAuth();
  const stats = STAT_MOCK(doctor.id);
  const initials = getInitials(doctor.full_name);
  const avatarColor = getAvatarColor(doctor.full_name);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50
                      flex flex-col overflow-hidden animate-slide-in-right">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 text-base">Doctor Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Hero card */}
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-6 flex gap-4 items-center border border-indigo-100">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarColor}
                             flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg`}>
              {initials || <Stethoscope className="w-7 h-7" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Dr. {doctor.full_name || 'Unknown'}</h3>
              <p className="text-sm text-indigo-600 font-medium">{doctor.specialty || 'General Practice'}</p>
              <div className="flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">Verified Physician</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Users, label: 'Patients', value: stats.patients, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { icon: Star, label: 'Rating', value: stats.rating, color: 'text-amber-600', bg: 'bg-amber-50' },
              { icon: Award, label: 'Experience', value: `${stats.years}y`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                <p className="text-xs text-slate-500">{label}</p>
                <p className={`text-base font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Contact</p>
            <div className="bg-slate-50 rounded-xl divide-y divide-slate-100">
              {doctor.email && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700 truncate">{doctor.email}</span>
                </div>
              )}
              {doctor.phone ? (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">{doctor.phone}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 text-slate-400">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">Phone not provided</span>
                </div>
              )}
            </div>
          </div>

          {/* Highlights */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Highlights</p>
            <div className="space-y-2">
              {[
                { icon: TrendingUp, text: `${stats.patients} active patients managed`, color: 'text-indigo-500 bg-indigo-50' },
                { icon: Clock, text: `${stats.years} years of clinical experience`, color: 'text-emerald-500 bg-emerald-50' },
                { icon: Calendar, text: 'Available for appointments', color: 'text-violet-500 bg-violet-50' },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                  <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm text-slate-700">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Organization */}
          {doctor.organization && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Organization</p>
              <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700">
                {doctor.organization}
              </div>
            </div>
          )}

          {/* Admin Actions */}
          {profile && profile.role === 'admin' && (
            <div className="pt-6 border-t border-slate-100">
              <button
                onClick={() => onDelete(doctor.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-200 
                           hover:bg-red-55 hover:text-red-700 text-red-600 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Remove Doctor Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
