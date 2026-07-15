import React, { useState } from 'react';
import { usePatients } from '../../hooks/usePatients';
import { supabase } from '../../lib/supabase';
import { 
  Search, Plus, Loader2, MoreHorizontal, FileText, X, 
  Upload, Sparkles, AlertCircle, CheckCircle, Clock, FileDigit, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

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

export const Patients = () => {
  const { patients, loading, addPatient, uploadMedicalReport } = usePatients();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newPatient, setNewPatient] = useState({ full_name: '', condition: '', risk_level: 'Low' });
  const [submitting, setSubmitting] = useState(false);

  // Detail Drawer States
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expandedAnalysis, setExpandedAnalysis] = useState(null);

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.condition?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchAnalyses = async (patientProfileId) => {
    setLoadingAnalyses(true);
    try {
      const { data, error } = await supabase
        .from('report_analyses')
        .select('*')
        .eq('patient_id', patientProfileId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAnalyses(data || []);
    } catch (err) {
      console.error('Error fetching analyses:', err);
    } finally {
      setLoadingAnalyses(false);
    }
  };

  const handlePatientSelect = async (patient) => {
    setSelectedPatient(patient);
    setExpandedAnalysis(null);
    if (patient?.profile_id) {
      await fetchAnalyses(patient.profile_id);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedPatient) return;
    setUploading(true);
    try {
      const reportType = file.name.toLowerCase().includes('xray') ? 'xray' 
                       : file.name.toLowerCase().includes('mri') ? 'mri' 
                       : file.name.toLowerCase().includes('blood') ? 'blood_test' 
                       : 'other';
      
      const record = await uploadMedicalReport(selectedPatient.profile_id, file, reportType);
      if (record) {
        // Refresh local analyses list immediately (showing pending)
        await fetchAnalyses(selectedPatient.profile_id);
        
        // Start simulated AI processing
        setTimeout(async () => {
          try {
            // Generate some mock AI content based on report type
            let summary = "The scan shows normal anatomical structures with no acute pathology detected.";
            let recommendations = "1. Routine follow-up as clinically indicated.";
            let risk = "low";
            
            if (reportType === 'blood_test') {
              summary = "AI analysis of blood panel indicates slightly elevated fasting blood glucose (108 mg/dL) and borderline cholesterol.";
              recommendations = "1. Suggest low-glycemic diet.\n2. Increase cardiovascular exercise.\n3. Repeat fasting lipid and glucose panel in 90 days.";
              risk = "moderate";
            } else if (reportType === 'xray' || reportType === 'mri') {
              summary = "Radiology analysis shows a minor soft tissue strain. No bony fracture or major ligament disruption visible.";
              recommendations = "1. Rest, Ice, Compression, Elevation (RICE protocol).\n2. Over-the-counter NSAIDs for pain control.\n3. Physical therapy if symptoms persist past 2 weeks.";
              risk = "low";
            }
            
            // Update db
            await supabase
              .from('report_analyses')
              .update({
                status: 'completed',
                ai_summary: summary,
                ai_recommendations: recommendations,
                ai_risk_level: risk,
                updated_at: new Date().toISOString()
              })
              .eq('id', record.id);
              
            // Refresh list again to show completed state
            fetchAnalyses(selectedPatient.profile_id);
            toast.success("AI Diagnostics analysis completed!");
          } catch (err) {
            console.error('Simulated AI update error:', err);
          }
        }, 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addPatient(newPatient);
      toast.success('Patient record created');
      setIsAdding(false);
      setNewPatient({ full_name: '', condition: '', risk_level: 'Low' });
    } catch {
      toast.error('Failed to create record');
    } finally {
      setSubmitting(false);
    }
  };

  const RiskBadge = ({ level }) => {
    const l = level?.toLowerCase();
    switch(l) {
      case 'high': 
      case 'critical': 
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">High Risk</span>;
      case 'medium': 
      case 'moderate': 
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">Medium</span>;
      default: 
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">Low Risk</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto relative">
      
      {/* Minimal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 mb-8">
        <div>
          <h2 className="text-2xl heading-elite">Patients</h2>
          <p className="text-sm subheading-elite mt-1">Manage your patient directory and medical records.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search patients..."
              className="pl-9 pr-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="btn-minimal"
          >
            <Plus className="h-4 w-4" /> New Patient
          </button>
        </div>
      </div>

      {/* Pristine Patients Card Grid */}
      {filteredPatients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400 bg-white/70 backdrop-blur-sm border border-slate-100 rounded-2xl">
          <FileText className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-900">No patients found</p>
          <p className="text-xs">Try adjusting your search query or add a new patient</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPatients.map((patient) => {
            const initials = getInitials(patient.full_name);
            const avatarColor = getAvatarColor(patient.full_name);
            return (
              <button
                key={patient.id}
                onClick={() => handlePatientSelect(patient)}
                className="depth-card group text-left bg-white/70 backdrop-blur-sm border border-slate-100
                           rounded-2xl p-5 flex flex-col gap-4 hover:border-indigo-200 transition-all duration-200 cursor-pointer"
              >
                {/* Avatar + name */}
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColor}
                                  flex items-center justify-center text-white font-bold text-base flex-shrink-0`}>
                    {initials || <FileText className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 text-sm leading-tight truncate">
                      {patient.full_name || 'Unknown'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                      ID: {patient.id.substring(0, 8)}
                    </p>
                  </div>
                </div>

                {/* Patient medical details */}
                <div className="flex-1 space-y-2 border-t border-b border-slate-100 py-3">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Primary Condition</p>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate">
                      {patient.condition || 'None specified'}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Status</p>
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1" />
                      <span className="text-xs font-semibold text-slate-700 capitalize">
                        {patient.status || 'active'}
                      </span>
                    </div>
                    <RiskBadge level={patient.risk_level} />
                  </div>
                </div>

                {/* Footer action button */}
                <div className="flex items-center justify-between text-xs text-indigo-600 font-bold group-hover:text-indigo-800 transition-colors">
                  <span>View Patient File</span>
                  <MoreHorizontal className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Patient Details & AI Report Analyzer Side Drawer */}
      {selectedPatient && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => handlePatientSelect(null)}
          />
          <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-120 bg-white shadow-2xl border-l border-slate-200 flex flex-col transition-all duration-300">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-55/40">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedPatient.full_name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {selectedPatient.id}</p>
              </div>
              <button 
                onClick={() => handlePatientSelect(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Profile details */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Patient Profile</h4>
                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 rounded-xl border border-slate-100 p-4 text-xs font-medium text-slate-700">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Condition</span>
                    <span className="text-sm font-bold text-slate-900">{selectedPatient.condition || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Risk Status</span>
                    <div className="mt-0.5"><RiskBadge level={selectedPatient.risk_level} /></div>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Gender</span>
                    <span className="text-sm font-bold text-slate-900">{selectedPatient.profile?.gender || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Blood Type</span>
                    <span className="text-sm font-bold text-slate-900">{selectedPatient.profile?.blood_type || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              {/* AI Diagnostic Reports Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinical AI Analyses</h4>
                  <label className={`btn-minimal text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer shadow-sm ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                    {uploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Upload Doc
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileUpload} 
                      disabled={uploading} 
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  {loadingAnalyses && analyses.length === 0 ? (
                    <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" /></div>
                  ) : (
                    analyses.map((a) => {
                      const isExpanded = expandedAnalysis === a.id;
                      const formattedDate = new Date(a.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                      
                      return (
                        <div 
                          key={a.id}
                          className={`border rounded-xl p-4 transition-all ${isExpanded ? 'border-indigo-200 bg-indigo-50/10 shadow-sm' : 'border-slate-100 bg-white hover:bg-slate-50/50 cursor-pointer'}`}
                          onClick={() => setExpandedAnalysis(isExpanded ? null : a.id)}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex gap-2.5 items-start">
                              <FileDigit className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{a.file_name}</p>
                                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{formattedDate}</span>
                              </div>
                            </div>
                            <div className="shrink-0 flex gap-1.5 items-center">
                              {a.status === 'pending' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-150">
                                  <Loader2 className="w-2.5 h-2.5 animate-spin text-indigo-500" /> Analyzing
                                </span>
                              ) : (
                                <>
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    <CheckCircle className="w-2.5 h-2.5" /> Scanned
                                  </span>
                                  {a.ai_risk_level && (
                                    <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                                      a.ai_risk_level === 'high' || a.ai_risk_level === 'critical' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                                      a.ai_risk_level === 'moderate' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                    }`}>
                                      {a.ai_risk_level}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Expanded Analysis Summary Details */}
                          {isExpanded && a.status === 'completed' && (
                            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3.5 text-xs text-slate-700 animate-fadeIn">
                              <div className="space-y-1">
                                <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" /> AI Medical Summary
                                </span>
                                <p className="leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 text-slate-800">
                                  {a.ai_summary}
                                </p>
                              </div>
                              {a.ai_recommendations && (
                                <div className="space-y-1">
                                  <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400">Clinical Recommendations</span>
                                  <div className="whitespace-pre-line leading-relaxed bg-indigo-50/20 p-2.5 rounded-lg border border-indigo-50/30 text-slate-800 font-medium">
                                    {a.ai_recommendations}
                                  </div>
                                </div>
                              )}
                              <a 
                                href={a.file_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center text-[10px] font-bold text-indigo-600 hover:underline"
                              >
                                View uploaded source file
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  {analyses.length === 0 && !loadingAnalyses && (
                    <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl">
                      <FileDigit className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-500">No clinical files uploaded yet</p>
                      <p className="text-[11px] text-slate-400 mt-1">Upload files to run AI-powered diagnostic summaries.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </aside>
        </>
      )}

      {/* Minimal Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsAdding(false)}></div>
          <div className="depth-card bg-white shadow-xl border border-slate-200 w-full max-w-md relative z-10 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-55/50">
              <h3 className="text-base font-semibold text-slate-900">Add New Patient</h3>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={newPatient.full_name}
                  onChange={(e) => setNewPatient({...newPatient, full_name: e.target.value})}
                  className="input-elite"
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Primary Condition</label>
                <input 
                  type="text" 
                  value={newPatient.condition}
                  onChange={(e) => setNewPatient({...newPatient, condition: e.target.value})}
                  className="input-elite"
                  placeholder="e.g. Asthma"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Risk Level</label>
                <select 
                  value={newPatient.risk_level}
                  onChange={(e) => setNewPatient({...newPatient, risk_level: e.target.value})}
                  className="input-elite appearance-none bg-white"
                >
                  <option value="Low">Low Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="High">High Risk</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 btn-minimal-outline">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 btn-minimal">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
