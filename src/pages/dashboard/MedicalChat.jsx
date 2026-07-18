import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Paperclip, RefreshCw, MessageSquare, ShieldAlert, Sparkles, 
  User, Calendar, FileText, Brain, MapPin, Check, Plus, AlertCircle, X, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { generateMultimodalChatResponse } from '../../lib/gemini';
import { supabase } from '../../lib/supabase';

const SUGGESTED_PROMPTS = [
  "What are the typical signs of High Blood Pressure?",
  "Can you explain what an HbA1c test measures?",
  "What foods should I avoid with hyperthyroidism?",
  "How much water should I drink daily for active exercise?"
];

export const MedicalChat = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Conversation history persisted in localStorage
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('medi_chat_history');
    return saved ? JSON.parse(saved) : [
      {
        id: "welcome",
        role: "ai",
        text: "Hello! I am MediChat, your clinical AI assistant. You can ask me questions about symptoms, medications, medical conditions, diet, or upload a medical report/prescription for an explanation. How can I help you today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // File Upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState(null);
  const [fileMime, setFileMime] = useState(null);
  const fileInputRef = useRef(null);

  // Save chat history
  useEffect(() => {
    localStorage.setItem('medi_chat_history', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Convert uploaded file to base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error("File size must be less than 4MB.");
      return;
    }

    setSelectedFile(file);
    setFileMime(file.type);

    const reader = new FileReader();
    reader.onloadend = () => {
      // Extract raw base64 string
      const base64String = reader.result.split(',')[1];
      setFileBase64(base64String);
      toast.success(`Attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Send prompt
  const handleSendMessage = async (textToSend = inputText) => {
    if (!textToSend.trim() && !fileBase64) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: textToSend,
      fileName: selectedFile ? selectedFile.name : null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Capture file attachment states and clear inputs
    const tempBase64 = fileBase64;
    const tempMime = fileMime;
    setSelectedFile(null);
    setFileBase64(null);
    setFileMime(null);

    try {
      const historyPayload = messages.map(m => ({ role: m.role, text: m.text }));
      let aiResponseText = '';

      try {
        // 1. Invoke the secure Deno Edge Function (ChatGPT)
        const { data, error } = await supabase.functions.invoke('medical-chat', {
          body: {
            history: historyPayload,
            prompt: textToSend,
            fileBase64: tempBase64,
            fileMime: tempMime
          }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        
        aiResponseText = data.response;
      } catch (edgeError) {
        console.warn("Secure OpenAI Edge Function invocation failed, falling back to local Gemini client:", edgeError);
        
        // Notify user if API key needs configuration
        if (edgeError.message?.includes("API Key is missing")) {
          toast.error("ChatGPT key not configured on backend. Falling back to Gemini...");
        }

        // 2. Fallback to Gemini
        aiResponseText = await generateMultimodalChatResponse(
          historyPayload,
          textToSend,
          tempBase64,
          tempMime
        );
      }

      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: "ai",
        text: aiResponseText || "I'm sorry, I couldn't formulate a response. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch response.");
    } finally {
      setIsTyping(false);
    }
  };

  // Clear chat logs
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your chat history?")) {
      const defaultWelcome = [
        {
          id: "welcome",
          role: "ai",
          text: "Hello! I am MediChat, your clinical AI assistant. You can ask me questions about symptoms, medications, medical conditions, diet, or upload a medical report/prescription for an explanation. How can I help you today?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(defaultWelcome);
      localStorage.setItem('medi_chat_history', JSON.stringify(defaultWelcome));
      toast.success("Chat history cleared.");
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 p-6 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden font-sans shadow-2xl">
      {/* Visual cyber backgrounds */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f2fe05_1px,transparent_1px),linear-gradient(to_bottom,#00f2fe05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="border-b border-white/10 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1 shadow-md">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Advanced Medical LLM
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
              AI Clinical Assistant
            </h1>
            <p className="text-slate-400 text-sm mt-1">Get real-time answers about symptoms, disease targets, and upload reports for summary explanations.</p>
          </div>

          <button 
            onClick={handleClearHistory}
            className="px-4 py-2 bg-slate-900/50 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md text-rose-400 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear History
          </button>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column (Chatbot Box - 65%) */}
          <div className="lg:col-span-8 flex flex-col h-[600px] depth-card bg-slate-900/40 border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl">
            
            {/* Scrollable messages area */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.map((m) => (
                <div 
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-xs font-medium relative shadow-lg ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-indigo-500/30 text-white rounded-tr-none'
                      : 'bg-slate-950/60 border border-white/10 text-slate-300 rounded-tl-none'
                  }`}>
                    {/* User file label */}
                    {m.fileName && (
                      <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-bold mb-2 pb-1.5 border-b border-cyan-500/10">
                        <Paperclip className="w-3 h-3" /> Attached: {m.fileName}
                      </div>
                    )}
                    
                    <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    
                    <span className="text-[9px] text-slate-500 block text-right mt-2 font-mono">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-950/60 border border-white/10 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-1 text-slate-500 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input drawer */}
            <div className="bg-slate-950/60 border-t border-white/10 p-4 space-y-3 shrink-0">
              
              {/* Selected file preview pill */}
              {selectedFile && (
                <div className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-xl text-xs text-cyan-400 font-bold">
                  <span className="flex items-center gap-1.5 truncate">
                    <Paperclip className="w-3.5 h-3.5 shrink-0" /> {selectedFile.name}
                  </span>
                  <button 
                    onClick={() => { setSelectedFile(null); setFileBase64(null); setFileMime(null); }}
                    className="text-slate-400 hover:text-rose-400 cursor-pointer p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Form Input bar */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-slate-900/60 hover:bg-slate-800 border border-white/10 rounded-xl text-slate-400 hover:text-cyan-400 transition cursor-pointer shrink-0"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input 
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <input
                  type="text"
                  placeholder="Ask a health question or upload a clinical file..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                  className="flex-grow bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition"
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={isTyping}
                  className="p-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white rounded-xl transition cursor-pointer shrink-0 shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Disclaimer inside chat */}
              <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-wider justify-center">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>MediChat is an AI support assistant and does not replace official clinical diagnoses.</span>
              </div>

            </div>

          </div>

          {/* Right Column (Suggested Prompts & Shortcuts - 35%) */}
          <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
            
            {/* Suggested prompts list */}
            <div className="depth-card bg-slate-900/40 border border-white/10 rounded-3xl p-6 space-y-4">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" /> Suggested Topics
              </h4>
              <p className="text-slate-500 text-xs font-medium">Click on any question below to submit it automatically to the clinical AI assistant:</p>
              
              <div className="space-y-2.5">
                {SUGGESTED_PROMPTS.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(promptText)}
                    className="w-full text-left p-3.5 bg-slate-950/60 hover:bg-cyan-500/5 border border-white/5 hover:border-cyan-500/20 text-slate-400 hover:text-cyan-400 rounded-xl text-xs font-bold leading-relaxed transition cursor-pointer"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions Portal */}
            <div className="depth-card bg-slate-900/40 border border-white/10 rounded-3xl p-6 space-y-4">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Medical Portals
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => navigate('/dashboard/appointments')}
                  className="p-3 bg-slate-950/60 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 rounded-xl text-center cursor-pointer transition flex flex-col items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-bold text-slate-300">Book Doctor</span>
                </button>
                <button 
                  onClick={() => navigate('/dashboard/report-analyzer')}
                  className="p-3 bg-slate-950/60 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 rounded-xl text-center cursor-pointer transition flex flex-col items-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="text-[10px] font-bold text-slate-300">Report Analyzer</span>
                </button>
                <button 
                  onClick={() => navigate('/dashboard/symptom-checker')}
                  className="p-3 bg-slate-950/60 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 rounded-xl text-center cursor-pointer transition flex flex-col items-center gap-1.5"
                >
                  <Brain className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-bold text-slate-300">Symptom Checker</span>
                </button>
                <button 
                  onClick={() => navigate('/dashboard/hospital-finder')}
                  className="p-3 bg-slate-950/60 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 rounded-xl text-center cursor-pointer transition flex flex-col items-center gap-1.5"
                >
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-bold text-slate-300">Hospitals Near Me</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
