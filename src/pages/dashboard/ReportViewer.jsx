import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Search, Calendar, User, Eye, Download, Sparkles, 
  ChevronRight, ZoomIn, ZoomOut, AlertCircle, CheckCircle, RefreshCw, 
  Save, FileSignature, HelpCircle, Activity, Brain, X, Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-250 dark:bg-slate-800 rounded-lg ${className}`} />
);

export const ReportViewer = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);

  // Selected Report for Interactive Review
  const [selectedReport, setSelectedReport] = useState(null);
  const [signedUrl, setSignedUrl] = useState('');
  const [signedUrlLoading, setSignedUrlLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100); // 100% | 150% | 200%

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Notes state
  const [doctorNotes, setDoctorNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Fetch Patients and their medical reports
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch patients assigned to this doctor
      const { data: myPatients, error: pErr } = await supabase
        .from('patients')
        .select('profile_id, full_name:profile_id(full_name)')
        .eq('assigned_doctor_id', user.id);

      if (pErr) throw pErr;
      setPatients(myPatients || []);

      const patientProfileIds = myPatients?.map(p => p.profile_id) || [];

      if (patientProfileIds.length === 0) {
        setReports([]);
        setLoading(false);
        return;
      }

      // 2. Fetch reports for these patients
      const { data: reportsData, error: rErr } = await supabase
        .from('report_analyses')
        .select(`
          *,
          patient:patient_id (
            full_name,
            avatar_url
          )
        `)
        .in('patient_id', patientProfileIds)
        .order('created_at', { ascending: false });

      if (rErr) throw rErr;
      setReports(reportsData || []);
    } catch (err) {
      console.error('Error fetching clinical reports:', err);
      toast.error('Failed to load patient reports');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load Signed URL for selected report preview
  const handleSelectReport = async (report) => {
    setSelectedReport(report);
    setDoctorNotes(report.doctor_notes || '');
    setZoomLevel(100);

    if (!report.file_url) {
      setSignedUrl('');
      return;
    }

    setSignedUrlLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(report.file_url, 3600); // 1 hour expiry

      if (error) throw error;
      setSignedUrl(data.signedUrl);
    } catch (err) {
      console.error('Signed URL error:', err);
      toast.error('Could not load secure report preview');
      setSignedUrl('');
    } finally {
      setSignedUrlLoading(false);
    }
  };

  // Run or Rerun AI Analysis using ChatGPT Deno Function
  const handleTriggerAnalysis = async () => {
    if (!selectedReport) return;
    setAnalyzing(true);
    const toastId = toast.loading('Running 90% accuracy clinical AI diagnostic...');

    try {
      // Get Deno backend response
      const { data, error } = await supabase.functions.invoke('analyze-report', {
        body: {
          textContent: selectedReport.original_text || '',
          reportType: selectedReport.report_type,
          fileUrl: selectedReport.file_url
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const aiData = data.result;

      // Update database row
      const { error: dbErr } = await supabase
        .from('report_analyses')
        .update({
          ai_summary: aiData.summary?.join('\n') || '',
          ai_findings: aiData.findings || [],
          ai_risk_level: aiData.risk_level || 'low',
          ai_recommendations: aiData.recommendations || '',
          status: 'completed'
        })
        .eq('id', selectedReport.id);

      if (dbErr) throw dbErr;

      // Refresh list and local state
      toast.success('Clinical AI report analysis completed!', { id: toastId });
      
      const refreshedReport = {
        ...selectedReport,
        ai_summary: aiData.summary?.join('\n') || '',
        ai_findings: aiData.findings || [],
        ai_risk_level: aiData.risk_level || 'low',
        ai_recommendations: aiData.recommendations || '',
        status: 'completed'
      };
      
      setSelectedReport(refreshedReport);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('AI Analysis failed: ' + (err.message || ''), { id: toastId });
    } finally {
      setAnalyzing(false);
    }
  };

  // Save doctor clinical notes
  const handleSaveNotes = async () => {
    if (!selectedReport) return;
    setSavingNotes(true);
    const toastId = toast.loading('Saving clinical notes...');

    try {
      const { error } = await supabase
        .from('report_analyses')
        .update({
          doctor_notes: doctorNotes,
          status: 'reviewed',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedReport.id);

      if (error) throw error;

      // Push notification to patient
      await supabase
        .from('notifications')
        .insert([{
          user_id: selectedReport.patient_id,
          title: "Report Reviewed by Doctor",
          message: `Dr. ${user.user_metadata?.full_name || 'your clinician'} has reviewed your ${selectedReport.report_type.replace('_', ' ')} report and left consultation notes.`,
          type: "info"
        }]);

      toast.success('Clinical notes and review complete!', { id: toastId });
      setSelectedReport(prev => ({ ...prev, doctor_notes: doctorNotes, status: 'reviewed' }));
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  // Download raw document file
  const handleDownloadFile = async () => {
    if (!selectedReport?.file_url) return;
    const toastId = toast.loading('Downloading document file...');
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(selectedReport.file_url);

      if (error) throw error;

      const blob = new Blob([data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = selectedReport.file_name || 'Medical_Report.pdf';
      link.click();
      toast.success('Download complete!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to download document file.', { id: toastId });
    }
  };

  // Risk badge color helper
  const getRiskBadge = (risk) => {
    const r = risk?.toLowerCase() || '';
    if (r === 'critical' || r === 'high') {
      return 'bg-rose-500/10 border-rose-500/25 text-rose-450';
    }
    if (r === 'moderate') {
      return 'bg-amber-500/10 border-amber-500/25 text-amber-450';
    }
    return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
  };

  // Filter list results
  const filteredReports = reports.filter(r => {
    const patientName = r.patient?.full_name?.toLowerCase() || '';
    const fileName = r.file_name?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    const matchesSearch = patientName.includes(query) || fileName.includes(query);
    const matchesType = typeFilter === 'All' || r.report_type === typeFilter;
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 p-6 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden font-sans shadow-2xl">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f2fe05_1px,transparent_1px),linear-gradient(to_bottom,#00f2fe05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Block */}
        <div className="border-b border-white/10 pb-6 mb-8 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1 shadow-md">
                <Brain className="w-3.5 h-3.5" /> Medical Diagnostics Hub
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
              Medical Reports Viewer
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Review diagnostic documents, clinical lab sheets, blood tests, and scans uploaded by patients assigned to you.
            </p>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT LIST COLUMN (35%) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Search & Filters */}
            <div className="depth-card bg-slate-900/40 border border-white/10 p-5 rounded-2xl space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by patient or file name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold"
                  >
                    <option value="All">All Types</option>
                    <option value="blood_test">Blood Test</option>
                    <option value="xray">X-Ray</option>
                    <option value="mri">MRI Scan</option>
                    <option value="ct_scan">CT Scan</option>
                    <option value="ecg">ECG</option>
                    <option value="ultrasound">Ultrasound</option>
                    <option value="pathology">Pathology</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold"
                  >
                    <option value="All">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Analyzed</option>
                    <option value="reviewed">Reviewed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reports List */}
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="depth-card bg-slate-900/20 border border-white/5 p-4 rounded-xl space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                ))
              ) : filteredReports.length === 0 ? (
                <div className="depth-card bg-slate-900/30 border border-white/5 rounded-2xl p-12 text-center text-slate-400">
                  <FileText className="w-8 h-8 text-slate-650 mx-auto mb-3" />
                  <p className="text-xs font-bold text-white">No reports found</p>
                </div>
              ) : (
                filteredReports.map(report => (
                  <div
                    key={report.id}
                    onClick={() => handleSelectReport(report)}
                    className={`depth-card border p-4 rounded-xl cursor-pointer transition-all duration-250 flex items-start justify-between gap-4 ${
                      selectedReport?.id === report.id
                        ? 'bg-indigo-600/10 border-indigo-500/50 shadow-md'
                        : 'bg-slate-900/40 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                      <h4 className="font-bold text-xs text-white mt-1 truncate">{report.patient?.full_name || 'Patient'}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 truncate capitalize font-medium">
                        {report.report_type.replace('_', ' ')}: {report.file_name}
                      </p>
                    </div>

                    <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0 border ${
                      report.status === 'reviewed'
                        ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400'
                        : report.status === 'completed'
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-450'
                        : 'bg-amber-500/10 border-amber-500/25 text-amber-450'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* RIGHT REVIEW WINDOW (65%) */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {!selectedReport ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="depth-card bg-slate-900/20 border border-white/5 rounded-3xl p-24 text-center text-slate-500 flex flex-col items-center gap-4 min-h-[500px] justify-center"
                >
                  <Eye className="w-12 h-12 text-slate-650 animate-pulse" />
                  <div>
                    <h3 className="text-base font-bold text-white">Select a Patient Report</h3>
                    <p className="text-xs text-slate-400 mt-1 font-semibold">Choose any medical report from the list to review inline content and AI summaries.</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={selectedReport.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Info Header */}
                  <div className="depth-card bg-slate-900/40 border border-white/10 p-5 rounded-2xl flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Patient Report Details</span>
                      <h3 className="text-base font-extrabold text-white mt-0.5">{selectedReport.patient?.full_name}</h3>
                      <p className="text-xs text-slate-400 mt-1 capitalize font-semibold">
                        Type: <span className="text-indigo-400">{selectedReport.report_type.replace('_', ' ')}</span> &bull; File: {selectedReport.file_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-1 rounded text-xs font-black uppercase border ${getRiskBadge(selectedReport.ai_risk_level)}`}>
                        Risk: {selectedReport.ai_risk_level || 'low'}
                      </span>
                      <button
                        onClick={handleDownloadFile}
                        className="p-2 bg-slate-950 hover:bg-slate-900 border border-white/10 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
                        title="Download Original"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Document Preview Box */}
                  <div className="depth-card bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden relative flex flex-col justify-between min-h-[400px]">
                    <div className="bg-slate-950/60 p-3.5 border-b border-white/5 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Eye className="w-4 h-4 text-cyan-400" /> Secure Clinical Document Preview</span>
                      
                      {/* Zoom controls for Image scans */}
                      {!selectedReport.file_name?.toLowerCase().endsWith('.pdf') && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => setZoomLevel(prev => Math.max(100, prev - 25))} className="p-1 hover:bg-white/5 rounded text-slate-450 hover:text-white cursor-pointer"><ZoomOut className="w-4 h-4" /></button>
                          <span className="text-[10px] font-mono font-bold text-slate-400">{zoomLevel}%</span>
                          <button onClick={() => setZoomLevel(prev => Math.min(200, prev + 25))} className="p-1 hover:bg-white/5 rounded text-slate-450 hover:text-white cursor-pointer"><ZoomIn className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>

                    {/* Viewer Container */}
                    <div className="flex-1 bg-slate-950 p-6 flex items-center justify-center min-h-[350px] relative overflow-auto">
                      {signedUrlLoading ? (
                        <div className="flex flex-col items-center gap-2.5 text-slate-400 text-xs">
                          <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                          <span>Generating signed secure document link...</span>
                        </div>
                      ) : !signedUrl ? (
                        <div className="text-center text-slate-500 text-xs space-y-2">
                          <Info className="w-8 h-8 mx-auto text-slate-650" />
                          <p>No document preview available.</p>
                          <p className="text-[10px] text-slate-600">Please download the file using the toolbar button.</p>
                        </div>
                      ) : selectedReport.file_name?.toLowerCase().endsWith('.pdf') ? (
                        <iframe 
                          src={`${signedUrl}#toolbar=0&navpanes=0`} 
                          className="w-full h-[450px] border-none rounded-lg"
                          title="PDF Preview"
                        />
                      ) : (
                        <div className="overflow-auto max-h-[450px]">
                          <img
                            src={signedUrl}
                            alt="Scan Preview"
                            className="rounded-lg shadow-md transition-transform duration-200 object-contain max-w-full"
                            style={{ transform: `scale(${zoomLevel / 100})` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Diagnostics Analyzer block (ChatGPT output) */}
                  <div className="depth-card bg-slate-900/40 border border-white/10 p-6 rounded-2xl space-y-5">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Diagnostics summary</span>
                        <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5 mt-0.5">
                          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" /> Clinical AI Analysis
                        </h4>
                      </div>

                      <button
                        onClick={handleTriggerAnalysis}
                        disabled={analyzing}
                        className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-650 text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-55"
                      >
                        {analyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        {selectedReport.ai_summary ? 'Rerun Diagnostics' : 'Run Diagnostics'}
                      </button>
                    </div>

                    {selectedReport.ai_summary ? (
                      <div className="space-y-4 text-xs font-semibold text-slate-300">
                        {/* Summary Bullets */}
                        <div className="space-y-2">
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Key Findings</p>
                          <ul className="list-disc pl-4 space-y-1.5 leading-relaxed text-slate-200">
                            {selectedReport.ai_summary.split('\n').map((bullet, idx) => (
                              <li key={idx}>{bullet.replace(/^[-\*\s]+/, '')}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Findings list table */}
                        {selectedReport.ai_findings?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Diagnostic Markers</p>
                            <div className="overflow-x-auto rounded-lg border border-white/10 bg-slate-950/40">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-white/15 text-slate-400 bg-white/5 text-[9px] uppercase font-bold">
                                    <th className="p-2.5">Marker Name</th>
                                    <th className="p-2.5">Observed Value</th>
                                    <th className="p-2.5">Reference Range</th>
                                    <th className="p-2.5">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedReport.ai_findings.map((f, idx) => (
                                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                      <td className="p-2.5 font-bold text-white">{f.name}</td>
                                      <td className="p-2.5 text-slate-350">{f.value}</td>
                                      <td className="p-2.5 text-slate-400 font-mono">{f.range}</td>
                                      <td className="p-2.5">
                                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                          f.status === 'Abnormal'
                                            ? 'bg-rose-500/10 text-rose-450 border border-rose-500/15'
                                            : f.status === 'Borderline'
                                            ? 'bg-amber-500/10 text-amber-450 border border-amber-500/15'
                                            : 'bg-emerald-500/10 text-emerald-450'
                                        }`}>
                                          {f.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* AI Recommendations */}
                        {selectedReport.ai_recommendations && (
                          <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10 space-y-1.5">
                            <p className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider">AI Clinical Recommendations</p>
                            <p className="leading-relaxed text-slate-300">{selectedReport.ai_recommendations}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-950/20 border border-dashed border-white/10 rounded-xl text-slate-500 text-xs">
                        <Sparkles className="w-6 h-6 mx-auto mb-2 text-slate-650" />
                        <p>No diagnostics summary loaded for this report yet.</p>
                        <p className="text-[10px] text-slate-600 mt-1">Click "Run Diagnostics" to perform a ChatGPT clinical evaluation.</p>
                      </div>
                    )}
                  </div>

                  {/* Doctor notes & recommendations */}
                  <div className="depth-card bg-slate-900/40 border border-white/10 p-6 rounded-2xl space-y-4">
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                      <FileSignature className="w-5 h-5 text-indigo-400" /> Consultation Notes & Recommendation
                    </h4>

                    <div className="text-xs font-semibold space-y-3">
                      <textarea
                        rows="4"
                        placeholder="Write clinical recommendations, patient advice, or diagnostic explanations here..."
                        value={doctorNotes}
                        onChange={(e) => setDoctorNotes(e.target.value)}
                        className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-3 text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition"
                      />

                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-indigo-500" /> Notes written here will sync with the patient dashboard.
                        </p>

                        <button
                          onClick={handleSaveNotes}
                          disabled={savingNotes}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-55"
                        >
                          {savingNotes ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Save & Review Report
                        </button>
                      </div>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  );
};
