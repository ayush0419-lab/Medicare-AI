import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Brain, Heart, Shield, Activity, FileText, 
  Scan, Hospital, AlertCircle, CheckCircle, Download, 
  Share, Sparkles, ChevronRight, Stethoscope, FileDigit
} from 'lucide-react';
import toast from 'react-hot-toast';

const MOCK_REPORTS = {
  blood: {
    fileName: 'blood_test_results.pdf',
    fileSize: '1.8 MB',
    healthScore: 78,
    statusText: 'Mild Concern',
    confidence: 98,
    summary: [
      'Mild anemia detected due to slightly low hemoglobin levels.',
      'Fasting glucose is borderline elevated, suggesting mild glycemic changes.',
      'Liver and kidney functional values are well within healthy ranges.',
      'LDL cholesterol is slightly elevated, suggesting a heart-healthy diet.'
    ],
    tableData: [
      { name: 'Hemoglobin', value: '11.5 g/dL', range: '12.0 - 16.0', status: 'Abnormal' },
      { name: 'Glucose (Fasting)', value: '108 mg/dL', range: '70 - 99', status: 'Borderline' },
      { name: 'LDL Cholesterol', value: '132 mg/dL', range: '< 100', status: 'Borderline' },
      { name: 'Creatinine (Kidney)', value: '0.9 mg/dL', range: '0.6 - 1.2', status: 'Normal' },
      { name: 'ALT (Liver)', value: '24 U/L', range: '7 - 56', status: 'Normal' }
    ],
    explanations: [
      { key: 'Hemoglobin (11.5 g/dL)', desc: 'Hemoglobin is the oxygen-carrying protein in your red blood cells. A slightly low level suggests mild anemia, which may occasionally cause mild fatigue or tiredness.' },
      { key: 'Glucose (108 mg/dL)', desc: 'Your fasting blood sugar is slightly above the typical range. This is often an early indicator to watch carbohydrate intake and maintain regular exercise.' },
      { key: 'LDL Cholesterol (132 mg/dL)', desc: 'Often called "bad cholesterol," elevated LDL can build up in arterial walls over time. Moderate lifestyle adjustments can support normal cardiovascular levels.' }
    ],
    risks: ['Iron Deficiency Anemia', 'Prediabetes (Borderline Glycemia)', 'Mild Hyperlipidemia'],
    specialist: { name: 'General Physician', desc: 'Recommended for initial evaluation and dietary consultation.', icon: Stethoscope },
    tests: ['HbA1c Repeat', 'Serum Ferritin', 'Fasting Lipid Panel (90 days)']
  },
  thyroid: {
    fileName: 'thyroid_panel_scan.pdf',
    fileSize: '850 KB',
    healthScore: 65,
    statusText: 'Needs Attention',
    confidence: 96,
    summary: [
      'Elevated TSH levels detected, indicating mild underactive thyroid (hypothyroidism).',
      'Free T4 thyroid hormone is normal but at the lower end of the range.',
      'Thyroid antibodies are positive, suggesting mild thyroid inflammation.'
    ],
    tableData: [
      { name: 'TSH (Thyrotropin)', value: '6.2 uIU/mL', range: '0.4 - 4.5', status: 'Abnormal' },
      { name: 'Free T4', value: '0.9 ng/dL', range: '0.8 - 1.8', status: 'Normal' },
      { name: 'Thyroid Peroxidase (TPO) Ab', value: '75 IU/mL', range: '< 35', status: 'Abnormal' }
    ],
    explanations: [
      { key: 'TSH (6.2 uIU/mL)', desc: 'Thyroid Stimulating Hormone is high because the pituitary gland is sending stronger signals to stimulate a sluggish thyroid gland.' },
      { key: 'TPO Antibodies (75 IU/mL)', desc: 'Slightly high antibodies suggest that the body’s immune system is interacting with thyroid tissue, which is common in mild thyroid auto-immunity.' }
    ],
    risks: ['Subclinical Hypothyroidism', 'Hashimoto\'s Thyroiditis (Mild)'],
    specialist: { name: 'Endocrinologist', desc: 'Specializes in hormone-related conditions for tailored therapy plans.', icon: Activity },
    tests: ['Free T3 Test', 'Thyroid Ultrasound', 'TSH Repeat (in 6 weeks)']
  },
  ecg: {
    fileName: 'cardiac_ecg_report.png',
    fileSize: '3.4 MB',
    healthScore: 85,
    statusText: 'Healthy Range',
    confidence: 94,
    summary: [
      'Normal sinus rhythm with mild physiological bradycardia (slow heart rate).',
      'No acute ST-segment changes or myocardial ischemia detected.',
      'PR and QTc intervals are well within normal limits.'
    ],
    tableData: [
      { name: 'Heart Rate', value: '54 BPM', range: '60 - 100', status: 'Borderline' },
      { name: 'PR Interval', value: '158 ms', range: '120 - 200', status: 'Normal' },
      { name: 'QTc Interval', value: '410 ms', range: '< 450', status: 'Normal' }
    ],
    explanations: [
      { key: 'Heart Rate (54 BPM)', desc: 'A resting heart rate below 60 BPM is called bradycardia. In healthy, physically active individuals, a slower heart rate is typical and indicates excellent cardiac efficiency.' }
    ],
    risks: ['Physiological Bradycardia (Athletic heart pattern)'],
    specialist: { name: 'Cardiologist', desc: 'Recommended if you experience any symptoms like dizziness, lightheadedness, or shortness of breath.', icon: Heart },
    tests: ['Echocardiogram (optional)', 'Holter Monitor (only if symptomatic)']
  }
};

export const ReportAnalyzer = () => {
  const [activeReport, setActiveReport] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const simulateAnalysis = (reportKey) => {
    setIsUploading(true);
    setUploadProgress(0);
    setSelectedFile({
      name: MOCK_REPORTS[reportKey].fileName,
      size: MOCK_REPORTS[reportKey].fileSize
    });

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsUploading(false);
          setIsAnalyzing(true);
          
          setTimeout(() => {
            setIsAnalyzing(false);
            setActiveReport(MOCK_REPORTS[reportKey]);
            toast.success("AI Diagnostics successfully completed!");
          }, 3000);

          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const keys = ['blood', 'thyroid', 'ecg'];
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      simulateAnalysis(randomKey);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const keys = ['blood', 'thyroid', 'ecg'];
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      simulateAnalysis(randomKey);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 p-6 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden font-sans shadow-2xl">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f2fe05_1px,transparent_1px),linear-gradient(to_bottom,#00f2fe05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto relative z-10"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                <Sparkles className="w-3 h-3 animate-spin" /> Next-Gen AI Diagnostics
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
              AI Medical Report Analyzer
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl font-medium">
              Upload your medical reports and let AI explain them in simple language, identify abnormal values, summarize important findings, and recommend the next steps.
            </p>
          </div>

          {/* Quick Demo Selector */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/50 backdrop-blur-md p-2 rounded-2xl border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">Demo:</span>
            <button 
              onClick={() => simulateAnalysis('blood')} 
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/30 text-white transition-all cursor-pointer"
            >
              Blood Panel
            </button>
            <button 
              onClick={() => simulateAnalysis('thyroid')} 
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-purple-500/15 border border-white/10 hover:border-purple-500/30 text-white transition-all cursor-pointer"
            >
              Thyroid Scan
            </button>
            <button 
              onClick={() => simulateAnalysis('ecg')} 
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/30 text-white transition-all cursor-pointer"
            >
              ECG Cardiac
            </button>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel (35%) */}
          <div className="lg:col-span-4 space-y-6">
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300 shadow-xl relative overflow-hidden"
            >
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" /> Upload Report
              </h3>

              <label className="flex flex-col items-center justify-center border border-dashed border-white/15 rounded-xl p-8 cursor-pointer hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all duration-300 text-center">
                <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} />
                <Scan className="w-8 h-8 text-cyan-400 mb-3 animate-pulse" />
                <p className="text-sm font-semibold text-white">Drag & Drop report here</p>
                <p className="text-xs text-slate-400 mt-1">or <span className="text-cyan-400 underline">Browse Files</span></p>
                <p className="text-[10px] text-slate-500 mt-3 font-semibold uppercase tracking-wider">Max Size: 20 MB</p>
              </label>

              <AnimatePresence>
                {(isUploading || isAnalyzing || selectedFile) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 border-t border-white/5 pt-4 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 truncate max-w-[160px]">{selectedFile?.name}</span>
                      <span className="text-slate-500 font-mono">{selectedFile?.size}</span>
                    </div>

                    {isUploading && (
                      <div className="space-y-1">
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <motion.div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] font-semibold text-slate-500 uppercase">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                      </div>
                    )}

                    {isAnalyzing && (
                      <div className="flex items-center gap-2 bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-3">
                        <Brain className="w-4 h-4 text-cyan-400 animate-spin" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-cyan-400">Processing Diagnostic...</p>
                          <div className="h-1 w-full bg-cyan-950 rounded-full overflow-hidden mt-1.5">
                            <div className="h-full bg-cyan-400 w-1/2 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    )}

                    {!isUploading && !isAnalyzing && selectedFile && (
                      <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3">
                        <span className="text-xs font-semibold text-emerald-400">Upload completed</span>
                        <button onClick={() => { setSelectedFile(null); setActiveReport(null); }} className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer">Clear</button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Supported Report Types</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 font-semibold">
                {['Blood Tests', 'Thyroid Scan', 'Cardiac ECG', 'X-ray / MRI', 'Liver Panel', 'Kidney Function', 'CBC Panels', 'CT Scan Data'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-white/5 border border-white/5">
                    <div className="w-1 h-1 rounded-full bg-cyan-400" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel (65%) */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {!activeReport ? (
                <div className="depth-card bg-slate-900/30 backdrop-blur-md border border-white/5 rounded-3xl p-16 flex flex-col items-center justify-center text-center gap-6 min-h-[420px] relative overflow-hidden">
                  <Brain className="w-12 h-12 text-cyan-400 animate-pulse" />
                  <h3 className="text-xl font-bold text-white">No report uploaded</h3>
                  <p className="text-slate-400 text-sm max-w-sm font-medium">Select a demo report above or upload your own file to run the analyzer.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Overall Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Overall Health Score</h4>
                      <HealthScoreCircle score={activeReport.healthScore} />
                      <span className="mt-3 text-sm font-extrabold text-white flex items-center gap-1.5"><Activity className="w-4 h-4 text-cyan-400 animate-pulse" /> {activeReport.statusText}</span>
                    </div>

                    <div className="md:col-span-2 depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-purple-400" /> AI Executive Summary</h4>
                          <span className="text-sm font-extrabold text-purple-400 font-mono">{activeReport.confidence}% Confidence</span>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-300 font-medium">
                          {activeReport.summary.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 leading-relaxed">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Parameter Table */}
                  <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-400" /> Abnormal Parameters Detected</h4>
                    <AbnormalValueTable data={activeReport.tableData} />
                  </div>

                  {/* Simple Explanations */}
                  <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Brain className="w-4 h-4 text-cyan-400" /> Patient-Friendly Translations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeReport.explanations.map((exp, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-xs font-extrabold text-cyan-400 block mb-1">{exp.key}</span>
                          <p className="text-xs text-slate-300 leading-relaxed font-semibold">{exp.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Specialist & Tests */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Hospital className="w-4 h-4 text-cyan-400" /> Recommended Specialist</h4>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                          {React.createElement(activeReport.specialist.icon, { className: "w-6 h-6" })}
                        </div>
                        <div>
                          <span className="text-base font-bold text-white">{activeReport.specialist.name}</span>
                          <p className="text-xs text-slate-400 leading-relaxed mt-1 font-medium">{activeReport.specialist.desc}</p>
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                        <button onClick={() => {
                          toast.success('Redirecting to appointment portal...');
                          window.location.hash = '/dashboard/appointments';
                        }} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer">Schedule Appointment <ChevronRight className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Activity className="w-4 h-4 text-purple-400" /> Recommended Next-Step Tests</h4>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {activeReport.tests.map((test) => (
                          <span key={test} className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/10 border border-purple-500/25 text-purple-300">{test}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Risks & Disclaimer */}
                  <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Shield className="w-4 h-4 text-rose-500" /> Differential Risks</h4>
                    <div className="flex flex-wrap gap-2">
                      {activeReport.risks.map((risk, idx) => (
                        <span key={idx} className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-white/5 border border-white/5 text-slate-300">{risk}</span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button onClick={() => toast.success("Downloading AI summary PDF...")} className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer"><Download className="w-4 h-4" /> Download AI Summary (PDF)</button>
                    <button onClick={() => toast.success("Shared with doctor")} className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white border border-white/5 cursor-pointer"><Share className="w-4 h-4" /> Share With Doctor</button>
                    <button onClick={() => toast.success("Saved to records")} className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white border border-white/5 cursor-pointer"><FileDigit className="w-4 h-4" /> Save to Medical Records</button>
                  </div>

                  {/* Education Disclaimer */}
                  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Medical Education Disclaimer</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                        AI-generated analysis is intended only for educational purposes and should never replace consultation with a qualified healthcare professional. Never present predictions as confirmed diagnoses.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ─── Circular Health Score Renderer ─── */
const HealthScoreCircle = ({ score }) => {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = 'stroke-cyan-400';
  let glow = 'drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]';
  if (score < 70) {
    color = 'stroke-rose-500';
    glow = 'drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]';
  } else if (score < 80) {
    color = 'stroke-amber-400';
    glow = 'drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]';
  }

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="72" cy="72" r={radius} className="stroke-slate-800" strokeWidth="8" fill="transparent" />
        <circle cx="72" cy="72" r={radius} className={`${color} ${glow} transition-all duration-1000 ease-out`} strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-black tracking-tight text-white font-mono">{score}</span>
        <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500">/ 100</span>
      </div>
    </div>
  );
};

/* ─── Abnormal Parameter Table Renderer ─── */
const AbnormalValueTable = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-white/10 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
            <th className="py-2.5">Test Marker</th>
            <th className="py-2.5">Result</th>
            <th className="py-2.5">Reference Range</th>
            <th className="py-2.5 text-right">Status Flag</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-slate-300 font-semibold">
          {data.map((row, idx) => {
            let badgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
            if (row.status === 'Abnormal') {
              badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            } else if (row.status === 'Borderline') {
              badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            }
            return (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="py-3 font-semibold text-white">{row.name}</td>
                <td className="py-3 font-mono">{row.value}</td>
                <td className="py-3 text-slate-400 font-mono">{row.range}</td>
                <td className="py-3 text-right">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeColor}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
