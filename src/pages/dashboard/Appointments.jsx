import React, { useState } from 'react';
import { useAppointments } from '../../hooks/useAppointments';
import { usePatients } from '../../hooks/usePatients';
import { 
  Calendar as CalendarIcon, Clock, Video, Loader2, Plus, 
  MapPin, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Appointments = () => {
  const { appointments, loading, scheduleAppointment, updateStatus } = useAppointments();
  const { patients } = usePatients();
  
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isScheduling, setIsScheduling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newApt, setNewApt] = useState({ patient_id: '', scheduled_at: '', type: 'in-person' });

  const handleSchedule = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await scheduleAppointment(newApt);
      toast.success('Appointment scheduled');
      setIsScheduling(false);
      setNewApt({ patient_id: '', scheduled_at: '', type: 'in-person' });
    } catch {
      toast.error('Failed to schedule appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateStatus(id, status);
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const upcoming = appointments.filter(a => a.status === 'scheduled');
  const past = appointments.filter(a => a.status !== 'scheduled');

  const displayList = activeTab === 'upcoming' ? upcoming : past;

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* Minimal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 mb-8">
        <div>
          <h2 className="text-2xl heading-elite">Schedule</h2>
          <p className="text-sm subheading-elite mt-1">Manage your upcoming consultations.</p>
        </div>
        
        <button onClick={() => setIsScheduling(true)} className="btn-minimal">
          <Plus className="h-4 w-4" /> Book Appointment
        </button>
      </div>

      <div className="depth-stage grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Schedule List */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          {/* Simple Tab Switcher */}
          <div className="flex gap-4 border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('upcoming')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'upcoming' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Upcoming ({upcoming.length})
            </button>
            <button 
              onClick={() => setActiveTab('past')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'past' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Past ({past.length})
            </button>
          </div>

          <div className="depth-card stripe-card divide-y divide-slate-100">
            {displayList.map(apt => {
              const date = new Date(apt.scheduled_at);
              const isVideo = apt.type === 'virtual' || apt.type === 'Telemedicine';
              const typeLabel = isVideo ? 'Virtual' : 'In-person';
              
              return (
                <div key={apt.id} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors group">
                  
                  {/* Clean Date Block */}
                  <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-semibold uppercase text-slate-500">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-lg font-bold text-slate-900 leading-none mt-0.5">{date.getDate()}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-slate-900 truncate pr-4">{apt.patient?.full_name || 'Unknown Patient'}</h4>
                      {activeTab === 'upcoming' && (
                        <button 
                          onClick={() => handleStatusChange(apt.id, 'completed')}
                          className="opacity-0 group-hover:opacity-100 text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-opacity bg-white border border-slate-200 px-2 py-1 rounded"
                        >
                          <Check className="w-3 h-3" /> Mark Done
                        </button>
                      )}
                      {activeTab === 'past' && (
                        <span className="text-xs font-medium text-slate-500 capitalize">{apt.status}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="flex items-center gap-1.5">
                        {isVideo ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />} 
                        {typeLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {displayList.length === 0 && (
              <div className="p-12 text-center">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-900">No appointments</p>
                <p className="text-sm text-slate-500 mt-1">There are no {activeTab} appointments.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Clean Mini Stats */}
        <div className="col-span-1 space-y-6">
          <div className="depth-card holo-surface p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-sm text-slate-500">Today</span>
                <span className="text-sm font-semibold text-slate-900">
                  {upcoming.filter(a => new Date(a.scheduled_at).toDateString() === new Date().toDateString()).length}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-sm text-slate-500">This Week</span>
                <span className="text-sm font-semibold text-slate-900">{upcoming.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Total Completed</span>
                <span className="text-sm font-semibold text-slate-900">{past.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Schedule Modal */}
      {isScheduling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsScheduling(false)}></div>
          <div className="depth-card bg-white shadow-xl border border-slate-200 w-full max-w-md relative z-10 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-semibold text-slate-900">Book Appointment</h3>
            </div>
            
            <form onSubmit={handleSchedule} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Patient</label>
                <select 
                  required
                  value={newApt.patient_id}
                  onChange={(e) => setNewApt({...newApt, patient_id: e.target.value})}
                  className="input-elite appearance-none"
                >
                  <option value="">Select patient...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Date & Time</label>
                <input 
                  type="datetime-local" 
                  required
                  value={newApt.scheduled_at}
                  onChange={(e) => setNewApt({...newApt, scheduled_at: e.target.value})}
                  className="input-elite"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setNewApt({...newApt, type: 'in-person'})}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
                      newApt.type === 'in-person' ? 'border-slate-900 bg-slate-50 text-slate-900' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <MapPin className="w-4 h-4" /> In-person
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewApt({...newApt, type: 'virtual'})}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
                      newApt.type === 'virtual' ? 'border-slate-900 bg-slate-50 text-slate-900' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Video className="w-4 h-4" /> Telemedicine
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsScheduling(false)} className="flex-1 btn-minimal-outline">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 btn-minimal">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
