import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Brain, Heart, Shield, Activity, FileText, 
  Scan, Hospital, AlertCircle, CheckCircle, Download, 
  Share, Sparkles, ChevronRight, Stethoscope, FileDigit, 
  Search, AlertTriangle, User, Thermometer, UserCheck, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

// ==========================================
// 1. DATASETS FOR AI REPORT ANALYZER
// ==========================================
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

// ==========================================
// 2. CONSTANTS FOR SYMPTOM CHECKER
// ==========================================
const COMMON_SYMPTOMS = [
  'Fever', 'Headache', 'Cough', 'Cold', 'Sore Throat', 
  'Chest Pain', 'Stomach Pain', 'Vomiting', 'Nausea', 'Fatigue', 
  'Back Pain', 'Joint Pain', 'Dizziness', 'Shortness of Breath', 
  'Diarrhea', 'Skin Rash', 'High Blood Pressure', 'High Sugar', 'Ear Pain'
];

const EXISTING_CONDITIONS = [
  'Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Thyroid', 'None'
];

export const Patients = () => {
  const [activeTab, setActiveTab] = useState('report'); // 'report' or 'symptom'

  // --- Report Analyzer States ---
  const [activeReport, setActiveReport] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // --- Symptom Checker States ---
  const [symptomText, setSymptomText] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [selectedConditions, setSelectedConditions] = useState(['None']);
  const [duration, setDuration] = useState('Today');
  const [severity, setSeverity] = useState('Moderate'); // 'Mild', 'Moderate', 'Severe'
  
  const [isSymptomAnalyzing, setIsSymptomAnalyzing] = useState(false);
  const [symptomResult, setSymptomResult] = useState(null);

  // ==========================================
  // REPORT ANALYZER LOGIC
  // ==========================================
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

  // ==========================================
  // SYMPTOM CHECKER LOGIC
  // ==========================================
  const toggleSymptom = (sym) => {
    setSelectedSymptoms(prev => 
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  const toggleCondition = (cond) => {
    if (cond === 'None') {
      setSelectedConditions(['None']);
    } else {
      setSelectedConditions(prev => {
        const filtered = prev.filter(c => c !== 'None');
        return filtered.includes(cond) ? filtered.filter(c => c !== cond) : [...filtered, cond];
      });
    }
  };

  const handleSymptomAnalysis = () => {
    if (selectedSymptoms.length === 0 && !symptomText.trim()) {
      toast.error("Please describe or select at least one symptom.");
      return;
    }

    setIsSymptomAnalyzing(true);
    setSymptomResult(null);

    setTimeout(() => {
      setIsSymptomAnalyzing(false);

      // Determine critical emergency symptoms first
      const hasEmergency = selectedSymptoms.includes('Chest Pain') || 
                           selectedSymptoms.includes('Shortness of Breath') || 
                           symptomText.toLowerCase().includes('chest pain') || 
                           symptomText.toLowerCase().includes('breathing difficulty');

      let result = {};

      if (hasEmergency) {
        result = {
          summary: "Based on your reported symptoms of chest discomfort/shortness of breath, there is a risk of cardiovascular or respiratory compromise. Immediate clinical assessment is critical.",
          conditions: [
            { name: "Acute Coronary Syndrome (ACS)", confidence: 78 },
            { name: "Myocardial Infarction / Angina", confidence: 64 },
            { name: "Bronchospasm / Pulmonary Embolism", confidence: 52 }
          ],
          severity: "High",
          severityExplanation: "Your symptoms indicate severe physiological distress requiring immediate medical attention. Do not delay seeking care.",
          specialist: { name: "Cardiologist / Pulmonologist", icon: Heart },
          care: [
            "Sit in a comfortable upright position.",
            "Avoid physical exertion or stress.",
            "Do not consume solid foods or caffeinated drinks.",
            "If prescribed, take immediate cardiac or asthma medication.",
            "Seek emergency services immediately if pain radiates or worsens."
          ],
          tests: ["Electrocardiogram (ECG)", "Troponin Blood Test", "Chest X-Ray", "CT Pulmonary Angiography"],
          emergency: true,
          tips: ["Avoid self-medication without professional consent.", "Stay seated and focus on slow, calm breathing.", "Prepare your medical history summary for EMTs."]
        };
      } else if (selectedSymptoms.includes('Fever') || selectedSymptoms.includes('Cough') || selectedSymptoms.includes('Sore Throat')) {
        result = {
          summary: "Your symptoms point toward a standard respiratory viral syndrome. Given the combination of symptoms, home self-care alongside general consultation is advised.",
          conditions: [
            { name: "Viral Influenza (Flu)", confidence: 82 },
            { name: "Acute Nasopharyngitis (Common Cold)", confidence: 74 },
            { name: "COVID-19 Bronchial Syndrome", confidence: 43 }
          ],
          severity: "Moderate",
          severityExplanation: "Your symptoms indicate a standard immune response to a pathogen. Monitor indicators regularly.",
          specialist: { name: "General Physician", icon: Stethoscope },
          care: [
            "Drink plenty of water and warm fluids.",
            "Take sufficient absolute bed rest.",
            "Monitor body temperature every 4-6 hours.",
            "Gargle with warm salt water for throat comfort.",
            "Ensure room ventilation is optimal."
          ],
          tests: ["Complete Blood Count (CBC)", "COVID-19 Antigen/PCR Test", "Influenza Panel Swap"],
          emergency: false,
          tips: ["Maintain high hydration.", "Isolate temporarily to avoid transmission.", "Use antipyretics only as directed by a doctor."]
        };
      } else if (selectedSymptoms.includes('Stomach Pain') || selectedSymptoms.includes('Vomiting') || selectedSymptoms.includes('Diarrhea')) {
        result = {
          summary: "Symptoms suggest gastrointestinal inflammation, likely related to foodborne pathogens or viral gastroenteritis. Replenishing lost fluid is key.",
          conditions: [
            { name: "Gastroenteritis (Stomach Flu)", confidence: 85 },
            { name: "Foodborne Pathogen Infection", confidence: 70 },
            { name: "Irritable Bowel Flare-up", confidence: 48 }
          ],
          severity: "Moderate",
          severityExplanation: "Dehydration is the primary risk. Care should focus on fluid intake and light nutrition.",
          specialist: { name: "Gastroenterologist", icon: Activity },
          care: [
            "Consume Oral Rehydration Solutions (ORS).",
            "Avoid oily, spicy, and dairy foods.",
            "Eat small bland meals (BRAT diet: Banana, Rice, Applesauce, Toast).",
            "Monitor for high fever or blood in stool."
          ],
          tests: ["Stool Culture Panel", "Complete Blood Count (CBC)", "Electrolyte Panel"],
          emergency: false,
          tips: ["Prioritize electrolytes over plain water to prevent sodium loss.", "Wash hands regularly to prevent spreading infection."]
        };
      } else {
        // Default generic safe results
        result = {
          summary: "Based on the selected indications, you are experiencing mild physiological fatigue or musculoskeletal discomfort. Routine checkup and lifestyle tuning is recommended.",
          conditions: [
            { name: "Tension / Musculoskeletal Strain", confidence: 70 },
            { name: "Systemic Fatigue / Sleep Debt", confidence: 60 },
            { name: "Mild Dehydration or Vitamin Deficit", confidence: 45 }
          ],
          severity: "Low",
          severityExplanation: "Symptoms appear mild and can generally be managed with rest, hydration, and minor routine adjustments.",
          specialist: { name: "General Physician", icon: UserCheck },
          care: [
            "Ensure 7-8 hours of continuous sleep.",
            "Keep daily water intake above 2.5 Liters.",
            "Perform gentle stretching exercises.",
            "Monitor body changes over the next 48 hours."
          ],
          tests: ["Basic Metabolic Panel (BMP)", "Vitamin D & B12 Screening"],
          emergency: false,
          tips: ["Add raw fruits and vegetables to your diet.", "Take short breaks during long sitting sessions."]
        };
      }

      setSymptomResult(result);
      toast.success("AI Symptom Analysis completed!");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 p-6 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden font-sans shadow-2xl">
      {/* Dynamic Cyberpunk Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f2fe05_1px,transparent_1px),linear-gradient(to_bottom,#00f2fe05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Top Tab Feature Switcher */}
        <div className="flex bg-slate-900/50 backdrop-blur-md rounded-2xl p-1 mb-8 border border-white/5 max-w-md mx-auto shadow-inner">
          <button
            onClick={() => setActiveTab('report')}
            className={`flex-grow py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'report'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AI Medical Report Analyzer
          </button>
          <button
            onClick={() => setActiveTab('symptom')}
            className={`flex-grow py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'symptom'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AI Symptom Checker
          </button>
        </div>

        {/* ========================================================
            TAB 1: AI MEDICAL REPORT ANALYZER
            ======================================================== */}
        <AnimatePresence mode="wait">
          {activeTab === 'report' && (
            <motion.div
              key="report-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
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

                {/* Demo Selector */}
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

              {/* Layout Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Upload Panel */}
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

                    {/* Progress indicators */}
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
                </div>

                {/* Right Result Panel */}
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
                              <button onClick={() => toast.success('Redirecting to appointment portal...')} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer">Schedule Appointment <ChevronRight className="w-3.5 h-3.5" /></button>
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
          )}

          {/* ========================================================
              TAB 2: AI SYMPTOM CHECKER
              ======================================================== */}
          {activeTab === 'symptom' && (
            <motion.div
              key="symptom-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
                      <Brain className="w-3 h-3 text-purple-400" /> Patient Symptom Triaging
                    </span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                    AI Symptom Checker
                  </h1>
                  <p className="text-slate-400 text-sm mt-1 max-w-2xl font-medium">
                    Describe your symptoms and let AI provide possible health conditions, severity level, recommended specialist, and suggested next steps.
                  </p>
                </div>
              </div>

              {/* Layout Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Symptom Input Panel (40%) */}
                <div className="lg:col-span-5 depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                  
                  {/* Large Input Box */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Describe what you feel</label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <textarea
                        value={symptomText}
                        onChange={(e) => setSymptomText(e.target.value)}
                        placeholder="Example: I have fever, headache, sore throat, body pain..."
                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 transition-all h-24 resize-none"
                      />
                    </div>
                  </div>

                  {/* Common Clickable Chips */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Common Symptoms</label>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_SYMPTOMS.map((sym) => {
                        const isSelected = selectedSymptoms.includes(sym);
                        return (
                          <button
                            key={sym}
                            onClick={() => toggleSymptom(sym)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.25)]'
                                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {sym}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Demographics row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age</label>
                      <input
                        type="number"
                        placeholder="Age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-2.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-2.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-purple-400"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight (kg)</label>
                      <input
                        type="number"
                        placeholder="kg"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-2.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Height (cm)</label>
                      <input
                        type="number"
                        placeholder="cm"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-2.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  {/* Existing Medical Conditions */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Existing Medical Conditions</label>
                    <div className="flex flex-wrap gap-1.5">
                      {EXISTING_CONDITIONS.map((cond) => {
                        const isSelected = selectedConditions.includes(cond);
                        return (
                          <button
                            key={cond}
                            onClick={() => toggleCondition(cond)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-purple-600/35 border-purple-500/40 text-white shadow-sm'
                                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {cond}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Duration & Severity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duration</label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-purple-400"
                      >
                        <option>Today</option>
                        <option>2-3 Days</option>
                        <option>1 Week</option>
                        <option>More than 1 Week</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Severity Slider</label>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1 px-1">
                        <span className={severity === 'Mild' ? 'text-emerald-400' : ''}>Mild</span>
                        <span className={severity === 'Moderate' ? 'text-amber-400' : ''}>Moderate</span>
                        <span className={severity === 'Severe' ? 'text-rose-500' : ''}>Severe</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        value={severity === 'Mild' ? 1 : severity === 'Moderate' ? 2 : 3}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          setSeverity(v === 1 ? 'Mild' : v === 2 ? 'Moderate' : 'Severe');
                        }}
                        className="w-full accent-purple-500 cursor-pointer h-1 bg-slate-950 rounded-lg appearance-none"
                      />
                    </div>
                  </div>

                  {/* Submit Analyze Button */}
                  <button
                    onClick={handleSymptomAnalysis}
                    disabled={isSymptomAnalyzing}
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer border border-purple-500/30"
                  >
                    {isSymptomAnalyzing ? (
                      <>
                        <Brain className="w-4 h-4 animate-spin text-purple-200" />
                        Analyzing Indicators...
                      </>
                    ) : (
                      <>
                        <Activity className="w-4 h-4 text-purple-200 animate-pulse" />
                        Analyze Symptoms
                      </>
                    )}
                  </button>

                </div>

                {/* Right Results Panel (60%) */}
                <div className="lg:col-span-7">
                  <AnimatePresence mode="wait">
                    {!symptomResult ? (
                      <div className="depth-card bg-slate-900/30 backdrop-blur-md border border-white/5 rounded-3xl p-16 flex flex-col items-center justify-center text-center gap-6 min-h-[460px] relative overflow-hidden">
                        <Thermometer className="w-12 h-12 text-purple-400 animate-pulse" />
                        <h3 className="text-xl font-bold text-white">No symptoms analyzed yet</h3>
                        <p className="text-slate-400 text-sm max-w-sm font-medium">Describe your conditions in the panel and trigger the diagnostic scan to analyze potential outcomes.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        
                        {/* Emergency Warning Red Alert Card */}
                        {symptomResult.emergency && (
                          <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-rose-950/20 border border-rose-500/40 rounded-2xl p-5 flex items-start gap-4 shadow-xl shadow-rose-950/10 animate-pulse"
                          >
                            <AlertTriangle className="w-8 h-8 text-rose-500 flex-shrink-0" />
                            <div>
                              <h4 className="text-base font-bold text-rose-500">Emergency Alert</h4>
                              <p className="text-xs text-rose-200 leading-relaxed font-semibold mt-1">
                                Your symptoms may require immediate medical attention. Please call emergency services (e.g. 911 or local emergency numbers) or visit the nearest emergency care hospital immediately.
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {/* Section 1: AI Summary & Severity */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Severity Indicator */}
                          <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Severity Level</h4>
                            <div className="flex items-center gap-2 mb-3">
                              {symptomResult.severity === 'High' ? (
                                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                              ) : symptomResult.severity === 'Moderate' ? (
                                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                              )}
                              <span className="text-lg font-black text-white">{symptomResult.severity}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">{symptomResult.severityExplanation}</p>
                          </div>

                          {/* AI Summary */}
                          <div className="md:col-span-2 depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                            <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Triage Assessment
                              </h4>
                              <p className="text-sm text-slate-300 font-semibold leading-relaxed">
                                {symptomResult.summary}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Possible Conditions */}
                        <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Brain className="w-4 h-4 text-purple-400" /> Possible Conditions (Differential Reference)
                          </h4>
                          
                          <div className="space-y-3.5">
                            {symptomResult.conditions.map((cond, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-xs font-bold">
                                  <span className="text-white">{cond.name}</span>
                                  <span className="text-purple-400 font-mono">{cond.confidence}% Match</span>
                                </div>
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-400" style={{ width: `${cond.confidence}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="text-[10px] text-slate-500 font-semibold italic flex items-center gap-1.5 pt-2 border-t border-white/5">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>These match parameters represent educational approximations only.</span>
                          </div>
                        </div>

                        {/* Section 4 & 5: Specialist & Immediate Care */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Recommended Specialist */}
                          <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                            <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Hospital className="w-4 h-4 text-purple-400" /> Recommended Specialist
                              </h4>
                              
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                                  {React.createElement(symptomResult.specialist.icon || Stethoscope, { className: "w-6 h-6" })}
                                </div>
                                <div>
                                  <span className="text-base font-bold text-white">{symptomResult.specialist.name}</span>
                                  <p className="text-xs text-slate-400 leading-relaxed mt-1 font-medium">We recommend scheduling a clinical consult with this department.</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Suggested Immediate Care */}
                          <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <Activity className="w-4 h-4 text-purple-400" /> Suggested Immediate Care
                            </h4>
                            
                            <ul className="space-y-2 text-xs font-semibold text-slate-300">
                              {symptomResult.care.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                        </div>

                        {/* Section 6 & 9: Suggested Medical Tests & Health Tips */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Tests */}
                          <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <FileText className="w-4 h-4 text-purple-400" /> Suggested Diagnostics Tests
                            </h4>
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {symptomResult.tests.map((test) => (
                                <span key={test} className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/10 border border-purple-500/20 text-purple-300">
                                  {test}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Personalized Health Tips */}
                          <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <Shield className="w-4 h-4 text-purple-400" /> Personalized Health Tips
                            </h4>
                            
                            <ul className="space-y-2 text-xs font-semibold text-slate-300">
                              {symptomResult.tips.map((tip, idx) => (
                                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                        </div>

                        {/* Section 8: Book Appointment Actions */}
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <button
                            onClick={() => {
                              toast.success("Navigating to appointment scheduler...");
                              window.location.hash = '/dashboard/appointments';
                            }}
                            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 hover:-translate-y-0.5 transition-all cursor-pointer border border-purple-500/35"
                          >
                            <Calendar className="w-4 h-4" /> Book Online Doctor Consultation
                          </button>
                          <button
                            onClick={() => {
                              toast.success("Navigating to clinic scheduler...");
                              window.location.hash = '/dashboard/appointments';
                            }}
                            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white border border-white/5 hover:-translate-y-0.5 transition-all cursor-pointer"
                          >
                            <Hospital className="w-4 h-4" /> Book Hospital Appointment
                          </button>
                        </div>

                      </div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Disclaimer at the Bottom */}
        <div className="mt-12 pt-6 border-t border-white/10 text-center max-w-4xl mx-auto">
          <p className="text-[10px] text-slate-500 leading-relaxed font-bold tracking-wide">
            AI Symptom Checker provides informational guidance only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional.
          </p>
        </div>

      </div>
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
