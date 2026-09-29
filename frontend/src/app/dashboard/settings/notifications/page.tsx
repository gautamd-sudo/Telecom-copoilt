"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  ShieldAlert, 
  Smartphone, 
  Mail, 
  Hash, 
  Globe, 
  Clock, 
  CheckCircle2, 
  Search, 
  Plus, 
  RefreshCw, 
  Bot, 
  Zap, 
  Radio, 
  Activity,
  Layers
} from 'lucide-react';

interface NotificationRule {
  id: string;
  name: string;
  alertType: 'NETWORK_OUTAGE' | 'REVENUE_LEAKAGE' | 'PREDICTIVE_FAILURE' | 'SLA_BREACH' | 'SECURITY_INCIDENT' | 'ROAMING_SPIKE';
  severities: ('CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW')[];
  channels: ('SLACK' | 'SMS' | 'WEBHOOK' | 'IN_APP' | 'EMAIL' | 'PAGERDUTY' | 'MS_TEAMS')[];
  cooldown: number; // in minutes
  active: boolean;
  targetSquad: string;
  lastTriggered?: string;
  suppressionCount24h: number;
}

interface EndpointHealth {
  channel: string;
  latencyMs: number;
  status: 'OPERATIONAL' | 'DEGRADED';
  successRate: string;
}

const DEFAULT_RULES: NotificationRule[] = [
  {
    id: "NR-001",
    name: "Critical Cell Outage & Sector Down Alert",
    alertType: "NETWORK_OUTAGE",
    severities: ["CRITICAL", "HIGH"],
    channels: ["SLACK", "PAGERDUTY", "SMS", "IN_APP"],
    cooldown: 30,
    active: true,
    targetSquad: "Tier-1 NOC Emergency Ops",
    lastTriggered: "14 mins ago (CELL_NYC_104)",
    suppressionCount24h: 3420
  },
  {
    id: "NR-002",
    name: "High Financial Exposure Revenue Leakage",
    alertType: "REVENUE_LEAKAGE",
    severities: ["CRITICAL"],
    channels: ["EMAIL", "IN_APP", "MS_TEAMS"],
    cooldown: 120,
    active: true,
    targetSquad: "Revenue Assurance & Billing Finance",
    lastTriggered: "3 hours ago (LC-2026-01)",
    suppressionCount24h: 184
  },
  {
    id: "NR-003",
    name: "AI Predictive Hardware Failure Warning",
    alertType: "PREDICTIVE_FAILURE",
    severities: ["CRITICAL", "HIGH"],
    channels: ["IN_APP", "EMAIL", "SLACK"],
    cooldown: 360,
    active: true,
    targetSquad: "Field Engineering Dispatch Squad",
    lastTriggered: "Yesterday (EQ-NYC-01-BBU)",
    suppressionCount24h: 890
  },
  {
    id: "NR-004",
    name: "SLA Threshold Breach & Packet Loss Spike",
    alertType: "SLA_BREACH",
    severities: ["HIGH", "MEDIUM"],
    channels: ["WEBHOOK", "SLACK", "IN_APP"],
    cooldown: 60,
    active: true,
    targetSquad: "Service Delivery & Transport NOC",
    lastTriggered: "5 hours ago",
    suppressionCount24h: 215
  },
  {
    id: "NR-005",
    name: "Unauthorized Access & PII Security Incident",
    alertType: "SECURITY_INCIDENT",
    severities: ["CRITICAL"],
    channels: ["PAGERDUTY", "SMS", "EMAIL"],
    cooldown: 15,
    active: true,
    targetSquad: "SecOps Security Dispatch",
    lastTriggered: "Sep 22 (Audit Log)",
    suppressionCount24h: 42
  },
  {
    id: "NR-006",
    name: "International Roaming & CDR Ingestion Surge",
    alertType: "ROAMING_SPIKE",
    severities: ["MEDIUM", "LOW"],
    channels: ["EMAIL", "IN_APP"],
    cooldown: 720,
    active: false,
    targetSquad: "Carrier Wholesale Services",
    lastTriggered: "Sep 20",
    suppressionCount24h: 70
  }
];

const ENDPOINT_HEALTHS: EndpointHealth[] = [
  { channel: "Slack (#noc-emergency)", latencyMs: 110, status: "OPERATIONAL", successRate: "99.98%" },
  { channel: "PagerDuty Live Gateway", latencyMs: 140, status: "OPERATIONAL", successRate: "100.0%" },
  { channel: "Twilio SMS Dispatch", latencyMs: 380, status: "OPERATIONAL", successRate: "99.85%" },
  { channel: "Custom Webhook (JSON)", latencyMs: 95, status: "OPERATIONAL", successRate: "99.92%" },
  { channel: "SendGrid Corporate Mail", latencyMs: 310, status: "OPERATIONAL", successRate: "99.95%" }
];

export default function NotificationSettingsPage() {
  const [rules, setRules] = useState<NotificationRule[]>(DEFAULT_RULES);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [notification, setNotification] = useState<string | null>(null);
  const [testingRuleId, setTestingRuleId] = useState<string | null>(null);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => {
      if (r.id === id) {
        const nextState = !r.active;
        setNotification(`Rule ${r.id} (${r.name}) ${nextState ? 'ACTIVATED' : 'PAUSED'}.`);
        setTimeout(() => setNotification(null), 4000);
        return { ...r, active: nextState };
      }
      return r;
    }));
  };

  const handleTestDispatch = (rule: NotificationRule) => {
    setTestingRuleId(rule.id);
    setTimeout(() => {
      setTestingRuleId(null);
      setNotification(`Test alert simulated for ${rule.id} across ${rule.channels.join(', ')}. All delivery channels confirmed 200 OK.`);
      setTimeout(() => setNotification(null), 5000);
    }, 600);
  };

  const getChannelBadge = (channel: NotificationRule['channels'][number]) => {
    switch (channel) {
      case 'IN_APP':
        return { icon: <Bell size={13} className="text-cyan-400" />, label: 'In-App NOC', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
      case 'EMAIL':
        return { icon: <Mail size={13} className="text-slate-300" />, label: 'Email Broadcast', color: 'bg-slate-700/20 text-slate-300 border-slate-600/40' };
      case 'SMS':
        return { icon: <Smartphone size={13} className="text-emerald-400" />, label: 'SMS Gateway', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
      case 'SLACK':
        return { icon: <Hash size={13} className="text-purple-400" />, label: 'Slack Webhook', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
      case 'PAGERDUTY':
        return { icon: <Radio size={13} className="text-rose-400" />, label: 'PagerDuty', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
      case 'MS_TEAMS':
        return { icon: <Hash size={13} className="text-blue-400" />, label: 'MS Teams', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' };
      case 'WEBHOOK':
        return { icon: <Globe size={13} className="text-amber-400" />, label: 'REST Webhook', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.15)]";
      case 'HIGH':
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case 'MEDIUM':
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      default:
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
    }
  };

  const filteredRules = rules.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.alertType.toLowerCase().includes(search.toLowerCase()) ||
      r.targetSquad.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'ACTIVE') return r.active;
    if (selectedFilter === 'CRITICAL') return r.severities.includes('CRITICAL');
    if (selectedFilter === 'NETWORK') return r.alertType === 'NETWORK_OUTAGE' || r.alertType === 'SLA_BREACH';
    if (selectedFilter === 'REVENUE') return r.alertType === 'REVENUE_LEAKAGE';

    return true;
  });

  const totalSuppressed24h = rules.reduce((acc, r) => acc + r.suppressionCount24h, 0);

  return (
    <div className="space-y-6">
      
      {/* Stitch AI Header */}
      <div className="stitch-card p-6 border border-[#24385E] bg-gradient-to-r from-[#111A2E] via-[#15233E] to-[#0E172A] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-cyan-400 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-bold tracking-wider uppercase">OMNICHANNEL ALERT DISPATCH & ESCALATION POLICIES</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <Bell className="mr-2.5 text-cyan-400" size={26} />
            Notification & Routing Rules
          </h1>
          <p className="text-xs text-slate-300 font-mono mt-1">
            Omnichannel incident routing, alert storm de-duplication, escalation matrices, and on-call dispatching.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/copilot?prompt=Review notification routing rules and alert storm cooldown thresholds for critical network outages"
            className="bg-[#15233E] hover:bg-[#1C2F52] border border-cyan-500/40 text-cyan-300 px-4 py-2 rounded-lg font-bold text-xs flex items-center transition-all font-mono shadow-sm"
          >
            <Bot size={15} className="mr-1.5 text-cyan-400" /> Audit in Copilot
          </Link>
          <button 
            onClick={() => {
              setNotification("Rule creation wizard ready. Specify trigger metrics, delivery channels, and de-duplication window.");
              setTimeout(() => setNotification(null), 4000);
            }}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center shadow-[0_0_14px_rgba(6,182,212,0.3)] transition-all font-mono cursor-pointer"
          >
            <Plus size={15} className="mr-1.5" /> Create New Rule
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
        
        {/* Active Rules */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <Layers size={14} className="mr-1.5 text-cyan-400" /> Configured Alert Rules
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
              5 ACTIVE
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-white mt-2">
            {rules.filter(r => r.active).length} <span className="text-xs font-normal text-slate-400">/ {rules.length} total</span>
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
            Omnichannel matrix with SLA cooldowns
          </p>
        </div>

        {/* Storm Suppression */}
        <div className="stitch-card p-5 border border-emerald-500/40 bg-gradient-to-br from-[#0F2224] to-[#111A2E] rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.08)]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider font-mono flex items-center">
              <ShieldAlert size={14} className="mr-1.5 text-emerald-400" /> Storm De-duplication (24h)
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              98.2% DE-DUP
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-emerald-300 mt-2">
            {totalSuppressed24h.toLocaleString()} <span className="text-xs font-normal text-emerald-400/70">suppressed</span>
          </p>
          <p className="text-[11px] font-mono text-emerald-400/80 mt-1 truncate">
            SHA-256 grouping prevented NOC alert fatigue
          </p>
        </div>

        {/* Dispatch Latency */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <Zap size={14} className="mr-1.5 text-amber-400" /> Delivery Pipeline Latency
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              &lt; 300ms SLA
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-amber-300 mt-2">
            180ms
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
            Kafka streaming queue + push webhooks
          </p>
        </div>

        {/* Live Channels */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <Activity size={14} className="mr-1.5 text-purple-400" /> Connected Endpoints
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
              100% HEALTHY
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-purple-300 mt-2">
            5 Gateways
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
            Slack · PagerDuty · SMS · Webhooks · Mail
          </p>
        </div>

      </div>

      {/* Alert Storm De-Duplication Banner */}
      <div className="stitch-card p-4 border border-cyan-500/40 bg-gradient-to-r from-[#102038] via-[#122442] to-[#0E172B] rounded-xl flex items-start space-x-3.5 shadow-sm">
        <ShieldAlert className="text-cyan-400 mt-0.5 shrink-0" size={20} />
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Autonomous Alert Storm Protection Active
            </h3>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              PROTECTION ON
            </span>
          </div>
          <p className="text-xs font-mono text-slate-300 leading-relaxed">
            The platform dynamically computes SHA-256 signatures: <code className="bg-[#090F1D] px-1.5 py-0.5 rounded text-cyan-300 border border-cyan-500/30 text-[11px]">[TenantID:AlertType:Severity:EntityID]</code>. Rapid burst alerts matching this hash signature within the storm cooldown window are aggregated into a single thread to eliminate alert fatigue.
          </p>
        </div>
      </div>

      {/* Filter and Search Navigation Bar */}
      <div className="stitch-card p-3 border border-[#24385E] bg-[#111A2E] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 text-[10px] font-mono w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'All Rules' },
            { id: 'ACTIVE', label: 'Active Only' },
            { id: 'CRITICAL', label: 'Critical Severity' },
            { id: 'NETWORK', label: 'Network & Outages' },
            { id: 'REVENUE', label: 'Revenue Leaks' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                selectedFilter === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-inner'
                  : 'bg-[#15233E] text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-[#0E172B] border border-[#253961] rounded-lg px-3 py-1.5 w-full sm:w-72">
          <Search size={14} className="text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search rules, alert types, squads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-xs text-slate-100 placeholder-slate-400 w-full font-mono"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-slate-400 hover:text-white text-xs font-mono ml-1">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {filteredRules.length === 0 ? (
          <div className="stitch-card p-12 text-center text-xs font-mono text-slate-400 border border-[#24385E] bg-[#111A2E] rounded-xl">
            No notification routing rules match the filter criteria.
          </div>
        ) : (
          filteredRules.map(rule => {
            const isTesting = testingRuleId === rule.id;
            return (
              <div 
                key={rule.id} 
                className={`stitch-card border rounded-xl p-5 transition-all shadow-sm ${
                  rule.active 
                    ? 'border-[#24385E] bg-[#111A2E] hover:border-cyan-500/40' 
                    : 'border-dashed border-[#1E2E4E] bg-[#0E172B]/60 opacity-60'
                }`}
              >
                {/* Rule Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C2C4E]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-[#15233E] border border-[#253961] px-2 py-0.5 rounded">
                        {rule.id}
                      </span>
                      <h3 className="text-base font-bold text-white font-mono tracking-tight">
                        {rule.name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        rule.active 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {rule.active ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="text-cyan-300 font-bold bg-[#14203A] border border-[#253961] px-2 py-0.5 rounded text-[10px]">
                        {rule.alertType}
                      </span>
                      <span className="text-slate-400">Target Squad: <strong className="text-slate-200">{rule.targetSquad}</strong></span>
                      {rule.lastTriggered && (
                        <span className="text-slate-400">· Last Triggered: <strong className="text-amber-300 font-normal">{rule.lastTriggered}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400">
                      {rule.active ? 'Routing Enabled' : 'Routing Paused'}
                    </span>
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                        rule.active ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-700'
                      }`}
                      title={rule.active ? "Click to Pause" : "Click to Enable"}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                        rule.active ? 'translate-x-5' : 'translate-x-0'
                      }`}></div>
                    </button>
                  </div>
                </div>

                {/* Severities & Channels Row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 border-b border-[#1C2C4E] items-center">
                  
                  {/* Severities Filter (4 cols) */}
                  <div className="md:col-span-4 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">
                      Trigger Severities
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {rule.severities.map(sev => (
                        <span key={sev} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSeverityBadge(sev)}`}>
                          {sev}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Channels (8 cols) */}
                  <div className="md:col-span-8 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">
                      Dispatched Omnichannel Endpoints
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {rule.channels.map(ch => {
                        const { icon, label, color } = getChannelBadge(ch);
                        return (
                          <span key={ch} className={`flex items-center border px-2.5 py-1 rounded text-xs font-mono font-medium ${color}`}>
                            <span className="mr-1.5">{icon}</span>
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Cooldown, Suppression & Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 font-mono text-xs">
                  <div className="flex flex-wrap items-center gap-4 text-slate-300">
                    <span className="flex items-center">
                      <Clock size={13} className="mr-1.5 text-cyan-400" />
                      Cooldown: <strong className="text-white ml-1">{rule.cooldown} mins</strong>
                    </span>
                    <span className="flex items-center text-slate-400">
                      <ShieldAlert size={13} className="mr-1.5 text-emerald-400" />
                      Suppressed (24h): <strong className="text-emerald-300 ml-1">{rule.suppressionCount24h.toLocaleString()} alerts</strong>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTestDispatch(rule)}
                      disabled={isTesting}
                      className="bg-[#15233E] hover:bg-[#1E335A] disabled:opacity-50 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center cursor-pointer shadow-sm"
                    >
                      <RefreshCw size={12} className={`mr-1.5 ${isTesting ? 'animate-spin' : ''}`} />
                      {isTesting ? "Transmitting..." : "Send Test Alert"}
                    </button>

                    <Link
                      href={`/dashboard/copilot?prompt=${encodeURIComponent(`Analyze notification routing rule ${rule.id} (${rule.name}) for alert type ${rule.alertType}. Are the cooldown of ${rule.cooldown}m and assigned channels (${rule.channels.join(', ')}) optimized for current network volume?`)}`}
                      className="bg-[#15233E] hover:bg-[#1E335A] text-slate-300 hover:text-cyan-300 border border-[#253961] px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center"
                    >
                      <Bot size={13} className="mr-1.5 text-cyan-400" /> Audit in Copilot
                    </Link>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Connected Dispatch Endpoints Health */}
      <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2E4E]">
          <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center">
            <Radio size={15} className="mr-2 text-cyan-400" /> Connected Delivery Gateways & Endpoints Health
          </h2>
          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
            ALL SYSTEMS GO
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {ENDPOINT_HEALTHS.map((ep, idx) => (
            <div key={idx} className="bg-[#15233E] border border-[#253961] p-3 rounded-lg font-mono space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white truncate">{ep.channel}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>Latency: <strong className="text-cyan-300 font-bold">{ep.latencyMs}ms</strong></span>
                <span className="text-emerald-400">{ep.successRate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
