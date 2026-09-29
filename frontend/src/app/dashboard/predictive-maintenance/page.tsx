"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Wrench, Server, ShieldCheck, CheckCircle, CheckCircle2, XCircle, Search, Cpu, Loader2, ArrowRight, RotateCcw, FileText } from 'lucide-react';

const INVENTORY = [
  {
    id: "EQ-NYC-01-BBU",
    type: "Baseband Unit",
    site: "SITE-NYC-01",
    risk: "CRITICAL",
    failProb: 0.75,
    prediction: {
      model: "XGBoost-Failure-Predictor",
      version: "v2.1",
      timestamp: "2026-09-24T18:00:00Z",
      features: { age_days: 1820, temp_c: 78.5, power_events: 2, alarms: 6, throughput_drop_pct: 16.2 },
      confidence: 0.88,
      evidence: [
        "Equipment age (1820 days) exceeds 4-year optimal lifespan.",
        "Operating temperature (78.5°C) is critically high.",
        "High frequency of recent alarms (6 in 7 days)."
      ],
      recommendations: [
        "Inspect HVAC and site cooling immediately.",
        "Schedule hardware lifecycle replacement."
      ]
    }
  },
  {
    id: "EQ-LON-402-RRU",
    type: "Remote Radio Unit",
    site: "SITE-LON-04",
    risk: "MEDIUM",
    failProb: 0.15,
    prediction: {
      model: "XGBoost-Failure-Predictor",
      version: "v2.1",
      timestamp: "2026-09-24T18:00:00Z",
      features: { age_days: 800, temp_c: 45.0, power_events: 3, alarms: 1, throughput_drop_pct: 18.0 },
      confidence: 0.92,
      evidence: [
        "Experienced 3 power fluctuation events.",
        "Sustained throughput degradation of 18.0%."
      ],
      recommendations: [
        "Verify UPS battery health."
      ]
    }
  },
  {
    id: "EQ-SFO-201-ANT",
    type: "Massive MIMO Antenna",
    site: "SITE-SFO-02",
    risk: "LOW",
    failProb: 0.05,
    prediction: {
      model: "XGBoost-Failure-Predictor",
      version: "v2.1",
      timestamp: "2026-09-24T18:00:00Z",
      features: { age_days: 200, temp_c: 35.0, power_events: 0, alarms: 0, throughput_drop_pct: 2.0 },
      confidence: 0.95,
      evidence: [
        "Operating nominally within thresholds."
      ],
      recommendations: [
        "Continue standard monitoring."
      ]
    }
  }
];

interface DispatchRecord {
  status: 'DISPATCHED' | 'DISMISSED';
  workOrderId: string;
  timestamp: string;
  crew: string;
  eta: string;
}

export default function PredictiveMaintenancePage() {
  const [selectedEq, setSelectedEq] = useState<string | null>("EQ-NYC-01-BBU");
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchMap, setDispatchMap] = useState<Record<string, DispatchRecord>>({});

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleApproveDispatch = (eq: typeof INVENTORY[0]) => {
    setIsDispatching(true);
    setTimeout(() => {
      const siteCode = eq.site.replace('SITE-', '');
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const woId = `WO-${siteCode}-${randomId}`;
      const crewName = eq.risk === 'CRITICAL' ? 'Tier-1 Emergency Field Ops Squad Alpha' : 'Regional Field Rapid Response Squad';
      const eta = eq.risk === 'CRITICAL' ? '< 90 Mins' : '< 4 Hours';
      
      setDispatchMap(prev => ({
        ...prev,
        [eq.id]: {
          status: 'DISPATCHED',
          workOrderId: woId,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          crew: crewName,
          eta
        }
      }));
      setIsDispatching(false);
    }, 400);
  };

  const handleDismiss = (eqId: string) => {
    setDispatchMap(prev => ({
      ...prev,
      [eqId]: {
        status: 'DISMISSED',
        workOrderId: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        crew: '',
        eta: ''
      }
    }));
  };

  const handleUndo = (eqId: string) => {
    setDispatchMap(prev => {
      const next = { ...prev };
      delete next[eqId];
      return next;
    });
  };

  const filteredInventory = INVENTORY.filter(eq => 
    eq.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eq.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eq.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRiskStyle = (risk: string) => {
    switch(risk) {
      case 'CRITICAL': return "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]";
      case 'HIGH': return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case 'MEDIUM': return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      default: return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Stitch Header */}
      <div className="stitch-card p-6 border border-[#24385E] bg-gradient-to-r from-[#111A2E] via-[#15233E] to-[#0E172A] flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-cyan-400 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-bold tracking-wider">HARDWARE RELIABILITY FORECASTER</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <Wrench className="mr-2.5 text-cyan-400" size={24} />
            Predictive Maintenance Matrix
          </h1>
          <p className="text-xs text-slate-300 font-mono mt-1">
            Machine learning failure forecasting and operational health classification.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Inventory List */}
        <div className="lg:col-span-1 stitch-card border border-[#24385E] bg-[#111A2E] overflow-hidden h-[620px] flex flex-col">
          <div className="p-3.5 border-b border-[#1E2E4E] bg-[#0E172B] flex items-center">
            <Search size={15} className="text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search equipment ID or site..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-xs text-slate-100 placeholder-slate-400 w-full font-mono" 
            />
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-[#182643]">
            {filteredInventory.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-slate-400">
                No equipment matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredInventory.map((eq) => {
                const dispatch = dispatchMap[eq.id];
                return (
                  <div 
                    key={eq.id} 
                    onClick={() => setSelectedEq(eq.id)}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedEq === eq.id 
                        ? 'bg-[#182847] border-l-4 border-l-cyan-400 text-white shadow-inner' 
                        : 'hover:bg-[#14203A] text-slate-300 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-mono text-xs font-bold text-white">{eq.id}</span>
                      <div className="flex items-center space-x-1.5">
                        {dispatch?.status === 'DISPATCHED' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                            DISPATCHED
                          </span>
                        )}
                        {dispatch?.status === 'DISMISSED' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            DISMISSED
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getRiskStyle(eq.risk)}`}>
                          {eq.risk}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 font-mono truncate">{eq.type} · {eq.site}</p>
                    <div className="mt-2.5 w-full bg-[#1A2640] rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full ${eq.failProb > 0.5 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : eq.failProb > 0.2 ? 'bg-amber-400' : 'bg-emerald-400'}`} 
                        style={{ width: `${eq.failProb * 100}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Prediction Details */}
        <div className="lg:col-span-2 stitch-card border border-[#24385E] bg-[#111A2E] p-6">
          {selectedEq ? (
            (() => {
              const eq = INVENTORY.find(x => x.id === selectedEq) || filteredInventory[0];
              if (!eq) {
                return (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20">
                    <Wrench size={48} className="mb-4 opacity-30 text-cyan-400" />
                    <p className="text-xs font-mono">No equipment selected or matching search filter.</p>
                  </div>
                );
              }
              const dispatch = dispatchMap[eq.id];
              return (
                <div className="space-y-6">
                  <div className="flex justify-between items-start border-b border-[#24385E] pb-4">
                    <div>
                      <h2 className="text-2xl font-black text-white flex items-center font-mono">
                        <Server className="mr-2.5 text-cyan-400" size={22} /> {eq.id}
                      </h2>
                      <p className="text-xs text-slate-300 font-mono mt-1">{eq.type} — {eq.site}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Failure Probability</p>
                      <p className={`text-3xl font-black font-mono mt-1 ${eq.failProb > 0.5 ? 'text-rose-400' : eq.failProb > 0.2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {(eq.failProb * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="border border-[#253961] rounded-lg p-3 bg-[#15233E]">
                      <p className="text-[10px] font-bold text-slate-300 uppercase font-mono">ML Architecture</p>
                      <p className="font-mono text-xs font-bold text-cyan-300 mt-1 truncate">{eq.prediction.model}</p>
                    </div>
                    <div className="border border-[#253961] rounded-lg p-3 bg-[#15233E]">
                      <p className="text-[10px] font-bold text-slate-300 uppercase font-mono">Model Version</p>
                      <p className="font-mono text-xs font-bold text-slate-100 mt-1">{eq.prediction.version}</p>
                    </div>
                    <div className="border border-[#253961] rounded-lg p-3 bg-[#15233E]">
                      <p className="text-[10px] font-bold text-slate-300 uppercase font-mono">Inference Confidence</p>
                      <p className="font-mono text-xs font-bold text-emerald-400 mt-1">{(eq.prediction.confidence * 100).toFixed(0)}%</p>
                    </div>
                    <div className="border border-[#253961] rounded-lg p-3 bg-[#15233E]">
                      <p className="text-[10px] font-bold text-slate-300 uppercase font-mono">Evaluation Timestamp</p>
                      <p suppressHydrationWarning className="font-mono text-xs text-slate-300 mt-1">
                        {mounted ? new Date(eq.prediction.timestamp).toLocaleTimeString() : "18:00:00 UTC"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center font-mono">
                      <Cpu size={14} className="mr-2 text-cyan-400" /> Model Features & Telemetry Attribution
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border border-[#253961] rounded-xl p-4 bg-[#15233E]">
                        <p className="text-[10px] font-bold text-slate-300 mb-2 uppercase font-mono">Input Features</p>
                        <ul className="text-xs font-mono text-slate-200 space-y-1.5">
                          <li>Operating Age: <span className="text-cyan-300">{eq.prediction.features.age_days} days</span></li>
                          <li>Core Temperature: <span className="text-amber-300">{eq.prediction.features.temp_c}°C</span></li>
                          <li>Alarms (7 Days): <span className="text-rose-300">{eq.prediction.features.alarms} events</span></li>
                          <li>Power Fluctuation: <span className="text-slate-300">{eq.prediction.features.power_events}</span></li>
                          <li>Throughput Degradation: <span className="text-rose-300">{eq.prediction.features.throughput_drop_pct}%</span></li>
                        </ul>
                      </div>
                      <div className="border border-indigo-500/35 rounded-xl p-4 bg-indigo-950/30">
                        <p className="text-[10px] font-bold text-indigo-300 mb-2 uppercase font-mono">AI Assessment</p>
                        <ul className="text-xs font-mono text-indigo-100 space-y-2 list-disc pl-4">
                          {eq.prediction.evidence.map((ev, idx) => (
                            <li key={idx}>{ev}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Prescribed Maintenance Dispatch Section */}
                  {dispatch?.status === 'DISPATCHED' ? (
                    <div className="bg-[#0C1E1E] border border-emerald-500/40 rounded-xl p-5 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center font-mono">
                          <CheckCircle2 size={16} className="mr-2 text-emerald-400" /> Maintenance Dispatch Approved & Transmitted
                        </h3>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {dispatch.workOrderId}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3 bg-[#081515] p-3 rounded-lg border border-emerald-500/20 font-mono text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Assigned Field Crew</span>
                          <span className="text-emerald-200 font-bold">{dispatch.crew}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">SLA Target Resolution</span>
                          <span className="text-cyan-300 font-bold">{dispatch.eta}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Dispatch Timestamp</span>
                          <span className="text-slate-300 font-bold">{dispatch.timestamp}</span>
                        </div>
                      </div>

                      <p className="text-[11px] font-mono text-slate-300 mb-1.5 font-bold">Prescribed Actions Dispatched to Field Crew:</p>
                      <ul className="text-xs font-mono text-emerald-100 mb-4 list-disc pl-5 space-y-1">
                        {eq.prediction.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>

                      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-emerald-500/20">
                        <Link 
                          href={`/dashboard/copilot?prompt=${encodeURIComponent(`Review field maintenance work order ${dispatch.workOrderId} dispatched for ${eq.id} at ${eq.site}. Prescribed actions: ${eq.prediction.recommendations.join(', ')}`)}`}
                          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all font-mono"
                        >
                          <FileText size={14} className="mr-1.5" /> Track in AI Copilot <ArrowRight size={13} className="ml-1.5" />
                        </Link>
                        <button 
                          onClick={() => handleUndo(eq.id)} 
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-lg font-bold text-xs flex items-center transition-all font-mono"
                        >
                          <RotateCcw size={14} className="mr-1.5" /> Revoke Dispatch
                        </button>
                      </div>
                    </div>
                  ) : dispatch?.status === 'DISMISSED' ? (
                    <div className="bg-[#181D29] border border-slate-700/60 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center font-mono">
                          <XCircle size={16} className="mr-2 text-slate-400" /> Prescribed Dispatch Dismissed
                        </h3>
                        <span className="text-[10px] font-mono text-slate-400">Archived at {dispatch.timestamp}</span>
                      </div>
                      <p className="text-xs font-mono text-slate-400 mb-4">
                        The AI recommendation was acknowledged and dismissed for this maintenance cycle.
                      </p>
                      <button 
                        onClick={() => handleUndo(eq.id)} 
                        className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-4 py-2 rounded-lg font-bold text-xs flex items-center transition-all font-mono border border-[#253961]"
                      >
                        <RotateCcw size={14} className="mr-1.5" /> Restore Prescription
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[#241B0E] border border-amber-500/40 rounded-xl p-5 shadow-sm">
                      <h3 className="text-xs font-bold text-amber-200 uppercase tracking-wider mb-2 flex items-center font-mono">
                        <ShieldCheck size={16} className="mr-2 text-amber-400" /> Prescribed Maintenance Dispatch (Pending Approval)
                      </h3>
                      <ul className="text-xs font-mono text-amber-100 mb-4 list-disc pl-5 space-y-1">
                        {eq.prediction.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                      
                      <div className="flex space-x-3 pt-3 border-t border-amber-500/25">
                        <button 
                          onClick={() => handleApproveDispatch(eq)}
                          disabled={isDispatching}
                          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all font-mono cursor-pointer"
                        >
                          {isDispatching ? (
                            <>
                              <Loader2 size={15} className="mr-1.5 animate-spin" />
                              Transmitting Work Order...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={15} className="mr-1.5" />
                              Approve Maintenance Dispatch
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => handleDismiss(eq.id)}
                          disabled={isDispatching}
                          className="bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-300 px-4 py-2 rounded-lg font-bold text-xs flex items-center transition-all font-mono cursor-pointer"
                        >
                          <XCircle size={15} className="mr-1.5" /> Dismiss
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })()
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20">
              <Wrench size={48} className="mb-4 opacity-30 text-cyan-400" />
              <p className="text-xs font-mono">Select equipment unit to inspect neural degradation forecast.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
