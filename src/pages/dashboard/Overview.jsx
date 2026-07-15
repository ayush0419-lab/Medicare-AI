import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePatients } from '../../hooks/usePatients';
import { useAppointments } from '../../hooks/useAppointments';
import { Users, Calendar, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

// Skeleton shimmer — renders instantly, no layout shift
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />
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
  const { appointments, loading: aptLoading } = useAppointments();

  const isLoading = patientsLoading || aptLoading;

  const upcomingApt = isLoading ? [] : appointments.filter(a => a.status === 'scheduled').slice(0, 4);
  const highRisk    = isLoading ? [] : patients.filter(p => p.risk_level === 'High');

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header — always visible, never blocks */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h2 className="text-2xl heading-elite">Overview</h2>
          <p className="text-sm subheading-elite mt-1">
            Welcome back, {profile?.full_name || 'Doctor'}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/patients" className="btn-minimal-outline">View patients</Link>
          <Link to="/dashboard/appointments" className="btn-minimal">Add appointment</Link>
        </div>
      </div>

      {/* Grid */}
      <div className="depth-stage grid grid-cols-1 lg:grid-cols-3 gap-6">

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
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Total Patients</span>
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">{patients.length}</span>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+4%</span>
                </div>
              </div>

              <div className="depth-card holo-surface p-6 flex flex-col justify-between h-32">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">High Risk Cases</span>
                  <Activity className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">{highRisk.length}</span>
                  <span className="text-xs font-medium text-slate-500">Action required</span>
                </div>
              </div>

              <div className="depth-card holo-surface p-6 flex flex-col justify-between h-32">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Appointments Today</span>
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">
                    {upcomingApt.filter(a => new Date(a.scheduled_at).toDateString() === new Date().toDateString()).length}
                  </span>
                  <span className="text-xs font-medium text-slate-500">Scheduled</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Patient Activity Chart */}
        <div className="depth-card stripe-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">Patient Activity</h3>
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
                className="w-full bg-slate-100 rounded-t-sm hover:bg-indigo-100 transition-colors relative group"
                style={{ height: `${height}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {height * 2}
                </div>
              </div>
            ))}
            <div className="absolute bottom-0 inset-x-0 border-b border-slate-200" />
          </div>
          <div className="flex justify-between mt-3 text-xs font-medium text-slate-400">
            <span>Jan 1</span><span>Jan 15</span><span>Jan 30</span>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="depth-card stripe-card flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">Upcoming</h3>
            <Link to="/dashboard/appointments" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
              View all
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between items-center p-2">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-2 w-20" />
                    </div>
                    <div className="space-y-2 flex flex-col items-end">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingApt.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500 font-medium">No upcoming appointments.</p>
              </div>
            ) : (
              upcomingApt.map(apt => (
                <div key={apt.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{apt.patient?.full_name || 'Patient'}</p>
                    <p className="text-xs text-slate-500">{apt.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-slate-500">
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
  );
};
