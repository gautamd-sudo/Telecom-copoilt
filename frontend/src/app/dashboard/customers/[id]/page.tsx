"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  CreditCard, 
  Radio, 
  Settings,
  CheckCircle2,
  ArrowRight,
  Bot,
  Sparkles,
  Wifi,
  Gift,
  Clock,
  Zap,
  TrendingDown
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: 'COMPLAINT' | 'NETWORK_EXP' | 'RECHARGE' | 'ACCOUNT_CREATED';
  date: string;
  desc: string;
  telemetry?: {
    cell?: string;
    event?: string;
    rsrp?: string;
    sinr?: string;
  };
}

export default function Customer360Page({ params }: { params: { id: string } }) {
  const customerId = params.id.toUpperCase();
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'NETWORK' | 'BILLING' | 'COMPLAINTS'>('ALL');
  const [piiRequested, setPiiRequested] = useState(false);
  const [remedyApplied, setRemedyApplied] = useState(false);

  // Mock data representing the masked PII payload from the backend service
  const customer = {
    id: customerId,
    name: customerId === "CUST-1001" ? "Johnathan Doe" : customerId === "CUST-9042" ? "Acme Enterprise Account" : `Subscriber ${customerId}`,
    email: piiRequested ? "j.doe.nyc@corpnet.com" : "***@***.com",
    phone: piiRequested ? "+1 (212) 555-0194" : "***-***-****",
    type: "B2C PREMIUM",
    tier: "Tier-1 5G Unlimited",
    status: "ACTIVE",
    region: "NYC Metro · NA-EAST",
    since: "Jan 15, 2023",
    intelligence: {
      sentiment: -0.12,
      churnRisk: 0.45,
      npsScore: 6,
      ltv: 1250.00,
      monthlySpend: 155.00
    },
    subscriptions: [
      { 
        id: "SUB-8291", 
        plan: "5G Unlimited Premium (SA/VoNR)", 
        status: "ACTIVE", 
        monthlyFee: 85.00,
        quotaUsed: "42.8 GB",
        quotaTotal: "Unlimited (Priority QoS)"
      },
      { 
        id: "SUB-8292", 
        plan: "Home Fiber 1Gbps Symmetrical", 
        status: "ACTIVE", 
        monthlyFee: 70.00,
        quotaUsed: "840 GB",
        quotaTotal: "Unlimited"
      }
    ],
    events: [
      { 
        id: "EVT-1", 
        type: "COMPLAINT" as const, 
        date: "2026-09-24T14:30:00Z", 
        desc: "Repeat dropped calls and degraded throughput during peak business hours.",
        telemetry: {
          cell: "CELL_NYC_104",
          event: "Call_Drop_Rate_Spike",
          rsrp: "-114dBm",
          sinr: "3.1dB"
        }
      },
      { 
        id: "EVT-2", 
        type: "NETWORK_EXP" as const, 
        date: "2026-09-23T11:15:00Z", 
        desc: "Cell handover failure triggered packet loss while roaming between Midtown sectors.",
        telemetry: {
          cell: "CELL_NYC_104 -> CELL_NYC_105",
          event: "Handover_Execution_Failure",
          rsrp: "-110dBm",
          sinr: "4.2dB"
        }
      },
      { 
        id: "EVT-3", 
        type: "RECHARGE" as const, 
        date: "2026-09-01T08:00:00Z", 
        desc: "Automated monthly recurring payment processed successfully ($155.00)."
      },
      {
        id: "EVT-4",
        type: "ACCOUNT_CREATED" as const,
        date: "2023-01-15T09:00:00Z",
        desc: "Account initialized with 5G Unlimited Premium and dual-SIM eSIM profile."
      }
    ] satisfies TimelineEvent[]
  };

  const handlePiiRequest = () => {
    setPiiRequested(true);
    setNotification("Two-Factor PII Audit Access approved. Masking temporarily lifted for this session.");
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApplyRemedy = (msg: string) => {
    setRemedyApplied(true);
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const getChurnRiskBadge = (val: number) => {
    if (val > 0.6) return "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]";
    if (val > 0.3) return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  };

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch(type) {
      case 'COMPLAINT': return <AlertTriangle size={14} className="text-rose-400" />;
      case 'NETWORK_EXP': return <Radio size={14} className="text-amber-400" />;
      case 'RECHARGE': return <CreditCard size={14} className="text-emerald-400" />;
      default: return <Settings size={14} className="text-cyan-400" />;
    }
  };

  const filteredEvents = customer.events.filter(e => {
    if (activeTab === 'NETWORK') return e.type === 'NETWORK_EXP';
    if (activeTab === 'BILLING') return e.type === 'RECHARGE';
    if (activeTab === 'COMPLAINTS') return e.type === 'COMPLAINT';
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Stitch AI Header Profile Banner */}
      <div className="stitch-card p-6 border border-[#24385E] bg-gradient-to-r from-[#111A2E] via-[#15233E] to-[#0E172A] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600/40 to-blue-600/40 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-mono font-black text-2xl shadow-inner shrink-0">
            {customer.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-mono text-cyan-400 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="font-bold tracking-wider uppercase">SUBSCRIBER 360 INTELLIGENCE · {customer.id}</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
              {customer.name}
              <span className="ml-3 px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full">
                {customer.type}
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs font-mono text-slate-300">
              <span className="flex items-center"><Mail size={13} className="mr-1 text-slate-400" /> {customer.email}</span>
              <span className="flex items-center"><Phone size={13} className="mr-1 text-slate-400" /> {customer.phone}</span>
              <span className="flex items-center"><MapPin size={13} className="mr-1 text-cyan-400" /> {customer.region}</span>
              <span className="text-slate-400">Tenure: {customer.since}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/dashboard/copilot?prompt=${encodeURIComponent(`Analyze subscriber ${customer.id} (${customer.name}): churn risk 45%, NPS 6, recent cell handover failure on CELL_NYC_104. What proactive retention and service actions are recommended?`)}`}
            className="bg-[#15233E] hover:bg-[#1C2F52] border border-cyan-500/40 text-cyan-300 px-3.5 py-2 rounded-lg font-bold text-xs flex items-center transition-all font-mono shadow-sm"
          >
            <Bot size={15} className="mr-1.5 text-cyan-400" /> Analyze in Copilot
          </Link>
          
          <button 
            onClick={handlePiiRequest}
            disabled={piiRequested}
            className="px-3.5 py-2 bg-[#14203A] hover:bg-[#1A2A4C] border border-[#253961] disabled:opacity-50 text-xs font-bold font-mono text-slate-300 rounded-lg flex items-center transition-all cursor-pointer"
          >
            <ShieldCheck size={15} className="mr-1.5 text-emerald-400" />
            {piiRequested ? "PII Unmasked" : "Request PII Access"}
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

      {/* Top 4 Intelligence KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Churn Risk */}
        <div className="stitch-card p-5 border border-amber-500/40 bg-gradient-to-br from-[#1C1715] to-[#111A2E] rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.08)]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center">
              <AlertTriangle size={14} className="mr-1.5 text-amber-400" /> Churn Risk Assessment
            </span>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold border ${getChurnRiskBadge(customer.intelligence.churnRisk)}`}>
              ELEVATED
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-amber-300 mt-2">
            {(customer.intelligence.churnRisk * 100).toFixed(0)}%
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1">
            Triggered by repeat drop calls on CELL_NYC_104
          </p>
        </div>

        {/* Sentiment Index */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <TrendingDown size={14} className="mr-1.5 text-rose-400" /> Net Sentiment Index
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
              NEUTRAL / SKEW NEG
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-slate-200 mt-2">
            {customer.intelligence.sentiment.toFixed(2)} <span className="text-xs font-normal text-slate-400">(-1.0 to +1.0)</span>
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1">
            Derived from 3 recent support interactions
          </p>
        </div>

        {/* NPS Score */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <Activity size={14} className="mr-1.5 text-cyan-400" /> Net Promoter Score
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              PASSIVE
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-cyan-300 mt-2">
            {customer.intelligence.npsScore} <span className="text-xs font-normal text-slate-400">/ 10</span>
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1">
            At-risk of detractor migration
          </p>
        </div>

        {/* Lifetime Value */}
        <div className="stitch-card p-5 border border-emerald-500/40 bg-gradient-to-br from-[#0F2224] to-[#111A2E] rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.08)]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider font-mono flex items-center">
              <CreditCard size={14} className="mr-1.5 text-emerald-400" /> Customer LTV
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              HIGH ARPU
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-emerald-300 mt-2">
            ${customer.intelligence.ltv.toFixed(2)}
          </p>
          <p className="text-[11px] font-mono text-emerald-400/80 mt-1">
            ${customer.intelligence.monthlySpend.toFixed(2)}/mo across 2 active plans
          </p>
        </div>

      </div>

      {/* Main Grid: Left Subscriptions & Remediation, Right Experience Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 cols): Subscriptions & Retention Action Console */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Subscriptions Card */}
          <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center">
                <Wifi size={15} className="mr-2 text-cyan-400" /> Subscribed Services & Quotas
              </h2>
              <span className="text-[10px] font-mono text-slate-400">2 Active Plans</span>
            </div>

            <div className="space-y-3.5">
              {customer.subscriptions.map(sub => (
                <div key={sub.id} className="bg-[#15233E] border border-[#253961] p-3.5 rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-white font-mono">{sub.plan}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{sub.id}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold rounded">
                      {sub.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-end pt-1 border-t border-[#1F3358] font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Current Billing</span>
                      <span className="text-cyan-300 font-bold">${sub.monthlyFee.toFixed(2)}/mo</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Cycle Usage</span>
                      <span className="text-slate-200 font-medium">{sub.quotaUsed}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Retention & Proactive Remediation Console */}
          <div className="stitch-card p-5 border border-cyan-500/40 bg-gradient-to-br from-[#102038] to-[#0E172B] rounded-xl shadow-[0_4px_20px_rgba(6,182,212,0.1)]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center">
                <Sparkles size={15} className="mr-2 text-cyan-400" /> AI Proactive Retention Console
              </h2>
              <span className="text-[10px] font-mono text-cyan-400/80">SLA Mitigator</span>
            </div>
            
            <p className="text-xs text-slate-300 font-mono mb-3.5 leading-relaxed">
              Based on the 45% churn risk and CELL_NYC_104 RF degradation events, the AI Engine recommends the following customer assurance actions:
            </p>

            <div className="space-y-2.5">
              <button 
                onClick={() => handleApplyRemedy("Dispatched $15.00 courtesy credit to CUST-1001 for CELL_NYC_104 network disturbance.")}
                disabled={remedyApplied}
                className="w-full text-left bg-[#142340] hover:bg-[#1A3057] disabled:opacity-50 border border-[#253961] p-3 rounded-lg flex items-center justify-between transition-all group font-mono text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <Gift size={16} className="text-amber-400 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">Issue $15 Courtesy Credit</p>
                    <p className="text-[10px] text-slate-400">Apology credit for NYC handover drop call incident</p>
                  </div>
                </div>
                <ArrowRight size={13} className="text-slate-400 group-hover:text-cyan-300 shrink-0 ml-2" />
              </button>

              <button 
                onClick={() => handleApplyRemedy("Proactive VIP high-priority ticket dispatched to Tier-2 Field Retention Team.")}
                disabled={remedyApplied}
                className="w-full text-left bg-[#142340] hover:bg-[#1A3057] disabled:opacity-50 border border-[#253961] p-3 rounded-lg flex items-center justify-between transition-all group font-mono text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <Zap size={16} className="text-cyan-400 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">Priority Care Call Dispatch</p>
                    <p className="text-[10px] text-slate-400">Direct outreach before bill cycle close</p>
                  </div>
                </div>
                <ArrowRight size={13} className="text-slate-400 group-hover:text-cyan-300 shrink-0 ml-2" />
              </button>
            </div>
          </div>

        </div>

        {/* Right Column (7 cols): Experience Timeline */}
        <div className="lg:col-span-7 stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl flex flex-col h-[680px] overflow-hidden">
          
          {/* Timeline Filter Header */}
          <div className="p-4 border-b border-[#1E2E4E] bg-[#0E172B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center">
              <Clock size={15} className="mr-2 text-cyan-400" /> Subscriber Experience & RF Telemetry Timeline
            </h2>

            <div className="flex items-center space-x-1.5 text-[10px] font-mono">
              {[
                { label: "All Events", val: "ALL" },
                { label: "Network Telemetry", val: "NETWORK" },
                { label: "Complaints", val: "COMPLAINTS" },
                { label: "Billing", val: "BILLING" }
              ].map(tab => (
                <button
                  key={tab.val}
                  onClick={() => setActiveTab(tab.val as typeof activeTab)}
                  className={`px-2.5 py-1 rounded transition-all ${
                    activeTab === tab.val 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold' 
                      : 'bg-[#15233E] text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Feed */}
          <div className="overflow-y-auto flex-1 p-5">
            <div className="relative border-l-2 border-[#1E2E4E] ml-3.5 space-y-6 pb-2">
              {filteredEvents.map(event => (
                <div key={event.id} className="relative pl-6">
                  {/* Timeline Node Badge */}
                  <span className="absolute -left-[11px] top-0.5 bg-[#0E172B] p-1 rounded-full border border-[#253961]">
                    {getEventIcon(event.type)}
                  </span>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold font-mono text-white">
                          {event.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">({event.id})</span>
                      </div>
                      <span suppressHydrationWarning className="text-[11px] font-mono text-slate-400">
                        {new Date(event.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-slate-200 leading-relaxed">
                      {event.desc}
                    </p>

                    {/* Radio Frequency & Handover Telemetry Badge */}
                    {event.telemetry && (
                      <div className="mt-2 bg-[#14203A] border border-[#253961] p-3 rounded-lg font-mono text-xs space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-cyan-300 font-bold flex items-center">
                            <Radio size={13} className="mr-1.5 text-cyan-400" />
                            {event.telemetry.cell}
                          </span>
                          <span className="text-[10px] text-slate-400 bg-[#0E172B] px-2 py-0.5 rounded border border-[#253961]">
                            {event.telemetry.event}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1 border-t border-[#1C2C4E]">
                          <div>RSRP: <span className="text-rose-400 font-bold">{event.telemetry.rsrp}</span> (Degraded)</div>
                          <div>SINR: <span className="text-amber-400 font-bold">{event.telemetry.sinr}</span></div>
                        </div>

                        {event.telemetry.cell?.includes('CELL_NYC_104') && (
                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-[10px] text-rose-300 font-bold">Correlated with active cell anomaly ANOM-6f6547cd</span>
                            <Link 
                              href="/dashboard/anomalies"
                              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center"
                            >
                              Inspect Anomaly <ArrowRight size={11} className="ml-1" />
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
