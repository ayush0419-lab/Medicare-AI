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
