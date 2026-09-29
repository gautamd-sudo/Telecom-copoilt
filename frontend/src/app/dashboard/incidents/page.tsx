"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Loader2, 
  RefreshCw, 
  AlertTriangle, 
  Plus, 
  X, 
  CheckCircle2, 
  Search 
} from 'lucide-react';

interface Incident {
  id: string;
  title: string;
  description: string;
  source: 'ANOMALY' | 'ALARM' | 'MANUAL' | 'INTEGRATION' | 'AI';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'MITIGATING' | 'RESOLVED' | 'CLOSED';
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  createdAt: string;
  updatedAt: string;
  assignee?: string;
  slaBreached?: boolean;
}

export default function IncidentDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  // Notification Toast
  const [notification, setNotification] = useState<string | null>(null);

  // Declare Incident Modal State
  const [showDeclareModal, setShowDeclareModal] = useState(false);
  const [declareTitle, setDeclareTitle] = useState("");
  const [declareDescription, setDeclareDescription] = useState("");
  const [declareSeverity, setDeclareSeverity] = useState<Incident['severity']>("MAJOR");
  const [declarePriority, setDeclarePriority] = useState<Incident['priority']>("P2");
  const [declareSource, setDeclareSource] = useState<Incident['source']>("MANUAL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchIncidents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/incidents');
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load incidents`);
      const data = await res.json();
      setIncidents(data.incidents ?? []);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error loading incidents';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDeclareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declareTitle.trim()) {
      setSubmitError("Incident title is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: declareTitle.trim(),
          description: declareDescription.trim() || declareTitle.trim(),
          severity: declareSeverity,
          priority: declarePriority,
          source: declareSource
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to declare incident`);
      }

      // Success
      setShowDeclareModal(false);
      setDeclareTitle("");
      setDeclareDescription("");
      setDeclareSeverity("MAJOR");
      setDeclarePriority("P2");
      setDeclareSource("MANUAL");

      const createdId = data.incident?.id || 'newly declared';
      setNotification(`Incident "${declareTitle.trim()}" declared successfully (${createdId}).`);
      setTimeout(() => setNotification(null), 5000);

      // Refresh list
      await fetchIncidents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to declare incident';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'MAJOR': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'MINOR': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'INFO': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return 'border-rose-500/40 text-rose-400 bg-rose-500/10';
      case 'ACKNOWLEDGED': return 'border-amber-500/40 text-amber-400 bg-amber-500/10';
      case 'INVESTIGATING': return 'border-purple-500/40 text-purple-400 bg-purple-500/10';
      case 'MITIGATING': return 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10';
      case 'RESOLVED': return 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10';
      case 'CLOSED': return 'border-slate-700 text-slate-400 bg-slate-800/40';
      default: return 'border-slate-800 text-slate-400';
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = inc.title.toLowerCase().includes(search.toLowerCase()) ||
                          inc.id.toLowerCase().includes(search.toLowerCase()) ||
                          inc.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;
    const matchesSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const openCount = incidents.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;
  const unassignedCount = incidents.filter(i => !i.assignee).length;
  const slaBreachedCount = incidents.filter(i => i.slaBreached).length;

  return (
    <div className="space-y-6">
      
      {/* Stitch Header */}
      <div className="stitch-card p-6 border border-[#1B2945] bg-gradient-to-r from-[#0C1527] via-[#0E1A34] to-[#0A1222] rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5 mb-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                <ShieldAlert size={11} className="mr-1.5 text-rose-400" />
                INCIDENT DISPATCH & SLA MATRIX
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400 font-mono">AUTOMATED ESCALATION ACTIVE</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
              Network Incident Command Center
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Correlate alarms, manage root cause mitigation pipelines, and preserve MTTR compliance.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={fetchIncidents}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#14213D] border border-cyan-500/30 text-cyan-300 hover:bg-[#1A2C52] transition-all flex items-center font-mono"
            >
              <RefreshCw size={13} className="mr-1.5" />
              Refresh
            </button>
            <button 
              onClick={() => {
                setSubmitError(null);
                setShowDeclareModal(true);
              }}
              className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all flex items-center font-mono cursor-pointer"
            >
              <Plus size={14} className="mr-1.5" />
              Declare Incident
            </button>
          </div>
        </div>
      </div>

      {/* Global Toast Alert */}
      {notification && (
        <div className="p-3.5 rounded-lg border border-emerald-500/50 bg-emerald-950/70 text-emerald-200 text-xs font-mono flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white ml-4">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="stitch-card p-4 border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={16} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchIncidents} className="underline text-rose-400 font-bold ml-4">Retry</button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stitch-card p-4 border border-[#1B2945] bg-[#111A2E] rounded-xl">
          <p className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">Active Outages / P1</p>
          <p className="text-2xl font-black text-rose-400 font-mono mt-1">{openCount}</p>
        </div>
        <div className="stitch-card p-4 border border-[#1B2945] bg-[#111A2E] rounded-xl">
          <p className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">Unassigned Tasks</p>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">{unassignedCount}</p>
        </div>
        <div className="stitch-card p-4 border border-[#1B2945] bg-[#111A2E] rounded-xl">
          <p className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">Breached SLAs</p>
          <p className={`text-2xl font-black font-mono mt-1 ${slaBreachedCount > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
            {slaBreachedCount}
          </p>
        </div>
        <div className="stitch-card p-4 border border-[#1B2945] bg-[#111A2E] rounded-xl">
          <p className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">MTTR Average</p>
          <p className="text-2xl font-black text-cyan-400 font-mono mt-1">42m 18s</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#24385E] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0E172B] border border-[#253961] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="MITIGATING">Mitigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#0E172B] border border-[#253961] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="MAJOR">Major</option>
            <option value="MINOR">Minor</option>
            <option value="INFO">Info</option>
          </select>
        </div>

        <div className="flex items-center bg-[#0E172B] border border-[#253961] rounded-lg px-3 py-1.5 w-full sm:w-72">
          <Search size={14} className="text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search incident, ID, description..."
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

      {/* Incidents Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="animate-spin text-cyan-400" size={32} />
          <span className="text-xs font-mono text-slate-400 tracking-wider">Loading Incident Records...</span>
        </div>
      ) : (
        <div className="stitch-card border border-[#1B2945] bg-[#0E172A] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A1222] border-b border-[#1B2945] text-slate-400 text-xs font-mono uppercase tracking-wider">
                  <th className="px-6 py-3.5">Severity / ID</th>
                  <th className="px-6 py-3.5">Incident Title</th>
                  <th className="px-6 py-3.5">Status & Priority</th>
                  <th className="px-6 py-3.5">Source</th>
                  <th className="px-6 py-3.5">SLA Condition</th>
                  <th className="px-6 py-3.5 text-right">RCA Diagnostic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B2945] text-xs font-sans">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-mono">
                      No matching incident records found.
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-[#14213D] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 inline-flex text-[10px] font-mono font-bold rounded border ${getSeverityBadge(inc.severity)}`}>
                            {inc.severity}
                          </span>
                          <span className="font-mono text-cyan-400 text-xs font-semibold">{inc.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{inc.title}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-sm">{inc.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 inline-flex text-[10px] font-mono font-semibold rounded-full border ${getStatusBadge(inc.status)}`}>
                          {inc.status}
                        </span>
                        <span className="ml-2 text-[10px] font-mono text-slate-400 font-bold">{inc.priority}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                        <span className="flex items-center space-x-1.5 font-mono">
                          {inc.source === 'AI' ? <Activity size={12} className="text-purple-400" /> : <ShieldCheck size={12} className="text-slate-400" />}
                          <span>{inc.source}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {inc.slaBreached ? (
                          <span className="text-rose-400 font-mono text-[11px] flex items-center">
                            <Clock size={12} className="mr-1.5" /> SLA Breached
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-mono text-[11px] flex items-center">
                            <Clock size={12} className="mr-1.5" /> SLA On Track
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link 
                          href={`/dashboard/incidents/${inc.id}/rca`}
                          className="inline-flex items-center text-xs font-semibold text-cyan-400 hover:text-cyan-300 font-mono"
                        >
                          Inspect RCA <ArrowRight size={12} className="ml-1" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Declare Incident Modal */}
      {showDeclareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="stitch-card bg-[#111A2E] border border-rose-500/50 rounded-xl p-6 max-w-lg w-full shadow-2xl text-white font-mono space-y-4">
            <div className="flex justify-between items-center border-b border-[#24385E] pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="text-rose-400" size={18} />
                <h3 className="font-bold text-base text-white">Declare Network Incident</h3>
              </div>
              <button 
                onClick={() => setShowDeclareModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {submitError && (
              <div className="p-3 rounded-lg border border-rose-500/50 bg-rose-950/60 text-rose-300 text-xs flex items-center space-x-2">
                <AlertTriangle size={15} className="shrink-0 text-rose-400" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleDeclareSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">
                  Incident Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Core PE Router BGP Flap - NYC-01"
                  value={declareTitle}
                  onChange={(e) => setDeclareTitle(e.target.value)}
                  className="w-full bg-[#0E172B] border border-[#253961] rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Severity</label>
                  <select
                    value={declareSeverity}
                    onChange={(e) => setDeclareSeverity(e.target.value as Incident['severity'])}
                    className="w-full bg-[#0E172B] border border-[#253961] rounded-lg p-2 text-white focus:outline-none focus:border-rose-500 font-mono"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="MAJOR">MAJOR</option>
                    <option value="MINOR">MINOR</option>
                    <option value="INFO">INFO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Priority</label>
                  <select
                    value={declarePriority}
                    onChange={(e) => setDeclarePriority(e.target.value as Incident['priority'])}
                    className="w-full bg-[#0E172B] border border-[#253961] rounded-lg p-2 text-white focus:outline-none focus:border-rose-500 font-mono"
                  >
                    <option value="P1">P1 (Immediate)</option>
                    <option value="P2">P2 (Urgent)</option>
                    <option value="P3">P3 (Normal)</option>
                    <option value="P4">P4 (Low)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Source</label>
                  <select
                    value={declareSource}
                    onChange={(e) => setDeclareSource(e.target.value as Incident['source'])}
                    className="w-full bg-[#0E172B] border border-[#253961] rounded-lg p-2 text-white focus:outline-none focus:border-rose-500 font-mono"
                  >
                    <option value="MANUAL">MANUAL</option>
                    <option value="ALARM">ALARM</option>
                    <option value="ANOMALY">ANOMALY</option>
                    <option value="AI">AI</option>
                    <option value="INTEGRATION">INTEGRATION</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">Telemetry & Incident Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide technical context, affected sites, optical dBm loss, or alarms..."
                  value={declareDescription}
                  onChange={(e) => setDeclareDescription(e.target.value)}
                  className="w-full bg-[#0E172B] border border-[#253961] rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="p-3 rounded bg-[#0A1220] border border-[#182846] text-[11px] text-slate-400 space-y-1">
                <div className="text-cyan-300 font-bold flex items-center">
                  <Activity size={13} className="mr-1.5 text-cyan-400" />
                  Auto-RCA Pipeline Trigger
                </div>
                <p>Declaring this incident automatically engages the local AI correlator to construct real-time telemetry hypotheses.</p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#24385E]">
                <button
                  type="button"
                  onClick={() => setShowDeclareModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#182643] hover:bg-[#203256] text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-900/40 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin mr-1.5" />
                      Declaring...
                    </>
                  ) : (
                    'Dispatch Incident'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
