"use client";

import React, { useState } from 'react';
import { MetricCard } from '@/components/MetricCard';
import { KPITimeSeriesChart } from '@/components/KPITimeSeriesChart';
import { ServerOff, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';

export default function RegionDashboard({ params }: { params: { id: string } }) {
  const regionName = params.id.toUpperCase();
  
  // Historical Demo Data
  const [throughputData, setThroughputData] = useState<{ time: string; value: number }[]>([]);

  React.useEffect(() => {
    const data = [];
    const now = new Date();
    for (let i = 24; i >= 0; i--) {
      data.push({
        time: new Date(now.getTime() - i * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: Number((Math.random() * (100 - 50) + 50).toFixed(2))
      });
    }
    setThroughputData(data);
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Stitch Regional Header */}
      <div className="stitch-card p-5 border border-[#24385E] bg-gradient-to-r from-[#111A2E] via-[#15233E] to-[#0E172A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-cyan-400 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>REGIONAL NOC MONITOR</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Region: {regionName}</h1>
          <p className="text-xs text-slate-300 mt-0.5">Live regional health telemetry, site outage matrix, and cell status.</p>
        </div>
        
        <div className="flex items-center space-x-2 text-xs font-mono text-rose-300 bg-rose-500/20 border border-rose-500/40 px-3 py-1.5 rounded-lg shadow-[0_0_10px_rgba(244,63,94,0.15)]">
          <AlertTriangle size={14} className="text-rose-400 mr-1" />
          <span className="font-bold">3 OUTAGES DETECTED</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard title="Regional Availability" value="99.8" unit="%" trend={-0.1} status="warning" isLive />
        <MetricCard title="Sites Online" value="452/455" unit="sites" status="warning" />
        <MetricCard title="Active Regional Alarms" value="12" unit="alarms" status="critical" isLive />
        <MetricCard title="Avg Latency" value="28" unit="ms" trend={2} status="healthy" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Throughput Chart */}
        <div className="lg:col-span-2 stitch-card p-6 border border-[#24385E]">
          <KPITimeSeriesChart 
            title={`24h Regional Throughput (${regionName})`}
            data={throughputData} 
            dataKey="value" 
            unit="Gbps" 
            isLive={false} 
          />
        </div>
        
        {/* Offline Sites Section (High-Visibility Stitch Redesigned) */}
        <div className="stitch-card p-6 border border-rose-500/40 bg-gradient-to-b from-[#1C0F1A] via-[#140B14] to-[#0E070E] flex flex-col shadow-[0_4px_20px_rgba(244,63,94,0.15)]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-rose-500/20">
            <div className="flex items-center space-x-2">
              <ShieldAlert size={18} className="text-rose-400" />
              <h3 className="text-sm font-bold text-white tracking-wide font-mono">Offline Sites</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/25 text-rose-200 border border-rose-400/50 font-bold shadow-[0_0_8px_rgba(244,63,94,0.3)]">
              3 DOWN
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className="flex items-center justify-between p-3.5 bg-[#25101A] border border-rose-500/35 hover:border-rose-400 rounded-xl transition-all group shadow-sm"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mr-3 shrink-0 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                    <ServerOff className="text-rose-300" size={16} />
                  </div>
                  <div>
                    <a 
                      href={`/dashboard/site/SITE_${i}`} 
                      className="text-xs font-bold font-mono text-rose-100 group-hover:text-white group-hover:underline flex items-center"
                    >
                      SITE_{regionName}_00{i}
                      <ArrowRight size={11} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    <p className="text-[11px] font-mono text-rose-300/90 mt-0.5">
                      Power Failure · Down for {i * 15}m
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950/80 border border-rose-700/60 text-rose-200">
                  CRITICAL
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-rose-500/20 flex items-center justify-between text-[11px] font-mono text-rose-300/80">
            <span>Escalation: NOC Auto-Dispatched</span>
            <span className="text-rose-400 font-bold">P1 Incident</span>
          </div>
        </div>

      </div>
    </div>
  );
}
