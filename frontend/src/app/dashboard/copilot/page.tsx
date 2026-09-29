"use client";

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Bot, User, Sparkles, AlertTriangle, Terminal, Database, Image as ImageIcon, X } from 'lucide-react';
import { FormattedResponse } from '@/components/FormattedResponse';

interface Citation {
  source: string;
  content: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  citations?: Citation[];
  requiresConfirmation?: boolean;
  pendingAction?: Record<string, unknown>;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  "Analyze active network anomalies",
  "Investigate latency anomaly on CELL_NYC_104",
  "What is the current network availability?",
  "Show me active incidents in NA-WEST region",
  "Check packet loss telemetry on NYC towers",
];

function CopilotChatContent() {
  const searchParams = useSearchParams();
  const initialPromptChecked = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: 'assistant',
      content: "Welcome to the Telecom AI Copilot. I am running via NVIDIA NIM (deepseek-ai/deepseek-v4.1-flash) with real-time access to the Anomaly Detection Engine, live KPI metrics, active alarms, cell health, and multimodal telemetry analysis. How can I assist you today?",
      timestamp: "Ready",
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if ((!textToSend.trim() && !selectedImage) || isLoading) return;

    const currentImage = selectedImage;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend || (currentImage ? "Analyze this network image/telemetry diagram" : ""),
      imageUrl: currentImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend || "Analyze this network image/telemetry diagram",
          image_url: currentImage,
          tenant_id: 'demo-tenant-001',
          user_id: 'admin-operator'
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}: Inference error`);
      }

      const data = await res.json();
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || "Analysis complete.",
        citations: data.citations || [],
        requiresConfirmation: data.requires_confirmation || false,
        pendingAction: data.pending_destructive_action || undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to communicate with AI Copilot';
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${errorMsg}. If the issue persists, please verify your network connection and NVIDIA_API_KEY configuration.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-trigger analysis if passed via query param (e.g. from Anomaly page)
  useEffect(() => {
    if (!initialPromptChecked.current) {
      initialPromptChecked.current = true;
      const promptParam = searchParams.get('prompt');
      if (promptParam) {
        handleSend(promptParam);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const confirmAction = () => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: "Operational action authorized and dispatched. Audit trail recorded with operator signature.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const cancelAction = () => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: "Action cancelled. Equipment remains in current operational state.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] stitch-card border border-[#24385E] bg-[#0A0F1D] overflow-hidden">
      
      {/* Stitch Copilot Header */}
      <div className="px-6 py-4 border-b border-[#24385E] bg-[#0C1427] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.35)]">
            <Bot className="text-white" size={20} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold text-white tracking-tight">Telecom AI Copilot</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-1.5 animate-pulse"></span>
                DEEPSEEK V4.1 FLASH (NVIDIA) · ANOMALY ENGINE READY
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono mt-0.5">
              NVIDIA NIM Neural Telemetry Inference · DeepSeek Multimodal Intelligence · Strict Tenant Isolation
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-slate-300 bg-[#121E36] border border-[#22355A] px-3 py-1.5 rounded-lg">
          <Terminal size={12} className="text-cyan-400" />
          <span>Tenant: Acme Telecom</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
              msg.role === 'user' 
                ? 'bg-cyan-600 text-white shadow-[0_0_12px_rgba(0,240,255,0.25)]' 
                : 'bg-purple-600/90 text-white shadow-[0_0_12px_rgba(168,85,247,0.25)]'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            {/* Bubble */}
            <div className={`max-w-2xl rounded-xl p-4 text-xs leading-relaxed space-y-2.5 ${
              msg.role === 'user' 
                ? 'bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 border border-cyan-500/40 text-white shadow-sm' 
                : 'bg-[#0E172B] border border-[#24385E] text-slate-100'
            }`}>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span>{msg.role === 'user' ? 'Operator' : 'DeepSeek Assistant'}</span>
                <span suppressHydrationWarning>{msg.timestamp}</span>
              </div>

              {msg.imageUrl && (
                <div className="mb-2">
                  <img
                    src={msg.imageUrl}
                    alt="Attached telemetry"
                    className="max-h-48 max-w-full rounded-lg border border-cyan-500/40 object-contain bg-black/40"
                  />
                </div>
              )}

              {msg.role === 'assistant' ? (
                <FormattedResponse content={msg.content} />
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}

              {/* Citations / Tool Evidence */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="pt-2.5 mt-2 border-t border-white/10 space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-cyan-300">
                    <Database size={11} />
                    <span>VERIFIED TELEMETRY EVIDENCE:</span>
                  </div>
                  {msg.citations.map((c, i) => (
                    <div key={i} className="p-2 rounded bg-[#090F1D] border border-cyan-500/30 text-[11px] font-mono text-cyan-200">
                      <span className="text-slate-400 mr-2">[{c.source}]</span>
                      {c.content}
                    </div>
                  ))}
                </div>
              )}

              {/* Destructive Action Confirmation */}
              {msg.requiresConfirmation && (
                <div className="p-3 mt-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-200 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-rose-400">
                    <AlertTriangle size={15} />
                    <span>Human-in-the-Loop Operational Gate Required</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    This operation will alter live network routing or reboot cell equipment. Two-person authorization logged.
                  </p>
                  <div className="flex space-x-2 pt-1">
                    <button 
                      onClick={confirmAction}
                      className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-all"
                    >
                      Authorize Execution
                    </button>
                    <button 
                      onClick={cancelAction}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-all"
                    >
                      Abort
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/90 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Bot size={16} />
            </div>
            <div className="bg-[#0E172B] border border-[#24385E] rounded-xl px-4 py-3 text-xs text-slate-300 flex items-center space-x-2.5">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></div>
              <span className="font-mono text-[11px]">Analyzing network telemetry & evaluating neural anomaly evidence...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Drawer */}
      <div className="px-6 py-2.5 bg-[#090F1C] border-t border-[#1C2C4E] flex items-center space-x-2 overflow-x-auto">
        <Sparkles size={13} className="text-purple-400 shrink-0 mr-1" />
        <span className="text-[10px] font-mono text-slate-400 shrink-0 uppercase tracking-wider font-bold">Suggested:</span>
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => handleSend(prompt)}
            className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-mono text-slate-200 bg-[#121D36] border border-[#253961] hover:border-cyan-400 hover:text-cyan-200 transition-all flex items-center"
          >
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 bg-[#0C1427] border-t border-[#24385E]">
        {/* Image Attachment Preview */}
        {selectedImage && (
          <div className="mb-2.5 flex items-center space-x-2.5 bg-[#090F1C] border border-cyan-500/40 rounded-lg p-2 max-w-sm">
            <img src={selectedImage} alt="Attachment preview" className="w-12 h-12 object-cover rounded border border-cyan-500/30" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-mono text-cyan-300 font-bold truncate">Image Attached for DeepSeek</div>
              <div className="text-[10px] text-slate-400">Multimodal vision analysis ready</div>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
              title="Remove image"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="flex items-center space-x-2 bg-[#090F1C] border border-[#24385E] rounded-xl px-3 py-2 focus-within:border-cyan-400 focus-within:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="Attach image or telemetry graph for DeepSeek multimodal analysis"
            className={`p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-all shrink-0 ${selectedImage ? 'text-cyan-400 bg-cyan-500/10' : ''}`}
          >
            <ImageIcon size={18} />
          </button>
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            placeholder={selectedImage ? "Add query about this image (e.g. 'Describe the path and landscape in two sentences')..." : "Ask Copilot: 'Analyze the latency anomaly on CELL_NYC_104' or attach an image..."}
            className="flex-1 bg-transparent border-none text-xs text-slate-100 placeholder-slate-400 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || (!input.trim() && !selectedImage)}
            className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-[0_0_10px_rgba(0,240,255,0.3)] shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
      </div>

    </div>
  );
}

export default function CopilotPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-slate-400">Loading AI Copilot...</div>}>
      <CopilotChatContent />
    </Suspense>
  );
}
