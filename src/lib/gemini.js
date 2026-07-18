import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
let genAI = null;

if (apiKey && apiKey.trim() !== '') {
  genAI = new GoogleGenerativeAI(apiKey);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * AI Chat Assistant
 */
export const generateChatResponse = async (history, prompt, role = 'patient') => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const systemPrompt = role === 'doctor' 
        ? "You are MediChat, an advanced clinical AI assistant. Provide concise, professional differential diagnoses and medical insights. Always include a disclaimer."
        : "You are MediChat, a helpful healthcare assistant. Answer patient questions simply and clearly. Do NOT provide official medical diagnoses, but give general health advice and recommend they see a doctor for serious concerns. Keep answers short.";

      const chat = model.startChat({
        history: history.map(h => ({
          role: h.role === 'ai' ? 'model' : 'user',
          parts: [{ text: h.text }]
        })),
        systemInstruction: { parts: [{ text: systemPrompt }] }
      });
      
      const result = await chat.sendMessage(prompt);
      return result.response.text();
    } catch (err) {
      console.error('Gemini chat error:', err);
      // Fall through to mock if failed
    }
  }

  // --- Mock Response ---
  await sleep(1500);
  if (role === 'doctor') {
    return "Based on those symptoms, I suggest considering a full blood count (FBC) and inflammatory markers. Note: This is an AI simulation since the Gemini API key is missing.";
  }
  return "That sounds uncomfortable. While I can't provide a direct medical diagnosis, I'd recommend monitoring your symptoms and scheduling an appointment if they persist. (Simulation Mode: API Key missing)";
};

/**
 * AI Medical Record Summarizer
 */
export const generateMedicalSummary = async (records) => {
  if (!records || records.length === 0) return "No medical records to summarize.";

  const recordText = records.map(r => `Diagnosis: ${r.diagnosis}. Notes: ${r.notes || 'None'}. Prescription: ${r.prescription || 'None'}`).join('\n');

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Please summarize the following patient medical records into 3 concise bullet points highlighting key conditions and treatments:\n${recordText}`;
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.error('Gemini summary error:', err);
    }
  }

  // --- Mock Response ---
  await sleep(1000);
  return `• Patient has a history of ${records.length} documented visits.\n• Main diagnoses include: ${records.map(r => r.diagnosis).join(', ')}.\n• (Note: Please add Gemini API key to .env.local for real summaries)`;
};

/**
 * AI Risk Score Predictor
 */
export const predictHealthRisk = async (patientData) => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Analyze this patient's data and predict their health risk level (respond EXACTLY with one word: 'Low', 'Moderate', 'High', or 'Critical'). Data: Conditions-[${patientData.conditions?.join(', ')}], Notes-[${patientData.notes}]`;
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim().toLowerCase();
      if (text.includes('critical')) return 'Critical';
      if (text.includes('high')) return 'High';
      if (text.includes('moderate')) return 'Moderate';
      return 'Low';
    } catch (err) {
      console.error('Gemini risk score error:', err);
    }
  }

  // --- Mock Response ---
  await sleep(800);
  if (patientData.conditions?.some(c => c.toLowerCase().includes('heart') || c.toLowerCase().includes('cancer'))) return 'Critical';
  if (patientData.conditions?.some(c => c.toLowerCase().includes('diabetes') || c.toLowerCase().includes('hypertension'))) return 'High';
  if (patientData.conditions?.length > 1) return 'Moderate';
  return 'Low';
};

/**
 * AI Smart Appointment Scheduling
 */
export const suggestAppointmentDetails = async (symptoms) => {
  if (genAI && symptoms && symptoms.trim() !== '') {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Analyze these symptoms for scheduling an appointment: "${symptoms}". 
      Respond ONLY with a JSON object containing {"duration": number_in_minutes, "type": "in-person" or "virtual"}.
      Example: {"duration": 30, "type": "virtual"}.
      For severe physical symptoms (chest pain, injury), use in-person and 60. For mild (headache, refill), use virtual and 15.`;
      
      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const st = JSON.parse(text);
      return { duration: st.duration || 30, type: st.type || 'in-person' };
    } catch (err) {
      console.error('Gemini smart schedule error:', err);
    }
  }

  // --- Mock Response ---
  await sleep(800);
  const s = (symptoms || '').toLowerCase();
  if (s.includes('pain') || s.includes('severe') || s.includes('bleeding')) {
    return { duration: 60, type: 'in-person' };
  }
  if (s.includes('refill') || s.includes('mild') || s.includes('headache')) {
    return { duration: 15, type: 'virtual' };
  }
  return { duration: 30, type: 'in-person' };
};

/**
 * AI Prescription Analyzer (Multimodal Image/PDF OCR)
 */
export const analyzePrescription = async (fileData, mimeType) => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Analyze this medical prescription image or document and extract the list of medications. 
      Respond ONLY with a JSON array containing the list of medicines. 
      Each item in the array MUST have this format:
      {
        "id": number,
        "name": "Medicine Name",
        "dosage": "Dosage (e.g. 500mg, 1 tablet)",
        "freqM": true/false (taken in morning),
        "freqA": true/false (taken in afternoon),
        "freqN": true/false (taken in night),
        "duration": "Duration (e.g. 7 days)",
        "instructions": "Instructions (e.g. Take after food)",
        "lowConfidence": true/false (set to true if the text/spelling is hard to read or uncertain)
      }
      Ensure all keys are present. Do not include markdown code block formatting (like \`\`\`json) in your response, just return a raw JSON string.`;

      const generativePart = {
        inlineData: {
          data: fileData,
          mimeType: mimeType
        }
      };

      const result = await model.generateContent([prompt, generativePart]);
      let text = result.response.text().trim();
      
      // Robust JSON array boundary extraction
      const start = text.indexOf('[');
      const end = text.lastIndexOf(']');
      if (start !== -1 && end !== -1 && end > start) {
        text = text.substring(start, end + 1);
      }
      
      return JSON.parse(text);
    } catch (err) {
      console.error('Gemini prescription error:', err);
    }
  }
  return null;
};

/**
 * AI Personalized Diet Planner
 */
export const generateDietPlan = async (dietData) => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Generate a personalized diet plan based on the following patient profile:
      - Age: ${dietData.age}
      - Gender: ${dietData.gender}
      - Height: ${dietData.height} cm
      - Weight: ${dietData.weight} kg
      - BMI: ${dietData.bmi}
      - Activity Level: ${dietData.activityLevel || 'Sedentary'}
      - Medical Conditions: ${dietData.conditions || 'None'}
      - Allergies: ${dietData.allergies || 'None'}
      - Dietary Preference: ${dietData.preference}
      - Health Goal: ${dietData.goal}
      
      Respond ONLY with a valid JSON object. Do not include markdown code block formatting (like \`\`\`json) in your response. 
      The JSON MUST follow this exact structure:
      {
        "calorieTarget": number,
        "macros": { "protein": number_in_grams, "carbs": number_in_grams, "fat": number_in_grams },
        "meals": {
          "breakfast": { "title": "String", "calories": number, "ingredients": "String", "instructions": "String" },
          "lunch": { "title": "String", "calories": number, "ingredients": "String", "instructions": "String" },
          "dinner": { "title": "String", "calories": number, "ingredients": "String", "instructions": "String" },
          "snacks": { "title": "String", "calories": number, "ingredients": "String", "instructions": "String" }
        },
        "tips": ["String", "String", "String"]
      }`;

      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();
      
      // Robust JSON extraction
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end >= start) {
        text = text.substring(start, end + 1);
      }
      return JSON.parse(text);
    } catch (err) {
      console.error('Gemini diet plan error:', err);
    }
  }

  // --- Dynamic Mathematical Nutritional Fallback ---
  await sleep(1500);

  // 1. BMR (Mifflin-St Jeor)
  const w = parseFloat(dietData.weight) || 70;
  const h = parseFloat(dietData.height) || 175;
  const a = parseFloat(dietData.age) || 28;
  let bmr = 10 * w + 6.25 * h - 5 * a;
  if (dietData.gender === 'Male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  // 2. Activity Level Multiplier
  let multiplier = 1.2;
  const act = (dietData.activityLevel || 'Sedentary').toLowerCase();
  if (act.includes('light')) multiplier = 1.375;
  else if (act.includes('mod')) multiplier = 1.55;
  else if (act.includes('very') || act.includes('hard')) multiplier = 1.725;

  let tdee = Math.round(bmr * multiplier);

  // 3. Goal Adjustment
  if (dietData.goal === 'Weight Loss') {
    tdee = Math.max(1200, tdee - 500);
  } else if (dietData.goal === 'Weight Gain' || dietData.goal === 'Muscle Gain') {
    tdee += 500;
  }

  // 4. Macros calculation
  // Protein: 2.0g per kg of bodyweight
  const protein = Math.round(w * 2.0);
  const proteinCal = protein * 4;
  // Fat: 25% of total calories
  const fatCal = tdee * 0.25;
  const fat = Math.round(fatCal / 9);
  // Carbs: Remaining calories
  const carbsCal = tdee - (proteinCal + fatCal);
  const carbs = Math.max(50, Math.round(carbsCal / 4));

  // Determine meal recipes based on preference and conditions
  const isVeg = dietData.preference === 'Veg' || dietData.preference === 'Vegan';
  const conds = (dietData.conditions || '').toLowerCase();
  
  // Custom meal modifiers based on conditions
  const dietModifier = conds.includes('diabet') ? "Low-Glycemic" : conds.includes('hyper') ? "Low-Sodium" : "";
  
  let meals = {
    breakfast: {
      title: isVeg ? `${dietModifier} Oats with Berries & Almonds` : `${dietModifier} Scrambled Eggs & Avocado Toast`,
      calories: Math.round(tdee * 0.25),
      ingredients: isVeg ? "Rolled oats, almond milk, organic berries, crushed almonds" : "3 egg whites, whole grain bread, half avocado, cherry tomatoes",
      instructions: "Combine oats and cook in milk, topping with berries. For non-veg, toast bread, spread avocado and serve with eggs."
    },
    lunch: {
      title: isVeg ? `${dietModifier} Tofu & Quinoa Power Bowl` : `${dietModifier} Grilled Chicken & Brown Rice Bowl`,
      calories: Math.round(tdee * 0.35),
      ingredients: isVeg ? "Firm tofu, quinoa, broccoli, spinach, olive oil dressing" : "Lean chicken breast, brown rice, steamed broccoli, olive oil",
      instructions: "Boil quinoa or rice. Pan-sear protein in olive oil. Steam greens and mix together with light herbs."
    },
    dinner: {
      title: isVeg ? `${dietModifier} Lentil Soup & Sweet Potato` : `${dietModifier} Baked Salmon & Steamed Asparagus`,
      calories: Math.round(tdee * 0.30),
      ingredients: isVeg ? "Brown lentils, sweet potato, kale, garlic, olive oil" : "Fresh salmon fillet, asparagus spears, wild rice, lemon slice",
      instructions: "Simmer lentils or bake salmon at 380°F (190°C) for 15 minutes. Serve with a wild rice side."
    },
    snacks: {
      title: "Mixed Seed Pack & Green Tea",
      calories: Math.round(tdee * 0.10),
      ingredients: "Pumpkin seeds, sunflower seeds, sugar-free organic green tea",
      instructions: "Steep green tea sachet for 3 minutes. Enjoy with a handful of raw mixed seeds."
    }
  };

  return {
    calorieTarget: tdee,
    macros: { protein, carbs, fat },
    meals,
    tips: [
      `Maintain a water intake of at least 3 liters daily to support your calculated BMR of ${Math.round(bmr)} kcal.`,
      conds.includes('diabet') ? "Prioritize complex carbs and avoid simple sugars to regulate glucose." : "Eat at regular intervals to maintain steady metabolism levels.",
      `This customized plan is specifically computed for a ${dietData.age}-year-old ${dietData.gender.toLowerCase()} matching a BMI of ${dietData.bmi}.`
    ]
  };
};

/**
 * AI Multimodal Chatbot response generator
 */
export const generateMultimodalChatResponse = async (history, prompt, fileBase64 = null, mimeType = null) => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const systemInstruction = `You are MediChat, an advanced clinical AI assistant. 
      Answer patient questions clearly, professionally, and concisely. 
      You can explain medical reports, prescriptions, symptoms, diseases, diet, and general health questions.
      Always maintain a supportive tone. 
      If explaining an uploaded prescription or report, identify the key readings, medications, or conclusions and explain them in simple terms.
      Always include a brief disclaimer at the end of serious answers advising consulting a doctor.`;

      let parts = [{ text: prompt }];
      
      if (fileBase64 && mimeType) {
        parts.unshift({
          inlineData: {
            data: fileBase64,
            mimeType: mimeType
          }
        });
      }

      const result = await model.generateContent([systemInstruction, ...parts]);
      return result.response.text();
    } catch (err) {
      console.error('Gemini multimodal chat error:', err);
    }
  }

  // --- Dynamic Mock Response ---
  await sleep(1500);
  const p = (prompt || '').toLowerCase();
  
  if (fileBase64) {
    return `### 📄 Medical Document Analysis Summary
    
I have processed the uploaded clinical document. Based on the OCR scan:
- **Detected Document Type**: Patient Lab Report / Prescription.
- **Key Readings**: The document contains clinical references, chemical levels, and drug prescriptions.
- **Medical Summary**: 
  * Standard hematology and metabolic markers appear within reference boundaries.
  * If this is a prescription, take dosages exactly as directed by your physician.
- **Clinical Recommendation**: Focus on a balanced diet and log any related symptoms in the **Symptom Checker** or locate nearby clinics via the **Hospital Finder** tab.

*Disclaimer: This analysis is an AI simulation. Always verify readings with your primary healthcare provider.*`;
  }
  
  if (p.includes('chest pain') || p.includes('heart attack') || p.includes('breathing problem') || p.includes('shortness of breath') || p.includes('breathing difficulty')) {
    return `### 🚨 EMERGENCY CLINICAL WARNING
    
You have mentioned symptoms associated with potential **cardiovascular or respiratory distress** (such as chest pain or breathing issues).
    
- **Urgent Action Required**: Please seek immediate medical attention or call emergency services (like an ambulance) without delay.
- **Emergency SOS**: You can trigger the **Emergency SOS** tab in your sidebar to notify your saved emergency contacts and dispatch help.
- **Do Not Wait**: Cardiovascular symptoms can escalate rapidly. Do not attempt to drive yourself to the clinic; wait for professional medical transport.

*Disclaimer: This is automated clinical guidance. Always prioritize native emergency response services.*`;
  }
  
  if (p.includes('sugar') || p.includes('diabet') || p.includes('hba1c') || p.includes('insulin')) {
    return `### 🩸 Diabetes & Blood Glucose Information
    
**Diabetes Mellitus** is a metabolic condition characterized by high blood glucose levels resulting from defects in insulin secretion, action, or both.
    
- **HbA1c Reference Ranges**:
  * **Normal**: Below 5.7%
  * **Prediabetes**: 5.7% to 6.4%
  * **Diabetes**: 6.5% or higher
- **Key Lifestyle Management Tips**:
  * **Dietary**: Focus on a low-glycemic index (GI) diet rich in complex fiber (oats, legumes, greens) to avoid sudden insulin spikes.
  * **Hydration**: Drink plenty of water to assist the kidneys in flushing excess glucose.
  * **Physical Activity**: Regular aerobic exercise helps muscle cells absorb glucose directly from the bloodstream.
- **Common Medications**: Metformin, Sulfonylureas, and Insulin therapy.

*Disclaimer: This is general educational info. Consult your endocrinologist for custom glycemic targets.*`;
  }
  
  if (p.includes('blood pressure') || p.includes('hypertension') || p.includes('bp') || p.includes('hyper')) {
    return `### 🫀 Hypertension & Cardiovascular Wellness
    
**Hypertension** (High Blood Pressure) occurs when the force of blood pushing against your artery walls is consistently too high.
    
- **Blood Pressure Classifications**:
  * **Normal**: Below 120/80 mmHg
  * **Elevated**: Systolic 120-129 mmHg and Diastolic below 80 mmHg
  * **Stage 1 Hypertension**: Systolic 130-139 mmHg or Diastolic 80-89 mmHg
  * **Stage 2 Hypertension**: Systolic 140+ mmHg or Diastolic 90+ mmHg
- **Management Guidelines (DASH Diet)**:
  * **Reduce Sodium**: Keep daily sodium intake below 1,500 - 2,000 mg.
  * **Increase Potassium**: Consume bananas, spinach, and sweet potatoes to help relax blood vessel walls.
  * **Avoid Stimulants**: Limit caffeine and avoid nicotine which restrict arterial blood flow.

*Disclaimer: Monitor your blood pressure regularly and consult a cardiologist before altering medications.*`;
  }
  
  if (p.includes('thyroid') || p.includes('tsh') || p.includes('thyroxine')) {
    return `### 🦋 Thyroid Function & Endocrine Health
    
The thyroid gland regulates your body's metabolism by releasing thyroid hormones (T3 and T4).
    
- **Common Dysfunctions**:
  * **Hypothyroidism (Underactive)**: High TSH, low T4. Symptoms include fatigue, weight gain, and cold sensitivity. Treated with Levothyroxine.
  * **Hyperthyroidism (Overactive)**: Low TSH, high T4. Symptoms include weight loss, rapid heartbeat, and anxiety.
- **Nutritional Considerations**:
  * Ensure adequate intake of Iodine and Selenium.
  * Avoid consuming raw cruciferous vegetables (broccoli, cabbage) in large quantities as they can interfere with iodine uptake.

*Disclaimer: Thyroid levels should be checked via a venous blood test (Thyroid Panel). Consult your physician.*`;
  }

  if (p.includes('fever') || p.includes('cold') || p.includes('cough') || p.includes('flu') || p.includes('headache') || p.includes('symptom') || p.includes('pain')) {
    return `### 🤒 Managing Fever, Cold, & Flu Symptoms
    
Fever and cough are natural defense mechanisms used by your immune system to combat viral or bacterial infections.
    
- **Standard Home Care Recommendations**:
  * **Hydration**: Drink warm water, herbal teas, or broths to replace lost fluids and soothe your throat.
  * **Rest**: Prioritize sleep to allow your body's immune response to repair cells.
  * **Temperature Control**: Use cool, damp cloths on your forehead to reduce fever discomfort.
- **When to Seek Immediate Medical Help**:
  * A fever exceeding 103°F (39.4°C) that does not respond to medication.
  * Accompanying symptoms like breathing difficulty, stiff neck, or confusion.

*Disclaimer: Use over-the-counter fever reducers (like paracetamol) strictly according to packaging limits.*`;
  }

  if (p.includes('medicine') || p.includes('drug') || p.includes('tablet') || p.includes('pill') || p.includes('dose') || p.includes('prescrip')) {
    return `### 💊 General Pharmacological Guidelines
    
Safe medication usage is critical to preventing adverse drug interactions and toxicity.
    
- **Essential Drug Safety Tips**:
  * **Consistency**: Take medications at the exact times prescribed (e.g. morning, with or after food).
  * **Avoid Self-Medication**: Never take antibiotics without a physician's prescription; this prevents antibiotic resistance.
  * **Monitor Interactions**: Avoid consuming alcohol or certain foods (like grapefruit juice) which can alter drug absorption.
- **Common Medications**: 
  * *Analgesics*: Paracetamol (pain/fever), Ibuprofen (anti-inflammatory).
  * *Anti-diabetics*: Metformin.
  * *Cardiovascular*: Amlodipine, Atorvastatin.

*Disclaimer: Always review the leaflet inside your medication package and consult a pharmacist.*`;
  }

  if (p.includes('diet') || p.includes('eat') || p.includes('food') || p.includes('nutrition') || p.includes('veg') || p.includes('vegan')) {
    return `### 🥗 Clinical Nutrition & Meal Planning
    
A balanced nutritional diet is key to preventing chronic diseases and maintaining cellular energy.
    
- **Core Dietary Recommendations**:
  * **Fiber Intake**: Prioritize whole grains, beans, and fresh greens.
  * **Protein Distribution**: Spread protein intake evenly throughout the day (e.g., tofu, lentils, eggs, lean meats).
  * **Healthy Fats**: Opt for monounsaturated and polyunsaturated fats (olive oil, avocados, seeds) instead of trans fats.
- **Diet Tool**: You can use our **AI Diet Planner** tab in the sidebar to automatically calculate your TDEE (Total Daily Energy Expenditure) and generate custom meal schedules based on your preferences!

*Disclaimer: Consult a registered dietitian for medical nutrition therapy.*`;
  }

  // Extract a clean topic name from prompt to customize the default response
  const topics = p.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").split(" ");
  const cleanTopic = topics.length > 2 ? topics.slice(Math.max(0, topics.length - 3)).join(" ") : "your health query";

  return `### 🩺 Information Regarding: "${cleanTopic}"
  
I understand you are asking about **${cleanTopic}**. Here are general clinical insights:
  
- **Overview**: Medical inquiries regarding *${cleanTopic}* are common in primary care. Managing this topic effectively involves tracking active symptoms, physical activity levels, and dietary habits.
- **Best Practices**:
  * Maintain a symptom log detailing when discomfort or fatigue occurs.
  * Focus on low-sodium, nutrient-dense whole foods.
  * Engage in moderate physical exercise (walking, swimming) for 150 minutes per week.
- **Next Steps**:
  * If you are experiencing symptoms, type them into the **Symptom Checker** tab to check risk categories.
  * If you have a physical prescription sheet or blood test printout, click the paperclip icon in this chat to upload it. I will extract the values and explain them to you!
    
*Disclaimer: This information is AI-generated for educational purposes. Consult a physician for personal medical issues.*`;
};

/**
 * AI Multimodal Chatbot response generator for doctors (unrestricted general-purpose)
 */
export const generateDoctorMultimodalChatResponse = async (history, prompt, fileBase64 = null, mimeType = null) => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const systemInstruction = `You are DocAssistant, a professional clinical co-pilot and general-purpose AI assistant for doctors.
      You provide clinical reasoning, explain medical records, draft medical templates, and answer general questions outside of medicine (e.g. coding, writing, research, general knowledge).
      Do NOT write patient disclaimers or restrict your capabilities. Answer directly and professionally.`;

      let parts = [{ text: prompt }];
      
      if (fileBase64 && mimeType) {
        parts.unshift({
          inlineData: {
            data: fileBase64,
            mimeType: mimeType
          }
        });
      }

      const result = await model.generateContent([systemInstruction, ...parts]);
      return result.response.text();
    } catch (err) {
      console.error('Gemini doctor multimodal chat error:', err);
    }
  }

  // --- Dynamic Doctor Mock Fallback ---
  await sleep(1200);
  const p = (prompt || '').toLowerCase();

  if (p.includes('referral') || p.includes('letter')) {
    return `### 📄 Drafted Clinical Referral Letter

**Date**: ${new Date().toLocaleDateString()}  
**To**: Department of Cardiology  
**Re**: Referral for Comprehensive Cardiovascular Evaluation  

Dear Colleague,  

I am writing to refer patient **John Doe** for a comprehensive cardiovascular assessment. The patient presented with borderline glycemia and elevated LDL cholesterol levels during their recent consultation. Given their family history of ischemic heart disease, I recommend a treadmill stress test and echocardiogram evaluation.  

A summary of their diagnostic data is attached to their profile. Thank you for co-managing this patient.  

Sincerely,  
*Dr. MediCare-AI Clinical Co-Pilot*`;
  }

  if (p.includes('sglt2') || p.includes('inhibitor') || p.includes('mechanism') || p.includes('pharmacology')) {
    return `### 💊 SGLT2 Inhibitors Mechanism of Action

**Sodium-Glucose Cotransporter 2 (SGLT2) Inhibitors** (e.g., Empagliflozin, Dapagliflozin) operate via a insulin-independent mechanism:

1. **Renal Glucose Reabsorption Inhibition**: SGLT2 is located in the early S1 segment of the proximal renal tubule and is responsible for ~90% of glomerular glucose filtration reabsorption.
2. **Glucosuria Induction**: By blocking SGLT2, these drugs decrease renal threshold for glucose, causing excretion of ~70-80g of glucose daily in the urine, thereby lowering HbA1c.
3. **Cardiorenal Benefits**: Induced osmotic diuresis and natriuresis lead to blood pressure reduction, decrease in cardiac preload/afterload, and protection against heart failure hospitalizations.`;
  }

  if (p.includes('python') || p.includes('script') || p.includes('code') || p.includes('sort')) {
    return `### 💻 Python Patient Sorting Script

Here is a Python script to sort patient follow-up priority logs based on risk level and date:

\`\`\`python
import heapq

# Priority queue configuration
class PatientPriority:
    def __init__(self, name, risk_level, days_since_visit):
        self.name = name
        # Map risk levels to numbers (lower = higher priority)
        risk_map = {'critical': 1, 'high': 2, 'moderate': 3, 'low': 4}
        self.priority = risk_map.get(risk_level.lower(), 5)
        self.days = days_since_visit

    def __lt__(self, other):
        # Sort first by priority, then by days since last visit (descending)
        if self.priority == other.priority:
            return self.days > other.days
        return self.priority < other.priority

# Patient list
patients = [
    PatientPriority("Alice Smith", "moderate", 5),
    PatientPriority("Bob Jones", "critical", 2),
    PatientPriority("Charlie Brown", "low", 12)
]

# Heapify and fetch priorities
heapq.heapify(patients)
print("Patient Follow-Up Priority Queue:")
while patients:
    p = heapq.heappop(patients)
    print(f"- {p.name} (Risk: {p.priority}, Days: {p.days})")
\`\`\``;
  }

  if (p.includes('email') || p.includes('leave') || p.includes('conference')) {
    return `### ✉️ Drafted Leave Request Email

**Subject**: Request for Professional Development Leave - [Conference Name]

Dear Clinical Director,

I am writing to formally request leave from my duties at the clinic from **[Start Date]** to **[End Date]** to attend the upcoming [Conference Name] in [Location]. 

Attending this session will allow me to engage with recent peer-reviewed clinical research and bring back updated guidelines to our primary care team. I have arranged for Dr. [Name] to cover my patient inquiries during this period.

Thank you for your consideration.

Kind regards,  
*Dr. [Your Name]*`;
  }

  if (p.includes('hi') || p.includes('hello') || p.includes('hey') || p.includes('assist')) {
    return `Hello Doctor! I am your unrestricted AI Co-Pilot. I can assist you with:
- Draft clinical referral letters or emails.
- Review drug mechanisms (like SGLT2 inhibitors or statins).
- Write custom Python/Javascript sorting scripts for scheduling.
- Provide general calculations or scheduling outlines.

How can I support your practice today?`;
  }

  return `### 🤖 Co-Pilot Assistant Response

I have processed your query: **"${prompt}"**

As your clinical and general assistant, here are the details:
- **General Support**: DocAssistant can draft logs, sort logs, write scripts, or review clinical notes.
- **Dynamic Task Handling**: You can prompt me to write templates, scripts, or explain chemical markers.
- **Unrestricted Mode**: This response is generated locally in Simulation Mode because the API key is not configured. Add your API keys to see live GPT-4o-mini outputs!`;
};
