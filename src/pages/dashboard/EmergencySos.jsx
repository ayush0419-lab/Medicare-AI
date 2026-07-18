import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, ShieldAlert, MapPin, Users, Plus, Trash2, Heart, 
  Info, Activity, Bell, Navigation, Save, Edit3, X, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export const EmergencySos = () => {
  const { profile } = useAuth();
  // SOS activation states
  const [sosActive, setSosActive] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.0060);

  // Medical Information state (persisted)
  const [medicalInfo, setMedicalInfo] = useState({
    bloodGroup: 'O Positive',
    allergies: 'Penicillin, Peanuts',
    conditions: 'Asthma, Mild Hypertension'
  });
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [tempInfo, setTempInfo] = useState({ ...medicalInfo });

  // Emergency Contacts state (persisted)
  const [contacts, setContacts] = useState([
    { id: 1, name: 'Sarah Connor', relationship: 'Spouse', phone: '+1 (555) 019-2834' },
    { id: 2, name: 'John Connor', relationship: 'Son', phone: '+1 (555) 019-9831' }
  ]);

  // Contact form state
  const [newContact, setNewContact] = useState({ name: '', relationship: '', phone: '' });
  const [showAddContact, setShowAddContact] = useState(false);

  // Load persisted states
  useEffect(() => {
    const savedInfo = localStorage.getItem('medicare_sos_info');
    if (savedInfo) {
      const parsed = JSON.parse(savedInfo);
      setMedicalInfo(parsed);
      setTempInfo(parsed);
    }

    const savedContacts = localStorage.getItem('medicare_sos_contacts');
    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    }
  }, []);

  // Location tracking simulator
  useEffect(() => {
    let interval;
    if (sosActive) {
      interval = setInterval(() => {
        // Slightly jitter the coordinates to simulate real GPS tracking
        setLatitude(prev => prev + (Math.random() - 0.5) * 0.0002);
        setLongitude(prev => prev + (Math.random() - 0.5) * 0.0002);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [sosActive]);

  // Save Medical Info
  const handleSaveInfo = (e) => {
    e.preventDefault();
    setMedicalInfo(tempInfo);
    localStorage.setItem('medicare_sos_info', JSON.stringify(tempInfo));
    setIsEditingInfo(false);
    toast.success("Emergency medical details updated!");
  };

  // Add Contact
  const handleAddContact = (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone || !newContact.relationship) {
      toast.error("Please fill all contact fields.");
      return;
    }

    const updated = [
      ...contacts,
      { id: Date.now(), ...newContact }
    ];
    setContacts(updated);
    localStorage.setItem('medicare_sos_contacts', JSON.stringify(updated));
    setNewContact({ name: '', relationship: '', phone: '' });
    setShowAddContact(false);
    toast.success("Emergency contact added successfully!");
  };

  // Delete Contact
  const handleDeleteContact = (id) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    localStorage.setItem('medicare_sos_contacts', JSON.stringify(updated));
    toast.success("Emergency contact removed.");
  };

  // Trigger SOS alert
  const handleTriggerSos = () => {
    setShowConfirm(false);
    setSosActive(true);
    toast.error("SOS Alert Dispatched!", {
      duration: 5000,
      icon: '🚨'
    });

    // Simulate sending SMS alerts
    contacts.forEach(c => {
      console.log(`Sending emergency SMS to ${c.name} (${c.phone})...`);
    });
  };

  return (
    <div className={`min-h-screen text-slate-100 p-6 md:p-8 rounded-3xl border relative overflow-hidden font-sans shadow-2xl transition-all duration-500 ${
      sosActive ? 'bg-[#1a0505] border-rose-500/30' : 'bg-[#070b19] border-white/5'
    }`}>
      {/* Visual cyber backgrounds */}
      {sosActive ? (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.15)_0%,transparent_70%)] pointer-events-none animate-pulse" />
      ) : (
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f2fe02_1px,transparent_1px),linear-gradient(to_bottom,#00f2fe02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="border-b border-white/10 pb-6 mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`border px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1 shadow-md ${
                sosActive 
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse' 
                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
              }`}>
                <ShieldAlert className="w-3.5 h-3.5" /> Emergency SOS Center
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Emergency Assistance</h1>
            <p className="text-slate-400 text-sm mt-1">One-tap alerts to notify emergency contacts and request hospital dispatch services.</p>
          </div>

          {sosActive && (
            <button
              onClick={() => setSosActive(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-white/10 cursor-pointer transition"
            >
              Cancel SOS Alert
            </button>
          )}
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (SOS Button & Actions - 40%) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* SOS Glass Card */}
            <div className={`depth-card border rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors ${
              sosActive ? 'bg-rose-950/20 border-rose-500/40' : 'bg-slate-900/40 border-white/10'
            }`}>
              
              {/* Outer pulse effect */}
              <div className="relative w-44 h-44 flex items-center justify-center mb-6">
                <AnimatePresence>
                  {sosActive ? (
                    <motion.div 
                      key="pulse-sos"
                      className="absolute inset-0 rounded-full bg-rose-500/20 pointer-events-none"
                      initial={{ scale: 0.9, opacity: 0.8 }}
                      animate={{ scale: 1.4, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                    />
                  ) : (
                    <div className="absolute inset-0 rounded-full bg-cyan-500/5 border border-cyan-500/10 animate-ping pointer-events-none" />
                  )}
                </AnimatePresence>

                {/* Main SOS button */}
                <button
                  onClick={() => sosActive ? setSosActive(false) : setShowConfirm(true)}
                  className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer relative z-10 ${
                    sosActive 
                      ? 'bg-rose-600 border-rose-400 text-white shadow-rose-600/40' 
                      : 'bg-gradient-to-br from-rose-700 to-rose-900 border-rose-500/40 text-rose-100 hover:border-rose-400 shadow-rose-900/50 hover:shadow-rose-500/20'
                  }`}
                >
                  <span className="text-3xl font-black tracking-widest font-mono">SOS</span>
                  <span className="text-[9px] uppercase tracking-widest font-bold mt-1 text-rose-200">
                    {sosActive ? 'Active' : 'Press to Alert'}
                  </span>
                </button>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">
                {sosActive ? 'Emergency Dispatch Active' : 'One-Tap Trigger'}
              </h3>
              <p className="text-slate-400 text-xs max-w-xs font-semibold leading-relaxed">
                {sosActive 
                  ? 'All contacts have been notified. Dispatch coordinates are active.' 
                  : 'Triggers location alerts to saved contacts and opens ambulance communication paths.'
                }
              </p>
            </div>

            {/* Active SOS Panel */}
            <AnimatePresence>
              {sosActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="depth-card bg-rose-950/15 border border-rose-500/30 rounded-2xl p-6 space-y-4 shadow-xl"
                >
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-500 animate-pulse" /> Live Tracking Status
                  </h4>
                  
                  {/* Mock GPS coordinate display */}
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Live Latitude:</span>
                      <span className="text-white font-bold">{latitude.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Live Longitude:</span>
                      <span className="text-white font-bold">{longitude.toFixed(6)}</span>
                    </div>
                     <div className="flex justify-between pt-2 border-t border-white/5 text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                      <span>Live Coordinate Share:</span>
                      <span className="animate-pulse">Active</span>
                    </div>
                  </div>

                  {/* SMS Alert Dispatch Logs */}
                  <div className="space-y-2 text-left">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">SMS Dispatch Logs</span>
                    <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5 space-y-3">
                      {contacts.map(c => (
                        <div key={c.id} className="text-[10px] font-semibold space-y-1">
                          <div className="flex justify-between items-center text-slate-400">
                            <span>To: <strong className="text-white">{c.name}</strong> ({c.phone})</span>
                            <span className="text-emerald-400 text-[9px] uppercase font-black tracking-widest flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Sent
                            </span>
                          </div>
                          <p className="text-slate-500 font-mono leading-relaxed bg-white/5 p-2 rounded border border-white/5 select-all">
                            "EMERGENCY: {profile?.full_name || 'Ayush Verma'} triggered SOS. Live Location: https://maps.google.com/?q={latitude.toFixed(6)},{longitude.toFixed(6)}"
                          </p>
                        </div>
                      ))}
                      {contacts.length === 0 && (
                        <p className="text-[10px] text-rose-400 font-bold italic">No emergency contacts saved! Please add contacts in the right panel.</p>
                      )}
                    </div>
                  </div>

                  {/* Immediate options */}
                  <div className="space-y-2">
                    <button 
                      onClick={() => toast.success("Simulating Ambulance dispatch link...")}
                      className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-md transition"
                    >
                      <Phone className="w-4 h-4 animate-bounce" /> Call Ambulance (911)
                    </button>
                    <button 
                      onClick={() => toast.success("Live coordinates re-sent to contacts!")}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white border border-white/5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition"
                    >
                      <Navigation className="w-4 h-4 text-purple-400 animate-pulse" /> Resend Coordinates
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Right Column (Medical details & contacts manager - 60%) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Medical Info Card */}
            <div className="depth-card bg-slate-900/40 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500" /> Patient Medical File
                </h4>
                
                {!isEditingInfo ? (
                  <button 
                    onClick={() => { setTempInfo({ ...medicalInfo }); setIsEditingInfo(true); }}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit details
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditingInfo(false)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {!isEditingInfo ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Blood Group', val: medicalInfo.bloodGroup, color: 'text-rose-400 bg-rose-500/5 border-rose-500/10' },
                    { label: 'Allergies', val: medicalInfo.allergies || 'None', color: 'text-amber-400 bg-amber-500/5 border-amber-500/10' },
                    { label: 'Medical Conditions', val: medicalInfo.conditions || 'None', color: 'text-purple-400 bg-purple-500/5 border-purple-500/10' }
                  ].map((field, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${field.color} flex flex-col justify-between`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">{field.label}</span>
                      <span className="text-sm font-bold text-white">{field.val}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleSaveInfo} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Blood Group</label>
                      <input 
                        type="text" 
                        value={tempInfo.bloodGroup} 
                        onChange={e => setTempInfo({ ...tempInfo, bloodGroup: e.target.value })} 
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Allergies</label>
                      <input 
                        type="text" 
                        value={tempInfo.allergies} 
                        onChange={e => setTempInfo({ ...tempInfo, allergies: e.target.value })} 
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Conditions</label>
                      <input 
                        type="text" 
                        value={tempInfo.conditions} 
                        onChange={e => setTempInfo({ ...tempInfo, conditions: e.target.value })} 
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
                      <Save className="w-3.5 h-3.5" /> Save details
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Emergency Contacts Manager */}
            <div className="depth-card bg-slate-900/40 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-400" /> Emergency Contacts ({contacts.length})
                </h4>
                <button
                  onClick={() => setShowAddContact(!showAddContact)}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Contact
                </button>
              </div>

              {/* Add contact dialog */}
              <AnimatePresence>
                {showAddContact && (
                  <motion.form 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleAddContact}
                    className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input 
                        type="text" 
                        placeholder="Full Name" 
                        required
                        value={newContact.name}
                        onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                        className="bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-400 font-semibold"
                      />
                      <input 
                        type="text" 
                        placeholder="Relationship (e.g. Spouse)" 
                        required
                        value={newContact.relationship}
                        onChange={e => setNewContact({ ...newContact, relationship: e.target.value })}
                        className="bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-400 font-semibold"
                      />
                      <input 
                        type="text" 
                        placeholder="Phone Number" 
                        required
                        value={newContact.phone}
                        onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                        className="bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-400 font-semibold"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button 
                        type="button" 
                        onClick={() => setShowAddContact(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/5 bg-slate-900/40 text-slate-500 hover:text-slate-400 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* List of contacts */}
              <div className="divide-y divide-white/5">
                {contacts.map(c => (
                  <div key={c.id} className="py-3 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-slate-400">
                        {c.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-white block">{c.name}</span>
                        <span className="text-[10px] text-purple-400 font-bold uppercase">{c.relationship}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-slate-400">{c.phone}</span>
                      <button 
                        onClick={() => handleDeleteContact(c.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-500 cursor-pointer transition opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {contacts.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    <Users className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-semibold">No contacts registered</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Global Disclaimer */}
        <div className="mt-12 pt-6 border-t border-white/10 text-center max-w-4xl mx-auto">
          <p className="text-[10px] text-slate-500 leading-relaxed font-bold tracking-wide">
            AI Emergency SOS system provides informational guidance and simulated alerting protocols only. It should not be used as the sole tool in a lifethreatening incident. Always dial local emergency dispatch services directly in a critical situation.
          </p>
        </div>

      </div>

      {/* SOS CONFIRMATION DIALOG */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md" onClick={() => setShowConfirm(false)} />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="depth-card bg-[#0e0a0a] border border-rose-500/20 rounded-2xl w-full max-w-sm relative z-10 p-6 text-center space-y-6 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
                <Bell className="w-6 h-6 animate-bounce" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-white">Confirm SOS Dispatch</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                  This will transmit emergency distress alerts with your live location coordinates to all registered contacts.
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirm(false)} 
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-white/5 bg-slate-900/40 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleTriggerSos} 
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-50 text-white shadow-lg shadow-rose-600/20 cursor-pointer"
                >
                  Confirm & Alert
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
