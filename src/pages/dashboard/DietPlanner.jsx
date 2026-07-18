import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Apple, Droplet, Flame, ShieldAlert, Sparkles, Plus, Minus, 
  Save, RefreshCw, Activity, Clock, ShieldCheck, Heart, User 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { generateDietPlan } from '../../lib/gemini';

export const DietPlanner = () => {
  // Profile inputs state
  const [age, setAge] = useState(28);
  const [gender, setGender] = useState("Male");
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [allergies, setAllergies] = useState("");
  const [preference, setPreference] = useState("Veg");
  const [goal, setGoal] = useState("Healthy Lifestyle");
  const [conditions, setConditions] = useState([]);
  const [activityLevel, setActivityLevel] = useState("Sedentary");

  // Hydration state (persisted)
  const [waterCups, setWaterCups] = useState(() => {
    const saved = localStorage.getItem('diet_hydration_log');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Active diet plan state (loaded from local storage on mount)
  const [activePlan, setActivePlan] = useState(() => {
    const saved = localStorage.getItem('current_diet_plan');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Save hydration log
  useEffect(() => {
    localStorage.setItem('diet_hydration_log', waterCups.toString());
  }, [waterCups]);

  // Handle condition checkbox change
  const handleConditionChange = (cond) => {
    if (conditions.includes(cond)) {
      setConditions(conditions.filter(c => c !== cond));
    } else {
      setConditions([...conditions, cond]);
    }
  };

  // Calculate BMI
  const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);
  const getBmiCategory = (val) => {
    if (val < 18.5) return { label: "Underweight", color: "text-sky-400" };
    if (val < 25) return { label: "Normal Weight", color: "text-emerald-400" };
    if (val < 30) return { label: "Overweight", color: "text-amber-400" };
    return { label: "Obese", color: "text-rose-400" };
  };
  const bmiCategory = getBmiCategory(parseFloat(bmi));

  // Generate Diet Plan
  const handleGeneratePlan = async () => {
    setIsLoading(true);
    try {
      const plan = await generateDietPlan({
        age,
        gender,
        height,
        weight,
        bmi,
        activityLevel,
        conditions: conditions.join(', '),
        allergies,
        preference,
        goal
      });

      if (plan) {
        setActivePlan(plan);
        localStorage.setItem('current_diet_plan', JSON.stringify(plan));
        toast.success("AI Diet Plan generated successfully!");
      } else {
        toast.error("Failed to generate plan. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during generation.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset or clear current plan
  const handleReset = () => {
    setActivePlan(null);
    localStorage.removeItem('current_diet_plan');
    setWaterCups(0);
    toast.success("Diet planner reset successfully.");
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 p-6 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden font-sans shadow-2xl">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f2fe05_1px,transparent_1px),linear-gradient(to_bottom,#00f2fe05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="border-b border-white/10 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1 shadow-md">
                <Sparkles className="w-3.5 h-3.5" /> AI Nutrition Expert
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
              AI Personalized Diet Planner
            </h1>
            <p className="text-slate-400 text-sm mt-1">Get custom meal recommendations, nutrition summaries, and dynamic calorie targeting.</p>
          </div>

          {activePlan && (
            <button 
              onClick={handleReset}
              className="px-4 py-2 bg-slate-900/50 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md text-rose-400"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear Plan
            </button>
          )}
        </div>

        {/* Dynamic Display Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (Inputs Section - 40%) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="depth-card bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl space-y-6 shadow-xl">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" /> Patient Profile Data
              </h3>

              {/* Physical Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Age (Years)</label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400 transition"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Height (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={e => setHeight(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={e => setWeight(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              {/* BMI Output Card */}
              <div className="bg-slate-950 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Calculated BMI</p>
                  <p className="text-lg font-black text-white mt-0.5">{bmi} kg/m²</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status</p>
                  <p className={`text-xs font-bold mt-0.5 ${bmiCategory.color}`}>{bmiCategory.label}</p>
                </div>
              </div>

              {/* Dietary preferences */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dietary Choice</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Veg", "Non-Veg", "Vegan"].map(pref => (
                      <button
                        key={pref}
                        onClick={() => setPreference(pref)}
                        className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          preference === pref 
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' 
                            : 'bg-slate-950 border-white/10 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Health Target Goal</label>
                  <select
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400 transition"
                  >
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Weight Gain">Weight Gain</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="Healthy Lifestyle">Healthy Lifestyle</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Activity Level</label>
                  <select
                    value={activityLevel}
                    onChange={e => setActivityLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400 transition"
                  >
                    <option value="Sedentary">Sedentary (Little or no exercise)</option>
                    <option value="Lightly Active">Lightly Active (Exercise 1-3 days/week)</option>
                    <option value="Moderately Active">Moderately Active (Exercise 3-5 days/week)</option>
                    <option value="Very Active">Very Active (Exercise 6-7 days/week)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Allergies (e.g. Peanut, Gluten)</label>
                  <input
                    type="text"
                    value={allergies}
                    placeholder="Enter any allergies or type 'None'..."
                    onChange={e => setAllergies(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              {/* Medical conditions */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Medical Conditions</label>
                <div className="flex flex-wrap gap-2">
                  {["Diabetes", "Hypertension", "Thyroid", "Heart Disease", "Gout"].map(cond => {
                    const isSelected = conditions.includes(cond);
                    return (
                      <button
                        key={cond}
                        onClick={() => handleConditionChange(cond)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          isSelected 
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                            : 'bg-slate-950 border-white/10 text-slate-500 hover:border-white/20'
                        }`}
                      >
                        {cond}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action trigger button */}
              <button
                onClick={handleGeneratePlan}
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition shadow-md shadow-cyan-600/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Customizing Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Calculate & Plan
                  </>
                )}
              </button>

            </div>
          </div>

          {/* Right Column (Results Section - 60%) */}
          <div className="lg:col-span-7 space-y-6">
            
            <AnimatePresence mode="wait">
              {activePlan ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  
                  {/* Calorie Target and Macros Card */}
                  <div className="depth-card bg-slate-900/40 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nutrition targets</span>
                        <h3 className="text-lg font-black text-white flex items-center gap-1.5 mt-0.5">
                          <Flame className="w-5 h-5 text-amber-500 animate-pulse" /> {activePlan.calorieTarget} Daily Calories
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-slate-950 border border-white/5 px-3 py-1.5 rounded-xl">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">AI Approved Plan</span>
                      </div>
                    </div>

                    {/* Macronutrient breakdown */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Protein */}
                      <div className="bg-slate-950 border border-white/5 rounded-xl p-4 text-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Protein</span>
                        <span className="text-xl font-black text-cyan-400 font-mono">{activePlan.macros.protein}g</span>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-3">
                          <div className="bg-cyan-500 h-full" style={{ width: '80%' }} />
                        </div>
                      </div>
                      
                      {/* Carbs */}
                      <div className="bg-slate-950 border border-white/5 rounded-xl p-4 text-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Carbs</span>
                        <span className="text-xl font-black text-purple-400 font-mono">{activePlan.macros.carbs}g</span>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-3">
                          <div className="bg-purple-500 h-full" style={{ width: '65%' }} />
                        </div>
                      </div>

                      {/* Fat */}
                      <div className="bg-slate-950 border border-white/5 rounded-xl p-4 text-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Fats</span>
                        <span className="text-xl font-black text-amber-400 font-mono">{activePlan.macros.fat}g</span>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-3">
                          <div className="bg-amber-500 h-full" style={{ width: '45%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Daily Meal Schedule */}
                  <div className="space-y-4">
                    {Object.entries(activePlan.meals).map(([mealType, meal]) => (
                      <div 
                        key={mealType}
                        className="depth-card bg-slate-900/40 border border-white/10 hover:border-cyan-500/20 rounded-2xl p-5 transition-all duration-300 relative group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-500/5 px-2.5 py-0.5 rounded-full border border-cyan-500/10">
                            {mealType}
                          </span>
                          <span className="text-xs text-slate-500 font-mono font-bold">{meal.calories} kcal</span>
                        </div>

                        <h4 className="font-extrabold text-sm text-white group-hover:text-cyan-400 transition-colors mb-2">
                          {meal.title}
                        </h4>

                        <div className="space-y-2 text-xs">
                          <p className="text-slate-400 font-medium">
                            <strong className="text-slate-200">Ingredients:</strong> {meal.ingredients}
                          </p>
                          <p className="text-slate-500 font-medium">
                            <strong className="text-slate-300">Preparation:</strong> {meal.instructions}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Hydration Tracker & Nutrition Tips */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Water logger */}
                    <div className="depth-card bg-slate-900/40 border border-white/10 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <Droplet className="w-5 h-5 text-cyan-400 animate-bounce" />
                        <h4 className="font-extrabold text-sm text-white">Hydration Logger</h4>
                      </div>
                      
                      <div className="bg-slate-950 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Goal: 8 Glasses</p>
                          <p className="text-lg font-black text-white mt-0.5">{waterCups} / 8 Cups</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => setWaterCups(Math.max(0, waterCups - 1))}
                            className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold border border-white/5 flex items-center justify-center transition cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setWaterCups(Math.min(20, waterCups + 1))}
                            className="w-8 h-8 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* AI Nutrition tips list */}
                    <div className="depth-card bg-slate-900/40 border border-white/10 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <Apple className="w-5 h-5 text-purple-400" />
                        <h4 className="font-extrabold text-sm text-white">Clinician Tips</h4>
                      </div>

                      <ul className="space-y-2 text-xs text-slate-400 font-medium">
                        {activePlan.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* General Disclaimer */}
                  <div className="depth-card bg-slate-900/20 border border-rose-500/20 p-4 rounded-xl flex gap-3 text-slate-400 text-xs">
                    <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-rose-400">Dietary Disclaimer:</strong> This personalized meal breakdown is compiled using generative AI algorithms and is intended solely for educational, conditioning and general health purposes. Patients must consult a qualified dietitian or physician prior to adopting strict calorie targets.
                    </div>
                  </div>

                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="depth-card bg-slate-900/20 border border-white/5 p-16 text-center text-slate-500 rounded-3xl"
                >
                  <Apple className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-base font-bold text-white">No active diet plan</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Fill in your physical details, dietary choices, and goals on the left to compute your personalized nutritional schedule.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </div>
    </div>
  );
};
