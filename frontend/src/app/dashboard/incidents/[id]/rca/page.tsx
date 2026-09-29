"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  BrainCircuit, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  AlertTriangle, 
  Clock, 
  History, 
  ArrowLeft, 
  Bot, 
  Wrench, 
  Radio, 
  ShieldCheck, 
  Layers, 
  Play, 
  FileText, 
  Zap, 
  X,
  Server
} from 'lucide-react';

interface EvidenceItem {
  id: string;
  description: string;
  sourceType: 'KPI' | 'ALARM' | 'HISTORY' | 'TOPOLOGY';
  metric: string;
  observedValue: string;
  baselineValue: string;
  timeOffset: string;
  impactScore: number;
}

interface ActionStep {
  id: string;
  title: string;
  description: string;
  targetNode: string;
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED';
  automated: boolean;
}

interface AlternativeCause {
  title: string;
  probability: number;
  reason: string;
}

export default function RootCauseAnalysisPage({ params }: { params: { id: string } }) {
  const incidentId = params.id;

  // Feedback State
  const [feedback, setFeedback] = useState<'ACCEPTED' | 'REJECTED' | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Evidence Filter
  const [evidenceFilter, setEvidenceFilter] = useState<'ALL' | 'KPI' | 'ALARM' | 'HISTORY' | 'TOPOLOGY'>('ALL');

  // Interactive Action Execution State
  const [actions, setActions] = useState<ActionStep[]>([
    {
      id: "ACT-01",
      title: "Recalibrate Backhaul Optical Power Interface",
      description: "Send optical laser diagnostic pulse and measure dBm return loss on port 100G-ETH-01.",
      targetNode: "PE-ROUTER-NYC-01",
      status: "COMPLETED",
      automated: true
    },
    {
      id: "ACT-02",
      title: "Reroute Traffic via Secondary Microwave Ring",
      description: "Shift 45 Gbps user-plane traffic away from degraded fiber pair to protect QoS SLAs.",
      targetNode: "CORE-RING-WEST",
      status: "PENDING",
      automated: true
    },
    {
      id: "ACT-03",
      title: "Dispatch Tier-3 Field Engineering Team",
      description: "Deploy emergency on-site optical cleaning kit and OTDR fiber break reflectometer.",
      targetNode: "SITE-NYC-01-SHELTER",
      status: "PENDING",
      automated: false
    }
  ]);

  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  const handleExecuteAction = (actionId: string, title: string) => {
    setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: 'EXECUTING' } : a));
    showToast(`Dispatching automated actuation: "${title}"...`);

    setTimeout(() => {
      setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: 'COMPLETED' } : a));
      showToast(`Action "${title}" executed successfully.`);
    }, 2200);
  };

  // Dynamic context based on incidentId
  const isRouterUpgrade = incidentId.toLowerCase().includes('upgrade') || incidentId.toLowerCase().includes('router');
  const isPowerIncident = incidentId.toLowerCase().includes('power');

  const incidentMeta = isRouterUpgrade ? {
    title: "Core PE Router Firmware Upgrade Verification",
    severity: "INFO",
    priority: "P4",
    status: "RESOLVED",
    source: "MANUAL & AI SENTINEL",
    rootCause: "BGP RIB Convergence & FIB Cache Flush",
    confidence: 0.94,
    summary: "During planned maintenance window router firmware was flashed to Junos 23.4R2. Asynchronous BGP prefix re-indexing created a momentary 38ms latency jump before FIB converged.",
    region: "NA-EAST (New York Metro)",
    site: "SITE-NYC-01 / Core-PE-01",
    blastRadius: "1 Core Site · 14 Downstream Cells · 0 Calls Dropped"
  } : isPowerIncident ? {
    title: "Power Supply Unit Voltage Fluctuation",
    severity: "MAJOR",
    priority: "P2",
    status: "ACKNOWLEDGED",
    source: "HARDWARE ALARM",
    rootCause: "Rectifier Module #2 Thermal Overload",
    confidence: 0.91,
    summary: "Auxiliary DC battery backup engaged after primary rectifier diode triggered 82°C thermal governor cut-off.",
    region: "NA-EAST (Boston Core)",
    site: "SITE-BOS-01",
    blastRadius: "1 Site · Dual Redundancy Holding · SLA Preserved"
  } : {
    title: "High Latency & Fiber Degradation",
    severity: "CRITICAL",
    priority: "P1",
    status: "INVESTIGATING",
    source: "AI TELEMETRY",
    rootCause: "Backhaul Fiber Optical Degradation",
    confidence: 0.92,
    summary: "Optical transceiver optical return loss (ORL) degraded past -14.2 dBm threshold causing 42% latency inflation and backhaul packet loss bursts.",
    region: "NA-EAST (Manhattan Macro)",
    site: "SITE-NYC-01",
    blastRadius: "3 Macro Sites · 18 Cells · 14,200 Active Subscribers"
  };

  const evidenceList: EvidenceItem[] = isRouterUpgrade ? [
    {
      id: "EV-01",
      description: "BGP Routing Information Base (RIB) route churn peaked at 18,400 updates/sec",
      sourceType: "ALARM",
      metric: "BGP Prefix Updates",
      observedValue: "18.4K upd/s",
      baselineValue: "< 120 upd/s",
      timeOffset: "T-02m",
      impactScore: 0.95
    },
    {
      id: "EV-02",
      description: "Forwarding Information Base (FIB) lookup delay rose to 38ms during table reload",
      sourceType: "KPI",
      metric: "FIB Lookup RTT",
      observedValue: "38.2 ms",
      baselineValue: "2.1 ms",
      timeOffset: "T-03m",
      impactScore: 0.88
    },
    {
      id: "EV-03",
      description: "Maintenance schedule match: Change Request #CR-2026-8812 approved for 02:00 UTC",
      sourceType: "HISTORY",
      metric: "Change Window Match",
      observedValue: "VERIFIED",
      baselineValue: "ACTIVE",
      timeOffset: "T-15m",
      impactScore: 0.82
    },
    {
      id: "EV-04",
      description: "Optical link telemetry between Core-PE-01 and Spine-02 remained 100% nominal",
      sourceType: "TOPOLOGY",
      metric: "Optical Power Margin",
      observedValue: "-3.1 dBm",
      baselineValue: "-3.2 dBm",
      timeOffset: "T-05m",
      impactScore: 0.40
    }
  ] : [
    {
      id: "EV-01",
      description: "Backhaul round-trip latency increased 42% above 99th percentile baseline",
      sourceType: "KPI",
      metric: "Backhaul RTT",
      observedValue: "54.2 ms",
      baselineValue: "18.1 ms",
      timeOffset: "T-04m",
      impactScore: 0.92
    },
    {
      id: "EV-02",
      description: "Optical Interface alarm 'OPT-LOSS-EXCEEDED' triggered on SFP28 transceiver",
      sourceType: "ALARM",
      metric: "SFP28 Rx Power",
      observedValue: "-18.4 dBm",
      baselineValue: "-9.2 dBm",
      timeOffset: "T-04m",
      impactScore: 0.90
    },
    {
      id: "EV-03",
      description: "User-plane packet loss spiked to 17.2% causing video streaming retransmissions",
      sourceType: "KPI",
      metric: "Packet Drop Rate",
      observedValue: "17.2 %",
      baselineValue: "0.02 %",
      timeOffset: "T-03m",
      impactScore: 0.86
    },
    {
      id: "EV-04",
      description: "Topology history: Identical fiber splice junction degraded 2 times in preceding 60 days",
      sourceType: "HISTORY",
      metric: "Recurrent Site Fault",
      observedValue: "2 Occurrences",
      baselineValue: "0 Occurrences",
      timeOffset: "T-45d",
      impactScore: 0.65
    },
    {
      id: "EV-05",
      description: "Adjacent cell sites SITE-NYC-02 and SITE-NYC-03 reporting stable backhaul telemetry",
      sourceType: "TOPOLOGY",
      metric: "Peer Node Correlation",
      observedValue: "HEALTHY",
      baselineValue: "HEALTHY",
      timeOffset: "T-01m",
      impactScore: 0.55
    }
  ];

  const alternativeCauses: AlternativeCause[] = isRouterUpgrade ? [
    {
      title: "Transport LACP Link Flapping",
      probability: 0.18,
      reason: "Down-ranked: Interface carrier states remained up with 0 link down transitions."
    },
    {
      title: "DDoS Reflection Micro-burst",
      probability: 0.08,
      reason: "Down-ranked: NetFlow traffic volume remained within predictable baseline boundaries."
    }
  ] : [
    {
      title: "Transport Network Congestion & Queue Overflow",
      probability: 0.28,
      reason: "Down-ranked: Buffer drop statistics on upstream aggregation routers remained zero."
    },
    {
      title: "PE Router Line-Card ASIC Hardware Fault",
      probability: 0.12,
      reason: "Down-ranked: Internal ASIC diagnostic self-tests completed with code 0 (Pass)."
    }
  ];

  const filteredEvidence = evidenceFilter === 'ALL' 
    ? evidenceList 
    : evidenceList.filter(e => e.sourceType === evidenceFilter);

  const getSourceBadge = (type: EvidenceItem['sourceType']) => {
    switch (type) {
      case 'KPI':
        return { color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: <Activity size={12} className="mr-1 text-cyan-400" /> };
      case 'ALARM':
        return { color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', icon: <AlertTriangle size={12} className="mr-1 text-rose-400" /> };
      case 'HISTORY':
        return { color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: <History size={12} className="mr-1 text-amber-400" /> };
      case 'TOPOLOGY':
        return { color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: <Layers size={12} className="mr-1 text-purple-400" /> };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Breadcrumb Navigation & Top Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <Link href="/dashboard/incidents" className="hover:text-cyan-400 flex items-center transition-colors">
            <ArrowLeft size={14} className="mr-1" /> Incidents
          </Link>
          <span>/</span>
          <span className="text-slate-300 font-bold">{incidentId}</span>
          <span>/</span>
          <span className="text-purple-400 font-bold flex items-center">
            <BrainCircuit size={13} className="mr-1 text-purple-400" /> Root Cause Analysis
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href={`/dashboard/copilot?prompt=Explain AI Root Cause Analysis for incident ${incidentId}. Breakdown evidence chain, optical power margin, and verify if automated traffic reroute is safe.`}
            className="bg-[#15233E] hover:bg-[#1E335C] border border-cyan-500/40 text-cyan-300 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center transition-all font-mono shadow-sm"
          >
            <Bot size={14} className="mr-1.5 text-cyan-400" /> Ask Copilot Deep-Dive
          </Link>
        </div>
      </div>

      {/* Main Incident Command Header */}
      <div className="stitch-card p-6 border border-[#24385E] bg-gradient-to-r from-[#111A2E] via-[#15233E] to-[#0E172A] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              incidentMeta.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
              incidentMeta.severity === 'MAJOR' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
              'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            }`}>
              {incidentMeta.severity}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1A2946] border border-[#263C66] text-slate-300">
              {incidentMeta.priority}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
              {incidentMeta.status}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Source: <span className="text-slate-200">{incidentMeta.source}</span>
            </span>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <BrainCircuit className="mr-3 text-purple-400 shrink-0" size={28} />
            <span>{incidentMeta.title}</span>
          </h1>

          <p className="text-xs text-slate-300 font-mono mt-1.5 max-w-3xl">
            {incidentMeta.summary}
          </p>
        </div>

        <div className="flex flex-col items-end shrink-0 font-mono">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">RCA Diagnostic Engine</div>
          <div className="text-xs font-bold text-cyan-300 mt-0.5 flex items-center">
            <ShieldCheck size={14} className="mr-1 text-emerald-400" />
            qwen2.5:1.5b + Transformer Correlator
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
            Zero-Cloud Local Privacy Verified
          </div>
        </div>
      </div>

      {/* Global Toast Alert */}
      {notification && (
        <div className="p-3.5 rounded-lg border border-cyan-500/50 bg-cyan-950/70 text-cyan-200 text-xs font-mono flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white ml-4">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top 4 KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="stitch-card p-4 border border-[#24385E] bg-[#111A2E] rounded-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center">
              <BrainCircuit size={13} className="mr-1.5 text-purple-400" /> Primary Hypothesis
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-300 font-bold">
              VERIFIED
            </span>
          </div>
          <div className="text-lg font-black text-white font-mono mt-2 truncate">
            {incidentMeta.rootCause}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Site: <span className="text-cyan-400">{incidentMeta.site}</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="stitch-card p-4 border border-[#24385E] bg-[#111A2E] rounded-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center">
              <Activity size={13} className="mr-1.5 text-emerald-400" /> Model Confidence
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-bold">
              HIGH
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-2 flex items-baseline space-x-2">
            <span>{(incidentMeta.confidence * 100).toFixed(0)}%</span>
            <span className="text-xs font-normal text-slate-400">Certainty Score</span>
          </div>
          <div className="w-full bg-[#1A2844] rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-300 h-1.5 rounded-full" 
              style={{ width: `${incidentMeta.confidence * 100}%` }}
            ></div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="stitch-card p-4 border border-[#24385E] bg-[#111A2E] rounded-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center">
              <Radio size={13} className="mr-1.5 text-cyan-400" /> Blast Radius
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-bold">
              CONTAINED
            </span>
          </div>
          <div className="text-sm font-black text-white font-mono mt-2">
            {incidentMeta.blastRadius}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Region: <span className="text-cyan-400">{incidentMeta.region}</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="stitch-card p-4 border border-[#24385E] bg-[#111A2E] rounded-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center">
              <Clock size={13} className="mr-1.5 text-amber-400" /> Time to RCA
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 font-bold">
              REALTIME
            </span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-2 flex items-baseline space-x-2">
            <span>16.2 ms</span>
            <span className="text-xs font-normal text-slate-400">Inference Delay</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            TTD: <span className="text-slate-200">2.4 mins from telemetry breach</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Left (Evidence & Topology) vs Right (Actions & Engineer Feedback) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Evidence Chain & Topology Visualizer (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Signal Path Topology Flow */}
          <div className="stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-[#1E2E4E] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center">
                  <Layers size={15} className="mr-2 text-cyan-400" />
                  Correlated Network Topology Degradation Path
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Autonomous path tracing identifying origin point of performance drop.
                </p>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded">
                Active Hop Map
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              
              {/* Hop 1 */}
              <div className="p-3.5 bg-[#0E172B] rounded-lg border border-emerald-500/40 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center">
                    <CheckCircle2 size={12} className="mr-1" /> HOP 1 · CORE
                  </span>
                  <span className="text-[10px] text-slate-400">100G Trunk</span>
                </div>
                <div className="text-white font-bold text-sm mt-1.5">CORE-PE-ROUTER-01</div>
                <div className="text-[11px] text-slate-400 mt-1">Status: <span className="text-emerald-300">100% Nominal</span></div>
                <div className="text-[10px] text-slate-500 mt-0.5">Latency: 0.8ms · Loss: 0.0%</div>
              </div>

              {/* Hop 2 (Fault Point) */}
              <div className={`p-3.5 bg-[#0E172B] rounded-lg border relative ${
                isRouterUpgrade 
                  ? 'border-cyan-500/50 bg-cyan-950/20' 
                  : 'border-rose-500/60 bg-rose-950/20'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold flex items-center ${
                    isRouterUpgrade ? 'text-cyan-400' : 'text-rose-400'
                  }`}>
                    <AlertTriangle size={12} className="mr-1" /> HOP 2 · TRANSPORT (FAULT)
                  </span>
                  <span className="text-[10px] text-rose-300 font-bold">FAULT POINT</span>
                </div>
                <div className="text-white font-bold text-sm mt-1.5">
                  {isRouterUpgrade ? "BGP RIB ENGINE" : "OPTICAL-CWDM-BACKHAUL"}
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Status: <span className={isRouterUpgrade ? 'text-cyan-300' : 'text-rose-300 font-bold'}>
                    {isRouterUpgrade ? "Converged (38ms Peak)" : "Optical Loss -18.4 dBm"}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {isRouterUpgrade ? "FIB Lookup Transient Spike" : "Packet Loss: 17.2% Burst"}
                </div>
              </div>

              {/* Hop 3 */}
              <div className="p-3.5 bg-[#0E172B] rounded-lg border border-amber-500/40 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-amber-400 font-bold flex items-center">
                    <Activity size={12} className="mr-1" /> HOP 3 · RAN EDGE
                  </span>
                  <span className="text-[10px] text-slate-400">gNodeB 5G</span>
                </div>
                <div className="text-white font-bold text-sm mt-1.5">{incidentMeta.site}</div>
                <div className="text-[11px] text-slate-400 mt-1">Status: <span className="text-amber-300">Downstream Impact</span></div>
                <div className="text-[10px] text-slate-500 mt-0.5">18 Radios · Throughput Degraded</div>
              </div>

            </div>
          </div>

          {/* Evidence Chain */}
          <div className="stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-[#0E172B] border-b border-[#1E2E4E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center">
                  <BrainCircuit size={15} className="mr-2 text-purple-400" />
                  Correlated Telemetry Evidence Chain ({evidenceList.length} Signals)
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Ranked by cross-attention correlation score against telecom domain priors.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-1">
                {(['ALL', 'KPI', 'ALARM', 'HISTORY', 'TOPOLOGY'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setEvidenceFilter(tab)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-colors ${
                      evidenceFilter === tab 
                        ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50' 
                        : 'bg-[#15233E] text-slate-400 hover:text-white border border-[#233863]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-[#182643] font-mono text-xs">
              {filteredEvidence.map((ev) => {
                const badge = getSourceBadge(ev.sourceType);
                return (
                  <div key={ev.id} className="p-4 hover:bg-[#14203A] transition-colors space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center ${badge.color}`}>
                          {badge.icon}
                          {ev.sourceType}
                        </span>
                        <span className="text-[11px] text-cyan-400 font-bold">{ev.metric}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-400 text-[10px] flex items-center">
                          <Clock size={11} className="mr-1" /> {ev.timeOffset}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-right">
                        <span className="text-[10px] text-slate-400 uppercase">Impact Score</span>
                        <span className="text-emerald-400 font-bold">{ev.impactScore.toFixed(2)}</span>
                      </div>
                    </div>

                    <p className="text-slate-200 text-xs font-sans font-medium pl-1">
                      {ev.description}
                    </p>

                    <div className="flex items-center space-x-4 pl-1 text-[11px] text-slate-400">
                      <div>
                        <span>Observed: </span>
                        <span className="text-rose-400 font-bold">{ev.observedValue}</span>
                      </div>
                      <div>
                        <span>Baseline: </span>
                        <span className="text-slate-300 font-bold">{ev.baselineValue}</span>
                      </div>
                      <div className="flex-1 max-w-xs">
                        <div className="w-full bg-[#182643] rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-cyan-400 h-1.5 rounded-full"
                            style={{ width: `${ev.impactScore * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alternative Hypotheses Evaluation */}
          <div className="stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-white font-mono flex items-center">
              <Zap size={15} className="mr-2 text-amber-400" />
              Alternative Hypotheses Evaluated & Counter-Evidence
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Hypotheses evaluated by the neural pipeline and down-ranked due to conflicting evidence.
            </p>

            <div className="space-y-2.5 pt-2">
              {alternativeCauses.map((alt, idx) => (
                <div key={idx} className="p-3 bg-[#0E172B] rounded-lg border border-[#1E2E4E] font-mono text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-bold text-xs">{alt.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {(alt.probability * 100).toFixed(0)}% Probability
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {alt.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Recommended Actions & Engineer Verification (1 Col) */}
        <div className="space-y-6">
          
          {/* Action Dispatcher */}
          <div className="stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center">
                  <Wrench size={15} className="mr-2 text-cyan-400" />
                  Recommended Remediation
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  Autonomous actuation & field protocol.
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                Active Policy
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {actions.map((act, idx) => (
                <div key={act.id} className="p-3.5 bg-[#0E172B] rounded-lg border border-[#203358] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-5 h-5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="text-white font-bold text-xs">{act.title}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 font-sans">
                    {act.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-[#182643] text-[10px]">
                    <div className="text-slate-400">
                      Node: <span className="text-cyan-300 font-mono">{act.targetNode}</span>
                    </div>

                    {act.status === 'COMPLETED' ? (
                      <span className="text-emerald-400 font-bold flex items-center">
                        <CheckCircle2 size={12} className="mr-1" /> Executed
                      </span>
                    ) : act.status === 'EXECUTING' ? (
                      <span className="text-amber-400 font-bold animate-pulse flex items-center">
                        <Server size={12} className="mr-1" /> Executing...
                      </span>
                    ) : (
                      <button
                        onClick={() => handleExecuteAction(act.id, act.title)}
                        className="px-2.5 py-1 rounded bg-[#182B4E] hover:bg-[#233C6E] border border-cyan-500/40 text-cyan-300 font-bold flex items-center transition-colors"
                      >
                        <Play size={10} className="mr-1 text-cyan-400" /> Execute
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Engineer Feedback / Verification Widget */}
          <div className="stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl p-5 shadow-sm space-y-4">
            <div className="border-b border-[#1E2E4E] pb-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center">
                <ShieldCheck size={15} className="mr-2 text-emerald-400" />
                Network Engineer Verification (RLHF)
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Your sign-off refines the local transformer model weights.
              </p>
            </div>

            {feedback === null ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300 font-sans">
                  Does this AI Root Cause Analysis accurately diagnose the incident?
                </p>

                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <button
                    onClick={() => {
                      setFeedback('ACCEPTED');
                      showToast("Engineer accepted RCA hypothesis. Recorded in model reinforcement buffer.");
                    }}
                    className="p-2.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center transition-colors"
                  >
                    <CheckCircle2 size={14} className="mr-1.5" /> Accept RCA
                  </button>

                  <button
                    onClick={() => setShowFeedbackModal(true)}
                    className="p-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 font-bold flex items-center justify-center transition-colors"
                  >
                    <XCircle size={14} className="mr-1.5" /> Reject / Adjust
                  </button>
                </div>
              </div>
            ) : (
              <div className={`p-3.5 rounded-lg border font-mono text-xs ${
                feedback === 'ACCEPTED' 
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' 
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              }`}>
                <div className="flex items-center space-x-2 font-bold mb-1">
                  {feedback === 'ACCEPTED' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  <span>Verification Confirmed: {feedback}</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans">
                  {feedback === 'ACCEPTED'
                    ? "Hypothesis signed off by on-duty Network Operations Engineer."
                    : `Adjusted hypothesis recorded: "${feedbackNote || 'Root cause adjusted.'}"`}
                </p>
                <button
                  onClick={() => setFeedback(null)}
                  className="mt-2 text-[10px] text-cyan-400 hover:underline font-mono"
                >
                  Change Feedback
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-[#1E2E4E] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center">
                <FileText size={12} className="mr-1 text-slate-400" /> Post-Mortem
              </span>
              <button
                onClick={() => showToast(`Generating complete RCA Post-Mortem bundle for ${incidentId}...`)}
                className="text-cyan-400 hover:text-cyan-300 font-bold"
              >
                Export PDF/JSON &rarr;
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Reject / Adjustment Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="stitch-card bg-[#111A2E] border border-rose-500/50 rounded-xl p-6 max-w-md w-full shadow-2xl text-white font-mono space-y-4">
            <div className="flex justify-between items-center border-b border-[#24385E] pb-3">
              <div className="flex items-center space-x-2">
                <XCircle className="text-rose-400" size={18} />
                <h3 className="font-bold text-sm text-white">Provide Corrective RCA Guidance</h3>
              </div>
              <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-sans">
              Enter the actual root cause or specific telemetry signal the model should have prioritized.
            </p>

            <textarea
              rows={3}
              placeholder="e.g. SFP28 transceiver dust contamination on bulkhead connector..."
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              className="w-full bg-[#0E172B] border border-[#253961] rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
            />

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#24385E]">
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                className="px-3 py-1.5 rounded-lg bg-[#182643] text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setFeedback('REJECTED');
                  setShowFeedbackModal(false);
                  showToast("Feedback and corrective notes submitted to AI model registry.");
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-900/40"
              >
                Submit Correction
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
