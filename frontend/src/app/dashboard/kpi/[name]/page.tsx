"use client";

import React, { useState } from 'react';
import { KPITimeSeriesChart } from '@/components/KPITimeSeriesChart';
import { Activity, Radio, Filter, CheckCircle2, TrendingUp } from 'lucide-react';

export default function KPIDashboard({ params }: { params: { name: string } }) {
  const kpiName = params.name === 'all' 
    ? 'NETWORK AVAILABILITY & THROUGHPUT' 
    : params.name.replace(/-/g, ' ').toUpperCase();
  
  const [selectedCell, setSelectedCell] = useState('ALL_CELLS');
  const [selectedTech, setSelectedTech] = useState('ALL_TECH');

  const [data, setData] = useState<{ time: string; value: number }[]>([]);

  React.useEffect(() => {
    const d = [];
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
      d.push({
        time: new Date(now.getTime() - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: Number((Math.random() * (10) + 90).toFixed(2)) // 90 to 100 range
      });
    }
    setData(d);

    const interval = setInterval(() => {
      const nextTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setData(prev => {
        const nextValue = Number((Math.random() * (10) + 90).toFixed(2));
        const updated = [...prev, { time: nextTime, value: nextValue }];
        if (updated.length > 30) {
          return updated.slice(updated.length - 30);
        }
        return updated;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Stitch KPI Explorer Header */}
      <div className="stitch-card p-6 border border-[#24385E] bg-gradient-to-r from-[#111A2E] via-[#15233E] to-[#0E172A] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-cyan-400 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-bold tracking-wider">TELEMETRY DRILLDOWN & ANALYTICS</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <Activity className="mr-2.5 text-cyan-400" size={24} />
            KPI Explorer: {kpiName}
          </h1>
          <p className="text-xs text-slate-300 font-mono mt-1">
            Real-time telemetry stream, moving average evaluation, and SLA threshold monitoring.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 px-3 py-1.5 rounded-lg shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            <Radio size={12} className="text-emerald-400 animate-pulse" />
            <span className="font-bold">60s STREAM ACTIVE</span>
          </div>
        </div>
      </div>

      {/* KPI Micro Stat Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="stitch-card p-6 sm:p-7 border border-[#24385E] bg-[#111A2E] flex flex-col justify-between min-h-[145px] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block mb-2">Current Aggregate</span>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white font-mono">98.42%</span>
            <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-1 rounded-md flex items-center shadow-[0_0_8px_rgba(16,185,129,0.15)]">
              <TrendingUp size={12} className="mr-1" /> +0.2%
            </span>
          </div>
          <div className="pt-3 border-t border-white/10 text-[11px] font-mono text-slate-400">
            Telemetry Stream Live
          </div>
        </div>

        <div className="stitch-card p-6 sm:p-7 border border-[#24385E] bg-[#111A2E] flex flex-col justify-between min-h-[145px] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block mb-2">SLA Minimum Threshold</span>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-rose-300 font-mono">95.00%</span>
            <span className="text-xs font-mono text-rose-200 font-semibold bg-rose-500/20 border border-rose-400/40 px-2.5 py-1 rounded-md">
              SAFE
            </span>
          </div>
          <div className="pt-3 border-t border-white/10 text-[11px] font-mono text-slate-400">
            SLA Compliance: Verified
          </div>
        </div>

        <div className="stitch-card p-6 sm:p-7 border border-[#24385E] bg-[#111A2E] flex flex-col justify-between min-h-[145px] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block mb-2">Data Window</span>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-cyan-300 font-mono">30 Mins</span>
            <span className="text-xs font-mono text-cyan-200 font-semibold bg-cyan-500/20 border border-cyan-400/40 px-2.5 py-1 rounded-md">
              30 Samples
            </span>
          </div>
          <div className="pt-3 border-t border-white/10 text-[11px] font-mono text-slate-400">
            Sample Interval: 60s
          </div>
        </div>
      </div>

      {/* High-Contrast Filter Bar */}
      <div className="stitch-card p-5 sm:p-6 border border-[#24385E] bg-[#111A2E] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-200 font-bold">
            <Filter size={15} className="text-cyan-400" />
            <span>Filters:</span>
          </div>

          <select 
            value={selectedCell} 
            onChange={(e) => setSelectedCell(e.target.value)}
            className="border border-[#263D6B] rounded-lg px-3 py-2 text-xs font-mono bg-[#15233E] text-slate-100 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL_CELLS">All Network Cells</option>
            <option value="CELL_NYC_101">CELL_NYC_101 (NYC-01)</option>
            <option value="CELL_NYC_102">CELL_NYC_102 (NYC-01)</option>
            <option value="CELL_BOS_201">CELL_BOS_201 (BOS-01)</option>
          </select>

          <select 
            value={selectedTech} 
            onChange={(e) => setSelectedTech(e.target.value)}
            className="border border-[#263D6B] rounded-lg px-3 py-2 text-xs font-mono bg-[#15233E] text-slate-100 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL_TECH">All Radio Technologies</option>
            <option value="5G_NR">5G Standalone (NR)</option>
            <option value="4G_LTE">4G LTE Core</option>
          </select>
        </div>

        <button className="bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white px-5 py-2 rounded-lg text-xs font-bold font-mono shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all flex items-center">
          <CheckCircle2 size={14} className="mr-1.5" />
          Apply Parameters
        </button>
      </div>

      {/* Main KPI Chart Card */}
      <div className="stitch-card p-6 sm:p-8 border border-[#24385E] bg-[#111A2E] shadow-[0_4px_25px_rgba(0,0,0,0.55)]">
        <KPITimeSeriesChart 
          title={`${kpiName} - 30 Minute Moving Average`}
          data={data} 
          dataKey="value" 
          threshold={95} 
          unit="%"
          isLive={true} 
        />
      </div>

    </div>
  );
}
