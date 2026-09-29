"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Mail, 
  PhoneCall, 
  TrendingDown, 
  ShieldCheck, 
  CheckCircle, 
  CheckCircle2, 
  Search, 
  RefreshCw, 
  Sparkles, 
  ArrowRight, 
  Bot, 
  Sliders, 
  Flame
} from 'lucide-react';

interface AnalysisResult {
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  intent: 'NETWORK' | 'BILLING' | 'TECHNICAL_SUPPORT' | 'CANCELLATION' | 'ROAMING' | 'RECHARGE';
  frustration: number;
  urgency: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  explanation: string;
}

interface TranscriptItem {
  id: string;
  type: 'CHAT' | 'VOICE_TRANSCRIPT' | 'EMAIL';
  customer: string;
  timestamp: string;
  text: string;
  duration?: string;
  agent?: string;
  analysis: AnalysisResult;
}

const SAMPLE_TRANSCRIPTS: TranscriptItem[] = [
  {
    id: "INT-891",
    type: "CHAT",
    customer: "CUST-1001",
    timestamp: "10 mins ago",
    agent: "Virtual Assistant Tier-1",
    text: "I am very angry and want to cancel my plan immediately! My 5G network is totally dead in Midtown NYC and this is the third time this week.",
    analysis: {
      sentiment: "NEGATIVE",
      intent: "CANCELLATION",
      frustration: 0.88,
      urgency: 0.92,
      severity: "HIGH",
      confidence: 0.94,
      explanation: "Detected high-churn keywords ('cancel', 'dead', 'angry'). Escalated due to repeat network outage complaints on CELL_NYC_104."
    }
  },
  {
    id: "INT-892",
    type: "EMAIL",
    customer: "CUST-9042",
    timestamp: "25 mins ago",
    agent: "Billing Desk",
    text: "Can you please explain why my enterprise invoice is $4,500 higher this month? I see duplicated charges and do not understand the international roaming line item.",
    analysis: {
      sentiment: "NEUTRAL",
      intent: "BILLING",
      frustration: 0.35,
      urgency: 0.50,
      severity: "MEDIUM",
      confidence: 0.89,
      explanation: "Customer inquiries regarding billing variance. Emotion is professional with mild concern; flagged for invoice review."
    }
  },
  {
    id: "INT-893",
    type: "VOICE_TRANSCRIPT",
    customer: "CUST-4029",
    timestamp: "42 mins ago",
    duration: "4m 12s",
    agent: "NOC Tier-2 (Voice STT)",
    text: "Caller states their home fiber gateway shows red alarm LED. Download speeds dropped from 1Gbps to 2Mbps. Requires technician dispatch today.",
    analysis: {
      sentiment: "NEGATIVE",
      intent: "TECHNICAL_SUPPORT",
      frustration: 0.65,
      urgency: 0.78,
      severity: "HIGH",
      confidence: 0.91,
      explanation: "Hardware telemetry confirmation required for optical loss on ONT unit. Urgency elevated due to complete service degradation."
    }
  },
  {
    id: "INT-894",
    type: "CHAT",
    customer: "CUST-5510",
    timestamp: "1 hour ago",
    agent: "Self-Service Bot",
    text: "Traveling abroad to Frankfurt tomorrow morning. Need to activate the global roaming package and verify eSIM profile is configured.",
    analysis: {
      sentiment: "POSITIVE",
      intent: "ROAMING",
      frustration: 0.05,
      urgency: 0.40,
      severity: "LOW",
      confidence: 0.97,
      explanation: "Standard proactive service activation. Positive customer tone with low friction likelihood."
    }
  }
];

export default function ConversationIntelligencePage() {
  const [transcripts] = useState<TranscriptItem[]>(SAMPLE_TRANSCRIPTS);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [notification, setNotification] = useState<string | null>(null);

  // Live NLP Sandbox State
  const [testText, setTestText] = useState("");
  const [isInferring, setIsInferring] = useState(false);
  const [testResult, setTestResult] = useState<AnalysisResult | null>(null);

  const analytics = {
    totalInteractions: 14205,
    averageSentiment: -0.15,
    topIntents: [
      { name: 'NETWORK ISSUES', count: 5120, pct: '36%', color: 'bg-rose-500' },
      { name: 'BILLING & CHARGES', count: 3200, pct: '22%', color: 'bg-amber-500' },
      { name: 'TECH SUPPORT', count: 2100, pct: '14%', color: 'bg-cyan-500' },
      { name: 'CHURN / CANCEL', count: 1850, pct: '13%', color: 'bg-purple-500' },
      { name: 'ROAMING & SIM', count: 1280, pct: '9%', color: 'bg-emerald-500' },
      { name: 'RECHARGE & TOP-UP', count: 655, pct: '6%', color: 'bg-blue-500' },
    ],
    highUrgencyCount: 1420
  };

  const handleRunTestInference = () => {
    if (!testText.trim()) return;
    setIsInferring(true);
    setTimeout(() => {
      const lower = testText.toLowerCase();
      const isNeg = lower.includes('cancel') || lower.includes('angry') || lower.includes('dead') || lower.includes('bad') || lower.includes('worst') || lower.includes('fail') || lower.includes('terrible');
      const isUrgent = lower.includes('immediately') || lower.includes('asap') || lower.includes('now') || lower.includes('urgent') || lower.includes('today');
      
      let detectedIntent: AnalysisResult['intent'] = 'NETWORK';
      if (lower.includes('bill') || lower.includes('charge') || lower.includes('invoice') || lower.includes('cost')) detectedIntent = 'BILLING';
      else if (lower.includes('cancel') || lower.includes('leave') || lower.includes('disconnect')) detectedIntent = 'CANCELLATION';
      else if (lower.includes('roam') || lower.includes('travel') || lower.includes('abroad')) detectedIntent = 'ROAMING';
      else if (lower.includes('support') || lower.includes('router') || lower.includes('ont') || lower.includes('tech')) detectedIntent = 'TECHNICAL_SUPPORT';
      else if (lower.includes('topup') || lower.includes('recharge') || lower.includes('balance')) detectedIntent = 'RECHARGE';

      const result: AnalysisResult = {
        sentiment: isNeg ? 'NEGATIVE' : lower.includes('thank') || lower.includes('great') ? 'POSITIVE' : 'NEUTRAL',
        intent: detectedIntent,
        frustration: isNeg ? 0.85 : 0.15,
        urgency: isUrgent ? 0.90 : 0.35,
        severity: isNeg && isUrgent ? 'HIGH' : isNeg ? 'MEDIUM' : 'LOW',
        confidence: 0.92,
        explanation: `Model identified intent as ${detectedIntent}. ${isNeg ? 'Detected negative emotional sentiment.' : 'Neutral or inquiry-based tone.'} ${isUrgent ? 'Flagged high priority turnaround SLA.' : ''}`
      };

      setTestResult(result);
      setIsInferring(false);
    }, 450);
  };

  const handleAction = (id: string, actionMsg: string) => {
    setNotification(actionMsg);
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredTranscripts = transcripts.filter(t => {
    const matchesSearch = t.customer.toLowerCase().includes(search.toLowerCase()) ||
      t.text.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.analysis.intent.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'HIGH_URGENCY') return t.analysis.severity === 'HIGH';
    if (selectedFilter === 'NEGATIVE') return t.analysis.sentiment === 'NEGATIVE';
    if (selectedFilter === 'CANCELLATION') return t.analysis.intent === 'CANCELLATION';
    if (selectedFilter === 'NETWORK') return t.analysis.intent === 'NETWORK';
    if (selectedFilter === 'VOICE') return t.type === 'VOICE_TRANSCRIPT';

    return true;
  });

  const getSentimentBadge = (sentiment: AnalysisResult['sentiment']) => {
    switch (sentiment) {
      case 'POSITIVE':
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case 'NEGATIVE':
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      default:
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
    }
  };

  const getIntentBadge = (intent: AnalysisResult['intent']) => {
    switch (intent) {
      case 'CANCELLATION':
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case 'NETWORK':
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case 'BILLING':
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case 'TECHNICAL_SUPPORT':
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      case 'ROAMING':
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      default:
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Stitch AI Header */}
      <div className="stitch-card p-6 border border-[#24385E] bg-gradient-to-r from-[#111A2E] via-[#15233E] to-[#0E172A] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-cyan-400 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-bold tracking-wider uppercase">NLP OMNICHANNEL TELEMETRY & CONVERSATION AI</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <MessageSquare className="mr-2.5 text-cyan-400" size={26} />
            Conversation Intelligence & Sentiment
          </h1>
          <p className="text-xs text-slate-300 font-mono mt-1">
            Real-time NLP sentiment extraction, customer churn risk mitigation, and omnichannel speech-to-text analytics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/copilot?prompt=Analyze recent customer sentiment trends and high-urgency churn risk interactions across NYC towers"
            className="bg-[#15233E] hover:bg-[#1C2F52] border border-cyan-500/40 text-cyan-300 px-4 py-2 rounded-lg font-bold text-xs flex items-center transition-all font-mono shadow-sm"
          >
            <Bot size={15} className="mr-1.5 text-cyan-400" /> Analyze in Copilot
          </Link>
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>LIVE INGESTION ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 px-4 py-2.5 rounded-lg text-xs font-mono flex items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white text-xs font-bold ml-4">✕</button>
        </div>
      )}

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Volume */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <MessageSquare size={14} className="mr-1.5 text-cyan-400" /> 24h Interaction Volume
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
              +8.4%
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-white mt-2">
            {analytics.totalInteractions.toLocaleString()}
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
            68% Chat · 22% Voice · 10% Email
          </p>
        </div>

        {/* Avg Sentiment */}
        <div className="stitch-card p-5 border border-rose-500/40 bg-gradient-to-br from-[#1C1424] to-[#111A2E] rounded-xl shadow-[0_4px_20px_rgba(244,63,94,0.08)]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider font-mono flex items-center">
              <TrendingDown size={14} className="mr-1.5 text-rose-400" /> Net Sentiment Score
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
              SKEW NEGATIVE
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-rose-300 mt-2">
            {analytics.averageSentiment} <span className="text-xs font-normal text-slate-400">(-1.0 to +1.0)</span>
          </p>
          <div className="w-full bg-[#1A2640] rounded-full h-1.5 mt-2 overflow-hidden flex">
            <div className="bg-rose-500 h-1.5" style={{ width: '42%' }}></div>
            <div className="bg-slate-600 h-1.5" style={{ width: '35%' }}></div>
            <div className="bg-emerald-500 h-1.5" style={{ width: '23%' }}></div>
          </div>
        </div>

        {/* High Urgency */}
        <div className="stitch-card p-5 border border-amber-500/40 bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center">
              <Flame size={14} className="mr-1.5 text-amber-400" /> High Urgency / Churn Risk
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              PRIORITY SLA
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-amber-300 mt-2">
            {analytics.highUrgencyCount.toLocaleString()} <span className="text-xs font-normal text-slate-400">tickets</span>
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
            Target SLA resolution &lt; 30 minutes
          </p>
        </div>

        {/* NLP Model Assurance */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <ShieldCheck size={14} className="mr-1.5 text-emerald-400" /> NLP Engine Assurance
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              VERIFIED
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-emerald-300 mt-2">
            96.4%
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
            v1.0-sentiment-classifier · Zero Hallucination
          </p>
        </div>

      </div>

      {/* Main Grid: Left Matrix & Tester, Right Live Transcripts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 cols): Intent Breakdown & Interactive Sandbox */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Intent Distribution Matrix */}
          <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center">
                <Sliders size={15} className="mr-2 text-cyan-400" /> Intent Classification Distribution
              </h2>
              <span className="text-[10px] font-mono text-slate-400">Live 24h Aggregation</span>
            </div>

            <div className="space-y-3.5">
              {analytics.topIntents.map((intent, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-bold text-slate-200">{intent.name}</span>
                    <span className="text-slate-400">
                      {intent.count.toLocaleString()} <span className="text-cyan-400 font-bold">({intent.pct})</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#182643] rounded-full h-2 overflow-hidden">
                    <div className={`${intent.color} h-2 rounded-full transition-all duration-500`} style={{ width: intent.pct }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-Time NLP Sandbox */}
          <div className="stitch-card p-5 border border-cyan-500/40 bg-gradient-to-br from-[#102038] to-[#0E172B] rounded-xl shadow-[0_4px_20px_rgba(6,182,212,0.1)]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center">
                <Sparkles size={15} className="mr-2 text-cyan-400" /> Interactive NLP Inference Console
              </h2>
              <span className="text-[10px] font-mono text-cyan-400/80">RoBERTa & Intent Engine</span>
            </div>
            
            <p className="text-xs text-slate-300 font-mono mb-3">
              Test customer interaction phrases in real time to inspect sentiment classification, frustration score, and SLA urgency:
            </p>

            <div className="space-y-3">
              <textarea
                rows={3}
                placeholder="Type customer message or sample phrase (e.g. 'I am furious! My fiber internet is down, cancel my subscription right now!')..."
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full bg-[#090F1D] border border-[#253961] focus:border-cyan-400 rounded-lg p-3 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none transition-all resize-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => setTestText("I want to cancel my 5G contract immediately, connection has been completely dead!")}
                    className="text-[10px] font-mono bg-[#15233E] hover:bg-[#1E335A] text-slate-300 px-2 py-1 rounded border border-[#253961] transition-all"
                  >
                    Sample: Churn
                  </button>
                  <button
                    onClick={() => setTestText("Why did my billing spike by $120 after traveling to London?")}
                    className="text-[10px] font-mono bg-[#15233E] hover:bg-[#1E335A] text-slate-300 px-2 py-1 rounded border border-[#253961] transition-all"
                  >
                    Sample: Roaming
                  </button>
                </div>

                <button
                  onClick={handleRunTestInference}
                  disabled={isInferring || !testText.trim()}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center font-mono shadow-sm transition-all cursor-pointer"
                >
                  <RefreshCw size={13} className={`mr-1.5 ${isInferring ? 'animate-spin' : ''}`} />
                  {isInferring ? "Classifying..." : "Run NLP Inference"}
                </button>
              </div>

              {/* Inference Result Output */}
              {testResult && (
                <div className="bg-[#090F1D] border border-cyan-500/30 rounded-lg p-3.5 mt-3 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSentimentBadge(testResult.sentiment)}`}>
                        {testResult.sentiment}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getIntentBadge(testResult.intent)}`}>
                        INTENT: {testResult.intent}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {(testResult.confidence * 100).toFixed(0)}% Conf
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="bg-[#121B30] p-2 rounded border border-[#253961]">
                      <span className="text-[10px] text-slate-400 block">Frustration</span>
                      <span className="font-bold text-amber-300">{testResult.frustration.toFixed(2)}</span>
                    </div>
                    <div className="bg-[#121B30] p-2 rounded border border-[#253961]">
                      <span className="text-[10px] text-slate-400 block">Urgency</span>
                      <span className="font-bold text-rose-300">{testResult.urgency.toFixed(2)}</span>
                    </div>
                    <div className="bg-[#121B30] p-2 rounded border border-[#253961]">
                      <span className="text-[10px] text-slate-400 block">Severity</span>
                      <span className={`font-bold ${testResult.severity === 'HIGH' ? 'text-rose-400' : 'text-slate-200'}`}>
                        {testResult.severity}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] font-mono text-slate-300 border-t border-[#22355A] pt-2">
                    <span className="text-cyan-400 font-bold mr-1">[AI_EXPLANATION]:</span>
                    {testResult.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (7 cols): Omnichannel Live Transcript Stream */}
        <div className="lg:col-span-7 stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl flex flex-col h-[780px] overflow-hidden">
          
          {/* Search & Filter Header */}
          <div className="p-4 border-b border-[#1E2E4E] bg-[#0E172B] space-y-3">
            <div className="flex items-center">
              <Search size={15} className="text-slate-400 mr-2 shrink-0" />
              <input 
                type="text" 
                placeholder="Search transcripts by customer ID, keywords, or intent..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-xs text-slate-100 placeholder-slate-400 w-full font-mono" 
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-slate-400 hover:text-white text-xs font-mono">
                  Clear
                </button>
              )}
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[10px] font-mono">
              {[
                { label: "All Omnichannel", val: "ALL" },
                { label: "High Urgency", val: "HIGH_URGENCY" },
                { label: "Negative", val: "NEGATIVE" },
                { label: "Cancellation", val: "CANCELLATION" },
                { label: "Network Outages", val: "NETWORK" },
                { label: "Voice Calls", val: "VOICE" }
              ].map(tab => (
                <button
                  key={tab.val}
                  onClick={() => setSelectedFilter(tab.val)}
                  className={`px-2.5 py-1 rounded transition-all whitespace-nowrap ${
                    selectedFilter === tab.val 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold' 
                      : 'bg-[#15233E] text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transcripts List */}
          <div className="overflow-y-auto flex-1 p-4 space-y-4 divide-y divide-[#182643]/60">
            {filteredTranscripts.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-slate-400">
                No customer interactions match the selected filter criteria.
              </div>
            ) : (
              filteredTranscripts.map((t) => (
                <div key={t.id} className="pt-4 first:pt-0 space-y-3">
                  
                  {/* Top Meta Line */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#14203A] border border-[#253961] text-slate-300 flex items-center">
                        {t.type === 'CHAT' ? <MessageSquare size={12} className="mr-1 text-cyan-400" /> : t.type === 'EMAIL' ? <Mail size={12} className="mr-1 text-amber-400" /> : <PhoneCall size={12} className="mr-1 text-emerald-400" />}
                        {t.type.replace('_', ' ')}
                      </span>

                      <Link 
                        href={`/dashboard/customers/${t.customer}`}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all"
                      >
                        {t.customer}
                      </Link>

                      <span className="text-[10px] font-mono text-slate-400">{t.id} · {t.timestamp}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSentimentBadge(t.analysis.sentiment)}`}>
                        {t.analysis.sentiment}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getIntentBadge(t.analysis.intent)}`}>
                        {t.analysis.intent}
                      </span>
                    </div>
                  </div>

                  {/* Customer Quote Box */}
                  <div className="bg-[#14203A] border border-[#253961] p-3.5 rounded-lg">
                    <p className="text-xs text-slate-100 font-mono font-medium leading-relaxed italic">
                      &quot;{t.text}&quot;
                    </p>
                    {t.agent && (
                      <p className="text-[10px] font-mono text-slate-400 mt-2">
                        Routed to: <span className="text-slate-300 font-bold">{t.agent}</span> {t.duration && `· Call duration: ${t.duration}`}
                      </p>
                    )}
                  </div>

                  {/* 4 Quantitative NLP Scores */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-[#15233E] border border-[#253961] p-2.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Frustration</span>
                      <span className="font-mono text-xs font-bold text-amber-300">{t.analysis.frustration}</span>
                    </div>
                    <div className="bg-[#15233E] border border-[#253961] p-2.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Urgency Index</span>
                      <span className="font-mono text-xs font-bold text-rose-300">{t.analysis.urgency}</span>
                    </div>
                    <div className="bg-[#15233E] border border-[#253961] p-2.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Severity</span>
                      <span className={`font-mono text-xs font-bold ${t.analysis.severity === 'HIGH' ? 'text-rose-400' : 'text-slate-200'}`}>
                        {t.analysis.severity}
                      </span>
                    </div>
                    <div className="bg-[#15233E] border border-[#253961] p-2.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">AI Confidence</span>
                      <span className="font-mono text-xs font-bold text-emerald-400 flex items-center">
                        {(t.analysis.confidence * 100).toFixed(0)}% <CheckCircle size={12} className="ml-1 text-emerald-400" />
                      </span>
                    </div>
                  </div>

                  {/* Explainable AI Trace */}
                  <div className="bg-[#090F1D] border border-cyan-500/25 p-3 rounded-lg text-xs font-mono text-cyan-200 space-y-1">
                    <p className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center">
                      <Sparkles size={12} className="mr-1 text-cyan-400" /> Explainable NLP Attribution (Zero Hallucination)
                    </p>
                    <p className="text-[11px] text-slate-300">{t.analysis.explanation}</p>
                  </div>

                  {/* Operator Actions Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-xs">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleAction(t.id, `Escalated ticket ${t.id} to Field NOC tier for ${t.customer}.`)}
                        className="bg-[#182847] hover:bg-[#1E335A] text-slate-300 hover:text-white px-2.5 py-1.5 rounded border border-[#253961] text-[11px] transition-all"
                      >
                        Escalate to NOC
                      </button>
                      <button 
                        onClick={() => handleAction(t.id, `Automated retention discount offer queued for ${t.customer}.`)}
                        className="bg-[#182847] hover:bg-[#1E335A] text-amber-300 px-2.5 py-1.5 rounded border border-amber-500/30 text-[11px] transition-all"
                      >
                        Queue Retention Offer
                      </button>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Link 
                        href={`/dashboard/customers/${t.customer}`}
                        className="text-slate-400 hover:text-cyan-300 text-[11px] transition-all flex items-center"
                      >
                        Customer 360 <ArrowRight size={12} className="ml-1" />
                      </Link>

                      <Link 
                        href={`/dashboard/copilot?prompt=${encodeURIComponent(`Analyze customer ${t.customer} interaction ${t.id} (${t.analysis.intent}): "${t.text}". Sentiment: ${t.analysis.sentiment}, Urgency: ${t.analysis.urgency}. What mitigation or retention steps are recommended?`)}`}
                        className="text-cyan-400 hover:text-cyan-300 text-[11px] font-bold transition-all flex items-center"
                      >
                        Copilot Audit <ArrowRight size={12} className="ml-1" />
                      </Link>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
