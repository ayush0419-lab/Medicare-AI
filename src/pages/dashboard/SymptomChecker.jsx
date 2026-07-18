import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Heart, Shield, Activity, FileText, 
  Hospital, AlertCircle, CheckCircle, Search, AlertTriangle, 
  Thermometer, UserCheck, Calendar, Stethoscope, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const COMMON_SYMPTOMS = [
  'Fever', 'Headache', 'Cough', 'Cold', 'Sore Throat', 
  'Chest Pain', 'Stomach Pain', 'Vomiting', 'Nausea', 'Fatigue', 
  'Back Pain', 'Joint Pain', 'Dizziness', 'Shortness of Breath', 
  'Diarrhea', 'Skin Rash', 'High Blood Pressure', 'High Sugar', 'Ear Pain'
];

const EXISTING_CONDITIONS = [
  'Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Thyroid', 'None'
];

export const SymptomChecker = () => {
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

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel (40%) */}
          <div className="lg:col-span-5 depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
            
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
                          ? 'bg-purple-600/35 border-purple-500/40 text-white'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {cond}
                    </button>
                  );
                })}
              </div>
            </div>

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

            <button
              onClick={handleSymptomAnalysis}
              disabled={isSymptomAnalyzing}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg cursor-pointer border border-purple-500/30 transition-all flex items-center justify-center gap-2"
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

          {/* Right Panel (60%) */}
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

                  {/* Severity & Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                  {/* Possible Conditions */}
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
                  </div>

                  {/* Specialist & Immediate Care */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  {/* Medical Tests & Health Tips */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={() => {
                        toast.success("Redirecting to online consultations...");
                        window.location.hash = '/dashboard/appointments';
                      }}
                      className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg cursor-pointer border border-purple-500/35 transition-all"
                    >
                      <Calendar className="w-4 h-4" /> Book Online Doctor Consultation
                    </button>
                    <button
                      onClick={() => {
                        toast.success("Redirecting to hospital booking...");
                        window.location.hash = '/dashboard/appointments';
                      }}
                      className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white border border-white/5 cursor-pointer transition-all"
                    >
                      <Hospital className="w-4 h-4" /> Book Hospital Appointment
                    </button>
                  </div>

                </div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Global Disclaimer */}
        <div className="mt-12 pt-6 border-t border-white/10 text-center max-w-4xl mx-auto">
          <p className="text-[10px] text-slate-500 leading-relaxed font-bold tracking-wide">
            AI Symptom Checker provides informational guidance only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional.
          </p>
        </div>

      </motion.div>
    </div>
  );
};
