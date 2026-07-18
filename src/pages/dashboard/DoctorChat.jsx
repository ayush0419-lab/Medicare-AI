import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Paperclip, RefreshCw, MessageSquare, ShieldAlert, Sparkles, 
  User, Calendar, FileText, Brain, MapPin, Check, Plus, AlertCircle, X, Trash2,
  Terminal, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { generateDoctorMultimodalChatResponse } from '../../lib/gemini';

const SUGGESTED_PROMPTS = [
  "Draft a clinical referral letter to a cardiologist",
  "Explain the pharmacological mechanism of SGLT2 inhibitors",
  "Write a Python script to sort patient follow-up priority logs",
  "Draft an email request for a professional conference leave"
];

export const DoctorChat = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Conversation history persisted in localStorage specific to doctor co-pilot
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('doctor_chat_history');
    return saved ? JSON.parse(saved) : [
      {
        id: "welcome",
        role: "ai",
        text: "Hello, Dr. Clinical Workspace. I am DocAssistant, your unrestricted AI co-pilot. I can assist you with complex diagnostic reasoning, drug interactions, research reviews, clinical letter drafts, or general queries outside the medicine field (like writing scripts, emails, or notes formatting). How can I assist your workflow today?",
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
    localStorage.setItem('doctor_chat_history', JSON.stringify(messages));
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
      const base64String = reader.result.split(',')[1];
      setFileBase64(base64String);
      toast.success(`Attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Send prompt to secure backend Deno function
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
        const { data, error } = await supabase.functions.invoke('doctor-chat', {
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
        console.warn("Secure ChatGPT Edge Function failed or timed out, falling back to local Gemini client:", edgeError);
        
        // 2. Fallback to Gemini
        aiResponseText = await generateDoctorMultimodalChatResponse(
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
      console.error('Doctor AI Assistant error:', err);
      toast.error("Failed to connect to AI Co-Pilot.");
    } finally {
      setIsTyping(false);
    }
  };

  // Clear chat logs
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your AI Assistant chat logs?")) {
      const defaultWelcome = [
        {
          id: "welcome",
          role: "ai",
          text: "Hello, Dr. Clinical Workspace. I am DocAssistant, your unrestricted AI co-pilot. I can assist you with complex diagnostic reasoning, drug interactions, research reviews, clinical letter drafts, or general queries outside the medicine field (like writing scripts, emails, or notes formatting). How can I assist your workflow today?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(defaultWelcome);
      localStorage.setItem('doctor_chat_history', JSON.stringify(defaultWelcome));
      toast.success("AI Assistant logs cleared.");
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 p-6 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden font-sans shadow-2xl">
      {/* Background radial details */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f2fe05_1px,transparent_1px),linear-gradient(to_bottom,#00f2fe05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Block */}
        <div className="border-b border-white/10 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1 shadow-md animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> ChatGPT Co-Pilot (Unrestricted)
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
              Doctor AI Assistant
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              General-purpose and clinical workspace assistant to query medical journals, draft referral templates, or compose files.
            </p>
          </div>

          <button 
            onClick={handleClearHistory}
            className="px-4 py-2 bg-slate-900/50 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md text-rose-450 shrink-0 self-start sm:self-center"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear History
          </button>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT CHATBOT BLOCK (65%) */}
          <div className="lg:col-span-8 flex flex-col h-[600px] depth-card bg-slate-900/40 border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl">
            
            {/* Messages box */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.map((m) => (
                <div 
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-xs font-medium relative shadow-lg ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600/20 to-purple-650/20 border border-indigo-500/30 text-white rounded-tr-none'
                      : 'bg-slate-950/60 border border-white/10 text-slate-300 rounded-tl-none'
                  }`}>
                    {/* User file label */}
                    {m.fileName && (
                      <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-bold mb-2 pb-1.5 border-b border-cyan-500/10">
                        <Paperclip className="w-3.5 h-3.5" /> Attached: {m.fileName}
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

            {/* Input Form drawer */}
            <div className="bg-slate-950/60 border-t border-white/10 p-4 space-y-3 shrink-0">
              
              {/* Selected file preview */}
              {selectedFile && (
                <div className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-xl text-xs text-cyan-400 font-bold">
                  <span className="flex items-center gap-1.5 truncate">
                    <Paperclip className="w-3.5 h-3.5 shrink-0" /> {selectedFile.name}
                  </span>
                  <button 
                    onClick={() => { setSelectedFile(null); setFileBase64(null); setFileMime(null); }}
                    className="text-slate-400 hover:text-rose-450 cursor-pointer p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Form Bar */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-slate-900/60 hover:bg-slate-800 border border-white/10 rounded-xl text-slate-400 hover:text-indigo-400 transition cursor-pointer shrink-0"
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
                  placeholder="Ask any clinical query, compose templates, write scripts..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                  className="flex-grow bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder:text-slate-650 focus:outline-none focus:border-indigo-500 transition"
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={isTyping}
                  className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl transition cursor-pointer shrink-0 shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Professional disclaimer (Unrestricted co-pilot notice) */}
              <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-wider justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>DocAssistant is configured for professional clinicians. General non-medical queries permitted.</span>
              </div>

            </div>

          </div>

          {/* RIGHT TOPICS SIDEBAR (35%) */}
          <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
            
            {/* Suggested doctor prompts */}
            <div className="depth-card bg-slate-900/40 border border-white/10 rounded-3xl p-6 space-y-4 flex-grow">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" /> Suggested Tasks
              </h4>
              <p className="text-slate-500 text-xs font-medium">
                Click on any clinical or general workflow task below to query DocAssistant instantly:
              </p>
              
              <div className="space-y-3 pt-2">
                {SUGGESTED_PROMPTS.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(promptText)}
                    className="w-full text-left p-3.5 bg-slate-950/60 hover:bg-indigo-500/5 border border-white/5 hover:border-indigo-500/20 text-slate-400 hover:text-indigo-450 rounded-xl text-xs font-bold leading-relaxed transition cursor-pointer"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick overview layout card */}
            <div className="depth-card bg-slate-900/40 border border-white/10 rounded-3xl p-6 space-y-3">
              <h4 className="font-extrabold text-xs text-white uppercase tracking-widest">Co-Pilot Specs</h4>
              <p className="text-[11px] text-slate-450 font-semibold leading-relaxed">
                DocAssistant is powered by ChatGPT gpt-4o-mini. This interface does not inject medical restrictions or disclaimers, allowing unrestricted text generation for doctors.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
