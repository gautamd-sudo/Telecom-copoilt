"use client";

import React, { useState, useEffect } from 'react';
import { BrainCircuit, Search, Activity, ShieldAlert, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';

interface Anomaly {
  id: string;
  tenant: string;
  network: string;
  region: string;
  site: string;
  cell: string;
  metric: string;
  observed_value: number;
  expected_value: number;
  anomaly_score: number;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  detected_at: string;
  model: string;
  explanation: string;
}

export default function AnomalyDashboard() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedModel, setSelectedModel] = useState("All");
  const [selectedSeverity, setSelectedSeverity] = useState("All");

  const fetchAnomalies = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/anomalies');
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load anomalies`);
      const data = await res.json();
      setAnomalies(data.anomalies ?? []);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error loading anomalies';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 60000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityCardBorder = (severity: string) => {
    switch(severity) {
      case 'CRITICAL': return 'border-rose-500/40 hover:border-rose-400 shadow-[0_4px_20px_rgba(244,63,94,0.1)]';
      case 'MAJOR': return 'border-amber-500/40 hover:border-amber-400 shadow-[0_4px_20px_rgba(245,158,11,0.1)]';
      case 'MINOR': return 'border-yellow-500/35 hover:border-yellow-400';
      default: return 'border-[#22375F] hover:border-cyan-400/50';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'CRITICAL': 
        return 'bg-rose-500/25 text-rose-200 border-rose-400/60 shadow-[0_0_12px_rgba(244,63,94,0.3)] font-bold';
      case 'MAJOR': 
        return 'bg-amber-500/25 text-amber-200 border-amber-400/60 font-bold';
      case 'MINOR': 
        return 'bg-yellow-500/20 text-yellow-200 border-yellow-400/50 font-bold';
      default: 
        return 'bg-slate-800 text-slate-300 border-slate-600';
    }
  };

  const filtered = anomalies.filter(a => {
    const matchesSearch = !search || 
      a.cell.toLowerCase().includes(search.toLowerCase()) ||
      a.site.toLowerCase().includes(search.toLowerCase()) ||
      a.metric.toLowerCase().includes(search.toLowerCase()) ||
      a.model.toLowerCase().includes(search.toLowerCase());
    
    const matchesModel = selectedModel === "All" || a.model.toLowerCase().includes(selectedModel.toLowerCase());
    const matchesSeverity = selectedSeverity === "All" || a.severity === selectedSeverity;

    return matchesSearch && matchesModel && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      
      {/* Stitch AI Header */}
      <div className="stitch-card p-6 border border-[#24385E] bg-gradient-to-r from-[#111A2E] via-[#15233E] to-[#0E172A]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5 mb-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-200 border border-purple-400/40">
                <BrainCircuit size={11} className="mr-1.5 text-purple-400" />
                NEURAL ANOMALY DETECTOR
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300 font-mono">SCIKIT-LEARN & STATISTICAL PIPELINE</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
              AI Anomaly Classification Matrix
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Multi-model detection running Isolation Forests, Rolling Baselines, and Dynamic Thresholding on live telemetry.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={fetchAnomalies}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#172542] border border-cyan-400/40 text-cyan-200 hover:bg-[#1E3157] transition-all flex items-center"
            >
              <RefreshCw size={13} className={`mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Stream
            </button>
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 px-3 py-1.5 rounded-lg shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold">{anomalies.length} ACTIVE ANOMALIES</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input 
            type="text" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search cells, sites, metrics, or model name..." 
            className="w-full pl-9 pr-4 py-2 bg-[#111A2E] border border-[#24385E] rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(0,240,255,0.2)] transition-all"
          />
        </div>

        <select 
          value={selectedModel}
          onChange={e => setSelectedModel(e.target.value)}
          className="bg-[#111A2E] border border-[#24385E] rounded-lg px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-400"
        >
          <option value="All">All Detection Models</option>
          <option value="IsolationForest">Isolation Forest</option>
          <option value="RollingBaseline">Rolling Baseline</option>
          <option value="Statistical">Statistical Threshold</option>
        </select>

        <select 
          value={selectedSeverity}
          onChange={e => setSelectedSeverity(e.target.value)}
          className="bg-[#111A2E] border border-[#24385E] rounded-lg px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-400"
        >
          <option value="All">All Severities</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="MAJOR">MAJOR</option>
          <option value="MINOR">MINOR</option>
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="stitch-card p-4 border-rose-500/50 bg-rose-950/40 text-rose-200 text-xs rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert size={16} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchAnomalies} className="underline text-rose-300 font-bold ml-4">Retry</button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-purple-500/20 border-t-purple-400 animate-spin"></div>
          <span className="text-xs font-mono text-slate-300 tracking-wider">Evaluating Telemetry with ML Models...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="stitch-card p-12 text-center border border-[#24385E]">
          <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Anomalies Detected</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            All network cells and telemetry streams are operating within acceptable baseline boundaries.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(anomaly => (
            <div 
              key={anomaly.id} 
              className={`stitch-card p-5 border ${getSeverityCardBorder(anomaly.severity)} transition-all group`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-0.5 text-[10px] font-mono rounded border ${getSeverityBadge(anomaly.severity)}`}>
                    {anomaly.severity}
                  </span>
                  <h3 className="text-base font-bold text-white font-mono tracking-tight">
                    {anomaly.cell}
                  </h3>
                  <span className="text-xs font-mono text-cyan-300">
                    {anomaly.region} / {anomaly.site} · {anomaly.network}
                  </span>
                </div>
                <div suppressHydrationWarning className="text-[11px] font-mono text-slate-400">
                  Detected: {new Date(anomaly.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>

              {/* Metric breakdown row */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#14203A] border border-[#253961] p-3 rounded-lg">
                  <span className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Metric</span>
                  <span className="block text-sm font-bold text-white font-mono mt-1 capitalize">{anomaly.metric}</span>
                </div>
                <div className="bg-[#14203A] border border-[#253961] p-3 rounded-lg">
                  <span className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Observed vs Expected</span>
                  <span className="block text-sm font-bold text-white font-mono mt-1">
                    {anomaly.observed_value} <span className="text-slate-400 font-normal">/ {Number(anomaly.expected_value).toFixed(2)}</span>
                  </span>
                </div>
                <div className="bg-[#14203A] border border-[#253961] p-3 rounded-lg">
                  <span className="block text-[10px] font-bold text-purple-300 uppercase tracking-wider font-mono">Anomaly Score</span>
                  <span className="block text-sm font-bold text-purple-300 font-mono mt-1">
                    {Number(anomaly.anomaly_score).toFixed(2)}
                  </span>
                </div>
                <div className="bg-[#14203A] border border-[#253961] p-3 rounded-lg">
                  <span className="block text-[10px] font-bold text-cyan-300 uppercase tracking-wider font-mono">Classification Model</span>
                  <span className="block text-sm font-bold text-cyan-300 font-mono mt-1">{anomaly.model}</span>
                </div>
              </div>

              {/* AI Explanation bar with deep link to Copilot */}
              <div className="mt-4 bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-transparent border border-cyan-500/35 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_2px_12px_rgba(0,240,255,0.06)]">
                <div className="flex items-start space-x-2.5">
                  <Activity size={16} className="text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-cyan-200">Feature Attribution & Explanation</h4>
                    <p className="text-xs text-slate-200 mt-0.5">{anomaly.explanation}</p>
                  </div>
                </div>
                <a 
                  href={`/dashboard/copilot?prompt=${encodeURIComponent(`Analyze the ${anomaly.severity} ${anomaly.metric} anomaly on ${anomaly.cell} (${anomaly.region}/${anomaly.site}): observed ${anomaly.observed_value} vs expected ${Number(anomaly.expected_value).toFixed(2)}, anomaly score ${Number(anomaly.anomaly_score).toFixed(2)}. What is the root cause and mitigation?`)}`}
                  className="shrink-0 px-3.5 py-1.5 rounded-md text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 flex items-center transition-all shadow-[0_0_10px_rgba(0,240,255,0.15)]"
                >
                  Analyze in Copilot
                  <ArrowRight size={13} className="ml-1.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
