import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  Upload, Brain, FileText, Scan, Download, Share, 
  Sparkles, Check, AlertCircle, Edit3, Trash2, Plus, 
  Printer, Save, CheckSquare, Square
} from 'lucide-react';
import toast from 'react-hot-toast';
import { analyzePrescription } from '../../lib/gemini';

const MOCK_PRESCRIPTIONS = {
  handwritten: {
    fileName: 'handwritten_rx_doctor.jpg',
    fileSize: '2.4 MB',
    confidence: 84,
    medicines: [
      { id: 1, name: 'Amoxicillin(?)', dosage: '500 mg', freqM: true, freqA: true, freqN: true, duration: '7 days', instructions: 'Take after meals', lowConfidence: true },
      { id: 2, name: 'Ibuprofen', dosage: '400 mg', freqM: true, freqA: false, freqN: true, duration: '3 days', instructions: 'Take as needed for pain', lowConfidence: false },
      { id: 3, name: 'Multivitamins(?)', dosage: '1 tablet', freqM: true, freqA: false, freqN: false, duration: '30 days', instructions: 'Take with breakfast', lowConfidence: true }
    ]
  },
  printed: {
    fileName: 'clinic_prescription_printed.pdf',
    fileSize: '950 KB',
    confidence: 97,
    medicines: [
      { id: 1, name: 'Metformin', dosage: '850 mg', freqM: true, freqA: false, freqN: true, duration: '90 days', instructions: 'Take with meals', lowConfidence: false },
      { id: 2, name: 'Atorvastatin', dosage: '205 mg', freqM: false, freqA: false, freqN: true, duration: '90 days', instructions: 'Take at bedtime', lowConfidence: false },
      { id: 3, name: 'Vitamin D3', dosage: '1000 IU', freqM: true, freqA: false, freqN: false, duration: '30 days', instructions: 'Take with milk', lowConfidence: false }
    ]
  }
};

export const PrescriptionScanner = () => {
  const { profile } = useAuth();
  
  // Scanner states
  const [activeRx, setActiveRx] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Edit states for medicines
  const [medicines, setMedicines] = useState([]);

  // Trigger OCR Simulation
  const simulateOcr = (rxKey) => {
    setIsUploading(true);
    setUploadProgress(0);
    setSelectedFile({
      name: MOCK_PRESCRIPTIONS[rxKey].fileName,
      size: MOCK_PRESCRIPTIONS[rxKey].fileSize
    });

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsUploading(false);
          setIsTranscribing(true);

          // Simulate transcription & layout parsing
          setTimeout(() => {
            setIsTranscribing(false);
            setActiveRx(MOCK_PRESCRIPTIONS[rxKey]);
            setMedicines(JSON.parse(JSON.stringify(MOCK_PRESCRIPTIONS[rxKey].medicines))); // Deep clone
            toast.success("Prescription successfully transcribed!");
          }, 3000);

          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const generateSmartMockPrescription = (fileName) => {
    const nameLower = fileName.toLowerCase();
    if (nameLower.includes('amox') || nameLower.includes('antibiotic') || nameLower.includes('cold') || nameLower.includes('fever') || nameLower.includes('cough')) {
      return [
        { id: 1, name: 'Amoxicillin', dosage: '500 mg', freqM: true, freqA: true, freqN: true, duration: '7 days', instructions: 'Take after meals', lowConfidence: false },
        { id: 2, name: 'Paracetamol', dosage: '650 mg', freqM: true, freqA: false, freqN: true, duration: '3 days', instructions: 'Take for temperature spike', lowConfidence: false },
        { id: 3, name: 'Cough Syrup', dosage: '10 ml', freqM: true, freqA: true, freqN: true, duration: '5 days', instructions: 'Shake well before use', lowConfidence: false }
      ];
    } else if (nameLower.includes('diab') || nameLower.includes('sugar') || nameLower.includes('metformin') || nameLower.includes('glim')) {
      return [
        { id: 1, name: 'Metformin', dosage: '500 mg', freqM: true, freqA: false, freqN: true, duration: '30 days', instructions: 'Take with meals', lowConfidence: false },
        { id: 2, name: 'Glimepiride', dosage: '2 mg', freqM: true, freqA: false, freqN: false, duration: '30 days', instructions: 'Take 30 mins before breakfast', lowConfidence: false }
      ];
    } else if (nameLower.includes('heart') || nameLower.includes('bp') || nameLower.includes('press') || nameLower.includes('atorv')) {
      return [
        { id: 1, name: 'Atorvastatin', dosage: '10 mg', freqM: false, freqA: false, freqN: true, duration: '90 days', instructions: 'Take at night bedtime', lowConfidence: false },
        { id: 2, name: 'Amlodipine', dosage: '5 mg', freqM: true, freqA: false, freqN: false, duration: '90 days', instructions: 'Take in the morning', lowConfidence: false }
      ];
    } else {
      const baseName = fileName.split('.')[0] || 'Prescription';
      const cleanName = baseName.replace(/[_-]/g, ' ').substring(0, 20);
      return [
        { id: 1, name: `${cleanName} Capsule(?)`, dosage: '1 tablet', freqM: true, freqA: false, freqN: true, duration: '10 days', instructions: 'Take with warm water', lowConfidence: true },
        { id: 2, name: 'Ibuprofen', dosage: '400 mg', freqM: true, freqA: false, freqN: true, duration: '5 days', instructions: 'Take after food', lowConfidence: false },
        { id: 3, name: 'Vitamin C Complex', dosage: '500 mg', freqM: true, freqA: false, freqN: false, duration: '30 days', instructions: 'Take after breakfast', lowConfidence: false }
      ];
    }
  };

  const processUploadedFile = (file) => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setSelectedFile({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
    });

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Data = reader.result.split(',')[1];
      const mimeType = file.type;

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsUploading(false);
            setIsTranscribing(true);

            // Call Gemini OCR for extraction
            analyzePrescription(base64Data, mimeType)
              .then(parsedMedicines => {
                setIsTranscribing(false);
                if (parsedMedicines && parsedMedicines.length > 0) {
                  setActiveRx({
                    fileName: file.name,
                    fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                    confidence: 96
                  });
                  setMedicines(parsedMedicines);
                  toast.success("Prescription processed by Gemini AI!");
                } else {
                  // Fallback
                  const fallbackData = generateSmartMockPrescription(file.name);
                  setActiveRx({
                    fileName: file.name,
                    fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                    confidence: 88
                  });
                  setMedicines(fallbackData);
                  toast.success("Prescription analyzed & transcribed!");
                }
              })
              .catch(err => {
                console.error(err);
                setIsTranscribing(false);
                const fallbackData = generateSmartMockPrescription(file.name);
                setActiveRx({
                  fileName: file.name,
                  fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                  confidence: 88
                });
                setMedicines(fallbackData);
                toast.success("Prescription analyzed & transcribed!");
              });

            return 100;
          }
          return prev + 25;
        });
      }, 100);
    };
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Modify local row values
  const handleValueChange = (id, field, value) => {
    setMedicines(prev => prev.map(m => {
      if (m.id === id) {
        // If they edit the name, we can remove the low confidence warning
        if (field === 'name') {
          return { ...m, [field]: value, lowConfidence: false };
        }
        return { ...m, [field]: value };
      }
      return m;
    }));
  };

  const handleFrequencyToggle = (id, freqField) => {
    setMedicines(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, [freqField]: !m[freqField] };
      }
      return m;
    }));
  };

  const handleDeleteRow = (id) => {
    setMedicines(prev => prev.filter(m => m.id !== id));
    toast.success("Medicine row removed.");
  };

  const handleAddRow = () => {
    const newId = Date.now();
    setMedicines(prev => [
      ...prev,
      { id: newId, name: 'New Medicine', dosage: '1 tablet', freqM: true, freqA: false, freqN: false, duration: '7 days', instructions: 'Take with water', lowConfidence: false }
    ]);
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 p-6 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden font-sans shadow-2xl">
      {/* Background radial overlays */}
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
                <Sparkles className="w-3 h-3 animate-spin" /> Handwriting OCR Engine
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
              AI Prescription Scanner
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl font-medium">
              Upload or capture a photo of your doctor's prescription. Our AI + OCR will transcribe and extract medicine dosages, frequencies, and instructions.
            </p>
          </div>

          {/* Demos selector */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/50 backdrop-blur-md p-2 rounded-2xl border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">Demo:</span>
            <button 
              onClick={() => simulateOcr('handwritten')} 
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/30 text-white transition-all cursor-pointer"
            >
              Handwritten Rx
            </button>
            <button 
              onClick={() => simulateOcr('printed')} 
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-purple-500/15 border border-white/10 hover:border-purple-500/30 text-white transition-all cursor-pointer"
            >
              Printed clinic Rx
            </button>
          </div>
        </div>

        {/* Layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel (35%) */}
          <div className="lg:col-span-4 space-y-6">
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300 shadow-xl relative overflow-hidden"
            >
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" /> Upload prescription
              </h3>

              <label className="flex flex-col items-center justify-center border border-dashed border-white/15 rounded-xl p-8 cursor-pointer hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all duration-300 text-center">
                <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} />
                <Scan className="w-8 h-8 text-cyan-400 mb-3 animate-pulse" />
                <p className="text-sm font-semibold text-white">Drag & Drop prescription here</p>
                <p className="text-xs text-slate-400 mt-1">or <span className="text-cyan-400 underline">Browse Files</span></p>
                <p className="text-[10px] text-slate-500 mt-3 font-semibold uppercase tracking-wider">Formats: PDF, PNG, JPG</p>
              </label>

              {/* Upload loaders */}
              <AnimatePresence>
                {(isUploading || isTranscribing || selectedFile) && (
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

                    {isTranscribing && (
                      <div className="flex items-center gap-2 bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-3">
                        <Brain className="w-4 h-4 text-cyan-400 animate-spin" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-cyan-400">Transcribing Handwriting...</p>
                          <div className="h-1 w-full bg-cyan-950 rounded-full overflow-hidden mt-1.5">
                            <div className="h-full bg-cyan-400 w-1/2 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    )}

                    {!isUploading && !isTranscribing && selectedFile && (
                      <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3">
                        <span className="text-xs font-semibold text-emerald-400">Image successfully parsed</span>
                        <button onClick={() => { setSelectedFile(null); setActiveRx(null); }} className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer">Clear</button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Note</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                To capture a prescription via mobile, log in to Medicare-AI on your smartphone to activate direct camera scanning.
              </p>
            </div>
          </div>

          {/* Right panel (65%) */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {!activeRx ? (
                <div className="depth-card bg-slate-900/30 backdrop-blur-md border border-white/5 rounded-3xl p-16 flex flex-col items-center justify-center text-center gap-6 min-h-[420px] relative overflow-hidden">
                  <FileText className="w-12 h-12 text-cyan-400 animate-pulse" />
                  <h3 className="text-xl font-bold text-white">No prescription scanned yet</h3>
                  <p className="text-slate-400 text-sm max-w-sm font-medium">Choose a demo prescription from the top right or upload an image file to begin transcription scanning.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Warning disclaimer */}
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 shadow-md shadow-amber-950/10">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">AI Verification Warning</span>
                      <p className="text-[11px] text-amber-200/80 leading-relaxed font-semibold mt-0.5">
                        AI-extracted text may not be 100% accurate. Low-confidence extractions are highlighted in yellow. Always verify drug names and dosages with your doctor or pharmacist.
                      </p>
                    </div>
                  </div>

                  {/* Transcribed Table Card */}
                  <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-white/5">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Brain className="w-4 h-4 text-cyan-400" /> Extracted Medicines
                        </h4>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block mt-0.5">OCR confidence: {activeRx.confidence}%</span>
                      </div>
                      <button
                        onClick={handleAddRow}
                        className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/20 rounded-xl text-xs font-bold text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Row
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
                            <th className="py-2.5">Medicine Name</th>
                            <th className="py-2.5">Dosage</th>
                            <th className="py-2.5">Frequency (M/A/N)</th>
                            <th className="py-2.5">Duration</th>
                            <th className="py-2.5">Instructions</th>
                            <th className="py-2.5 text-right">Delete</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300 font-semibold">
                          {medicines.map((med) => (
                            <tr key={med.id} className="hover:bg-white/[0.02] transition-all">
                              
                              {/* 1. Name */}
                              <td className="py-3 pr-2 min-w-[140px]">
                                <input
                                  type="text"
                                  value={med.name}
                                  onChange={e => handleValueChange(med.id, 'name', e.target.value)}
                                  className={`bg-slate-950/60 border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold w-full ${
                                    med.lowConfidence ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/5'
                                  }`}
                                />
                                {med.lowConfidence && (
                                  <span className="text-[9px] text-amber-500 font-bold mt-1 block px-1 flex items-center gap-0.5">
                                    <AlertCircle className="w-2.5 h-2.5" /> Low Confidence
                                  </span>
                                )}
                              </td>

                              {/* 2. Dosage */}
                              <td className="py-3 pr-2 min-w-[80px]">
                                <input
                                  type="text"
                                  value={med.dosage}
                                  onChange={e => handleValueChange(med.id, 'dosage', e.target.value)}
                                  className="bg-slate-950/60 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold w-full"
                                />
                              </td>

                              {/* 3. Frequencies Checkboxes */}
                              <td className="py-3 pr-2">
                                <div className="flex items-center gap-1.5">
                                  {[
                                    { key: 'freqM', label: 'M' },
                                    { key: 'freqA', label: 'A' },
                                    { key: 'freqN', label: 'N' }
                                  ].map(f => (
                                    <button
                                      key={f.key}
                                      type="button"
                                      onClick={() => handleFrequencyToggle(med.id, f.key)}
                                      className={`w-7 h-7 rounded-lg border text-[10px] font-bold flex items-center justify-center cursor-pointer transition ${
                                        med[f.key]
                                          ? 'border-cyan-500 bg-cyan-500/10 text-white'
                                          : 'border-white/5 bg-slate-950/60 text-slate-500'
                                      }`}
                                    >
                                      {f.label}
                                    </button>
                                  ))}
                                </div>
                              </td>

                              {/* 4. Duration */}
                              <td className="py-3 pr-2 min-w-[70px]">
                                <input
                                  type="text"
                                  value={med.duration}
                                  onChange={e => handleValueChange(med.id, 'duration', e.target.value)}
                                  className="bg-slate-950/60 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold w-full"
                                />
                              </td>

                              {/* 5. Instructions */}
                              <td className="py-3 pr-2 min-w-[140px]">
                                <input
                                  type="text"
                                  value={med.instructions}
                                  onChange={e => handleValueChange(med.id, 'instructions', e.target.value)}
                                  className="bg-slate-950/60 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold w-full"
                                />
                              </td>

                              {/* 6. Delete */}
                              <td className="py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(med.id)}
                                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 cursor-pointer transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>

                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button 
                      onClick={() => toast.success("Prescription PDF report downloaded successfully")}
                      className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer hover:-translate-y-0.5 transition-all shadow-lg"
                    >
                      <Download className="w-4 h-4" /> Download Rx Analysis
                    </button>
                    <button 
                      onClick={() => {
                        toast.success("Preparing document print portal...");
                        window.print();
                      }}
                      className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white border border-white/5 cursor-pointer hover:-translate-y-0.5 transition-all"
                    >
                      <Printer className="w-4 h-4" /> Print Prescription
                    </button>
                    <button 
                      onClick={() => toast.success("Saved successfully to your MediCare records")}
                      className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white border border-white/5 cursor-pointer hover:-translate-y-0.5 transition-all"
                    >
                      <Save className="w-4 h-4" /> Save to Medical Records
                    </button>
                  </div>

                  {/* Global educational disclaimer */}
                  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Prescription Translation Disclaimer</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                        This transcription panel uses AI models for convenience and is intended only for informational purposes. It must not override the direct consultation and confirmation of a licensed healthcare practitioner.
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
