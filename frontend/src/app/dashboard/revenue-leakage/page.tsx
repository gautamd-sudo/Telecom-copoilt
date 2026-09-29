"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  ShieldAlert, 
  BarChart2, 
  FileText, 
  CheckCircle, 
  CheckCircle2, 
  Search, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight, 
  SlidersHorizontal,
  Bot,
  RotateCcw,
  TrendingUp,
  XCircle,
  Database
} from 'lucide-react';

interface EvidenceItem {
  desc: string;
  calc: string;
}

interface LeakageCase {
  id: string;
  type: 'UNBILLED_USAGE' | 'DUPLICATE_DISCOUNT' | 'FAILED_CHARGING' | 'ZERO_RATED_LEAK' | 'UNCAPPED_SLICING';
  customer: string;
  impact: number;
  confidence: number;
  status: 'OPEN' | 'INVESTIGATING' | 'RECOVERED' | 'DISMISSED';
  method: 'STATISTICAL' | 'RULE' | 'HYBRID_AI';
  detectedAt: string;
  evidence: EvidenceItem[];
  records: string[];
}

const INITIAL_CASES: LeakageCase[] = [
  {
    id: "LC-2026-01",
    type: "UNBILLED_USAGE",
    customer: "CorpNet Global (B2B)",
    impact: 145000.00,
    confidence: 0.94,
    status: "OPEN",
    method: "STATISTICAL",
    detectedAt: "Today, 14:22 UTC",
    evidence: [
      { 
        desc: "Massive unbilled usage anomaly detected on dedicated SIP trunking gateways.", 
        calc: "Data volume 400TB > 5.2 std_dev from 30-day historical mean of 50TB (z-score: 5.21)." 
      },
      {
        desc: "CDR mediation mismatch between Session Border Controller (SBC-EAST-02) and BSS billing collector.",
        calc: "Unrated CDR count = 1,420,800 events at negotiated rate $0.102/GB."
      }
    ],
    records: ["B-109923", "B-109924", "CDR-SIP-89104", "MED-SBC-4421"]
  },
  {
    id: "LC-2026-02",
    type: "DUPLICATE_DISCOUNT",
    customer: "Acme Corp (Enterprise)",
    impact: 4500.00,
    confidence: 1.0,
    status: "INVESTIGATING",
    method: "RULE",
    detectedAt: "Today, 11:05 UTC",
    evidence: [
      { 
        desc: "Found 2 identical enterprise tier loyalty discounts applied in the same active billing cycle.", 
        calc: "Total discount applied = $9,000.00, Contractual maximum = $4,500.00 (Variance: -$4,500.00)." 
      }
    ],
    records: ["B-88311", "B-88312", "DISC-TIER-04"]
  },
  {
    id: "LC-2026-03",
    type: "FAILED_CHARGING",
    customer: "Consumer Prepaid Segment",
    impact: 850.00,
    confidence: 0.98,
    status: "OPEN",
    method: "RULE",
    detectedAt: "Yesterday, 22:40 UTC",
    evidence: [
      { 
        desc: "Failed Online Charging System (OCS) diameter reservation events across 40 prepaid accounts.", 
        calc: "Lost uncollected revenue = sum(failed_transactions) across Gateway PGW-LON-02." 
      }
    ],
    records: ["Batch-9942", "OCS-FAIL-104", "DIAM-RET-09"]
  },
  {
    id: "LC-2026-04",
    type: "ZERO_RATED_LEAK",
    customer: "Apex Cloud Interconnect",
    impact: 82400.00,
    confidence: 0.91,
    status: "OPEN",
    method: "HYBRID_AI",
    detectedAt: "Sep 23, 18:15 UTC",
    evidence: [
      { 
        desc: "Zero-rated peering interconnect port observed transmitting transit commercial internet traffic.", 
        calc: "Transmitted volume 824TB billed at $0.00/GB instead of interconnect transit rate $0.10/GB." 
      }
    ],
    records: ["IXP-PORT-04", "B-49201", "PEER-APEX-01"]
  },
  {
    id: "LC-2026-05",
    type: "UNCAPPED_SLICING",
    customer: "Metro Autonomous Fleet (5G-SA)",
    impact: 12300.00,
    confidence: 0.89,
    status: "RECOVERED",
    method: "STATISTICAL",
    detectedAt: "Sep 22, 09:30 UTC",
    evidence: [
      { 
        desc: "URLLC Network Slice quota policy failed to throttle after 100TB SLA threshold breach.", 
        calc: "Unmetered premium slice overrun: 41TB at premium QoS tier $300/TB = $12,300.00." 
      }
    ],
    records: ["SLICE-URLLC-09", "UPF-QOS-881", "INV-ADJ-5501"]
  }
];

export default function RevenueLeakagePage() {
  const [cases, setCases] = useState<LeakageCase[]>(INITIAL_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("LC-2026-01");
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Dynamic calculations based on state
  const totalExposed = cases
    .filter(c => c.status === 'OPEN' || c.status === 'INVESTIGATING')
    .reduce((acc, c) => acc + c.impact, 0);

  const openCasesCount = cases.filter(c => c.status === 'OPEN' || c.status === 'INVESTIGATING').length;
  
  const recoveredTotal = cases
    .filter(c => c.status === 'RECOVERED')
    .reduce((acc, c) => acc + c.impact, 0);

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.customer.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === "ALL" || c.type === selectedType;
    return matchesSearch && matchesType;
  });

  const selectedCase = cases.find(c => c.id === selectedCaseId) || filteredCases[0] || null;

  const handleUpdateStatus = (caseId: string, newStatus: LeakageCase['status'], actionText: string) => {
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: newStatus } : c));
    setNotification(actionText);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRunBatchAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setNotification("Batch financial audit complete. 5 CDR streams reconciled, 0 new leaks discovered.");
      setTimeout(() => setNotification(null), 4000);
    }, 1200);
  };

  const getTypeBadge = (type: LeakageCase['type']) => {
    switch (type) {
      case 'UNBILLED_USAGE':
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case 'DUPLICATE_DISCOUNT':
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case 'FAILED_CHARGING':
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case 'ZERO_RATED_LEAK':
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      case 'UNCAPPED_SLICING':
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const getStatusBadge = (status: LeakageCase['status']) => {
    switch (status) {
      case 'OPEN':
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case 'INVESTIGATING':
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case 'RECOVERED':
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case 'DISMISSED':
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Stitch AI Header */}
      <div className="stitch-card p-6 border border-[#24385E] bg-gradient-to-r from-[#111A2E] via-[#15233E] to-[#0E172A] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-cyan-400 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-bold tracking-wider uppercase">FINANCIAL ASSURANCE & REVENUE INTEGRITY</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <DollarSign className="mr-2.5 text-emerald-400" size={26} />
            Revenue Leakage Detection & Recovery
          </h1>
          <p className="text-xs text-slate-300 font-mono mt-1">
            Autonomous CDR mediation audit, unbilled telecom usage reconciliation, and invoice risk assurance.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/copilot?prompt=Audit active revenue leakage cases and summarize root causes for exposed revenue"
            className="bg-[#15233E] hover:bg-[#1C2F52] border border-cyan-500/40 text-cyan-300 px-4 py-2 rounded-lg font-bold text-xs flex items-center transition-all font-mono shadow-sm"
          >
            <Bot size={15} className="mr-1.5 text-cyan-400" /> Audit in Copilot
          </Link>
          <button 
            onClick={handleRunBatchAnalysis}
            disabled={isAnalyzing}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center shadow-[0_0_14px_rgba(16,185,129,0.3)] transition-all font-mono cursor-pointer"
          >
            <RefreshCw size={14} className={`mr-1.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? "Auditing CDR Streams..." : "Run Batch Analysis"}
          </button>
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
        
        {/* Value at Risk */}
        <div className="stitch-card p-5 border border-rose-500/40 bg-gradient-to-br from-[#1B1424] to-[#111A2E] rounded-xl shadow-[0_4px_20px_rgba(244,63,94,0.1)]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider font-mono flex items-center">
              <ShieldAlert size={14} className="mr-1.5 text-rose-400" /> Value At Risk (Open)
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
              CRITICAL
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-rose-300 mt-2">
            ${totalExposed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center space-x-1.5 text-[11px] font-mono text-rose-400/80 mt-1">
            <TrendingUp size={12} />
            <span>Across {openCasesCount} unresolved billing leaks</span>
          </div>
        </div>

        {/* Open Cases */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <AlertTriangle size={14} className="mr-1.5 text-amber-400" /> Active Leakage Cases
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              ACTION REQ
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-white mt-2">
            {openCasesCount} <span className="text-xs font-normal text-slate-400">cases</span>
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
            {cases.filter(c => c.type === 'UNBILLED_USAGE').length} Unbilled · {cases.filter(c => c.type === 'DUPLICATE_DISCOUNT').length} Discount
          </p>
        </div>

        {/* Recovered Revenue */}
        <div className="stitch-card p-5 border border-emerald-500/40 bg-gradient-to-br from-[#0F2224] to-[#111A2E] rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.1)]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider font-mono flex items-center">
              <CheckCircle size={14} className="mr-1.5 text-emerald-400" /> Recovered Revenue (MTD)
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              RECOVERED
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-emerald-300 mt-2">
            ${recoveredTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] font-mono text-emerald-400/80 mt-1">
            Automatic invoice adjustments dispatched
          </p>
        </div>

        {/* Model Precision */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <BarChart2 size={14} className="mr-1.5 text-cyan-400" /> False Positive Rate
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
              95.8% PRECISE
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-cyan-300 mt-2">
            3.8%
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
            Statistical Z-Score + Rule Matcher
          </p>
        </div>

      </div>

      {/* Main Master-Detail Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Cases Queue (5 cols) */}
        <div className="lg:col-span-5 stitch-card border border-[#24385E] bg-[#111A2E] overflow-hidden h-[680px] flex flex-col rounded-xl">
          
          {/* Search & Category Filter */}
          <div className="p-3.5 border-b border-[#1E2E4E] bg-[#0E172B] space-y-2.5">
            <div className="flex items-center">
              <Search size={15} className="text-slate-400 mr-2 shrink-0" />
              <input 
                type="text" 
                placeholder="Search by case ID, customer, or type..." 
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

            {/* Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[10px] font-mono">
              {[
                { label: "All", val: "ALL" },
                { label: "Unbilled", val: "UNBILLED_USAGE" },
                { label: "Discounts", val: "DUPLICATE_DISCOUNT" },
                { label: "Charging", val: "FAILED_CHARGING" },
                { label: "Slicing", val: "UNCAPPED_SLICING" }
              ].map(tab => (
                <button
                  key={tab.val}
                  onClick={() => setSelectedType(tab.val)}
                  className={`px-2 py-1 rounded transition-all whitespace-nowrap ${
                    selectedType === tab.val 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold' 
                      : 'bg-[#15233E] text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cases List */}
          <div className="overflow-y-auto flex-1 divide-y divide-[#182643]">
            {filteredCases.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-400">
                No revenue leakage cases match criteria.
              </div>
            ) : (
              filteredCases.map((c) => {
                const isSelected = selectedCase?.id === c.id;
                return (
                  <div 
                    key={c.id} 
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-[#172746] border-l-4 border-l-cyan-400 text-white shadow-inner' 
                        : 'hover:bg-[#14203A] text-slate-300 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-mono text-xs font-bold text-cyan-400">{c.id}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${getStatusBadge(c.status)}`}>
                          {c.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-baseline mb-1">
                      <p className="font-black text-sm font-mono text-white tracking-tight">
                        ${c.impact.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] font-mono text-slate-400">
                        {(c.confidence * 100).toFixed(0)}% Conf
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border truncate ${getTypeBadge(c.type)}`}>
                        {c.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate text-right font-mono">
                        {c.customer}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Case Forensic Inspection & Action Console (7 cols) */}
        <div className="lg:col-span-7 stitch-card border border-[#24385E] bg-[#111A2E] p-6 rounded-xl flex flex-col justify-between h-[680px] overflow-y-auto">
          {selectedCase ? (
            <div className="space-y-5">
              
              {/* Case Header Banner */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-[#24385E] gap-3">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xl font-black text-white font-mono">{selectedCase.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getStatusBadge(selectedCase.status)}`}>
                      {selectedCase.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">· {selectedCase.detectedAt}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono">
                    Affected Entity: <span className="text-white font-bold">{selectedCase.customer}</span>
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Estimated Exposure</span>
                  <span className="text-2xl font-black font-mono text-rose-400">
                    ${selectedCase.impact.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* 4 Forensic Metadata Tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="border border-[#253961] rounded-lg p-3 bg-[#15233E]">
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Detection Engine</p>
                  <p className="font-mono text-xs font-bold text-cyan-300 mt-1 truncate">{selectedCase.method}</p>
                </div>
                <div className="border border-[#253961] rounded-lg p-3 bg-[#15233E]">
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">AI Confidence</p>
                  <p className="font-mono text-xs font-bold text-emerald-400 mt-1">{(selectedCase.confidence * 100).toFixed(1)}%</p>
                </div>
                <div className="border border-[#253961] rounded-lg p-3 bg-[#15233E]">
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Category</p>
                  <p className="font-mono text-xs font-bold text-purple-300 mt-1 truncate">{selectedCase.type.replace(/_/g, ' ')}</p>
                </div>
                <div className="border border-[#253961] rounded-lg p-3 bg-[#15233E]">
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Action SLA</p>
                  <p className="font-mono text-xs font-bold text-amber-300 mt-1">Within 24 Hours</p>
                </div>
              </div>

              {/* Evidence & Calculation Traceability */}
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center font-mono">
                  <FileText size={15} className="mr-2 text-cyan-400" /> Evidence & Mediation Calculation Trace
                </h3>
                
                <div className="space-y-3">
                  {selectedCase.evidence.map((ev, idx) => (
                    <div key={idx} className="bg-[#14203A] border border-[#253961] p-3.5 rounded-lg space-y-2">
                      <p className="text-xs text-slate-200 font-mono font-medium leading-relaxed">{ev.desc}</p>
                      <div className="bg-[#090F1D] border border-cyan-500/30 p-2.5 rounded font-mono text-[11px] text-cyan-200">
                        <span className="text-slate-400 mr-2">[CALCULATION_TRACE]:</span>
                        {ev.calc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Affected Billing Records */}
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center font-mono">
                  <Database size={15} className="mr-2 text-cyan-400" /> Correlated Telecom CDR Batches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCase.records.map((r, idx) => (
                    <span 
                      key={idx} 
                      className="bg-[#15233E] border border-[#253961] px-2.5 py-1 rounded text-xs font-mono text-cyan-300"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Forensic Action Toolbar */}
              <div className="pt-4 border-t border-[#24385E] flex flex-wrap items-center gap-3">
                {selectedCase.status !== 'INVESTIGATING' && selectedCase.status !== 'RECOVERED' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedCase.id, 'INVESTIGATING', `Case ${selectedCase.id} marked as INVESTIGATING.`)}
                    className="bg-[#1E3A8A] hover:bg-[#2563EB] text-white px-3.5 py-2 rounded-lg font-bold text-xs flex items-center transition-all font-mono"
                  >
                    <SlidersHorizontal size={14} className="mr-1.5" /> Mark Investigating
                  </button>
                )}

                {selectedCase.status !== 'RECOVERED' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedCase.id, 'RECOVERED', `Invoice adjustment dispatched! $${selectedCase.impact.toLocaleString()} recovered for ${selectedCase.customer}.`)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all font-mono cursor-pointer"
                  >
                    <CheckCircle2 size={14} className="mr-1.5" /> Resolve & Recover Revenue
                  </button>
                )}

                {selectedCase.status !== 'DISMISSED' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedCase.id, 'DISMISSED', `Case ${selectedCase.id} flagged as False Positive and archived.`)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg font-bold text-xs flex items-center transition-all font-mono"
                  >
                    <XCircle size={14} className="mr-1.5" /> Flag False Positive
                  </button>
                )}

                {selectedCase.status === 'RECOVERED' && (
                  <div className="flex items-center space-x-2 text-xs font-mono text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-lg">
                    <CheckCircle2 size={15} className="text-emerald-400" />
                    <span className="font-bold">Automated Credit / Rebilling Adjustment Dispatched</span>
                  </div>
                )}

                {selectedCase.status === 'DISMISSED' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedCase.id, 'OPEN', `Case ${selectedCase.id} restored to OPEN queue.`)}
                    className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-2 rounded-lg font-bold text-xs flex items-center transition-all font-mono border border-[#253961]"
                  >
                    <RotateCcw size={14} className="mr-1.5" /> Re-open Case
                  </button>
                )}

                {/* Copilot Deep Link */}
                <Link
                  href={`/dashboard/copilot?prompt=${encodeURIComponent(`Perform deep forensic audit on revenue leakage case ${selectedCase.id} (${selectedCase.type}): impact $${selectedCase.impact} for ${selectedCase.customer}. Calculation trace: ${selectedCase.evidence.map(e => e.calc).join('; ')}`)}`}
                  className="ml-auto text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center transition-all"
                >
                  Forensic Copilot Audit <ArrowRight size={13} className="ml-1" />
                </Link>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20">
              <DollarSign size={48} className="mb-4 opacity-25 text-emerald-400" />
              <p className="text-xs font-mono">Select a revenue leakage incident from the queue to inspect mediation trace.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
