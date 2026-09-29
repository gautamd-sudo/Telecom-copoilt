import React from 'react';
import { TrendingUp, TrendingDown, Radio } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number; // percentage
  status?: 'healthy' | 'warning' | 'critical' | 'offline';
  isLive?: boolean;
}

export function MetricCard({ title, value, unit, trend, status, isLive }: MetricCardProps) {
  // High-contrast, bright color configuration
  const statusConfig = {
    healthy: {
      cardClass: 'stitch-card-healthy',
      titleColor: 'text-emerald-300 font-semibold',
      valueColor: 'text-white',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      indicatorColor: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
      label: 'Optimal State',
    },
    warning: {
      cardClass: 'stitch-card-warning',
      titleColor: 'text-amber-300 font-semibold',
      valueColor: 'text-white',
      badgeClass: 'bg-amber-500/25 text-amber-200 border-amber-400/50',
      indicatorColor: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
      label: 'Degraded / Warning',
    },
    critical: {
      cardClass: 'stitch-card-critical',
      titleColor: 'text-rose-300 font-semibold',
      valueColor: 'text-white',
      badgeClass: 'bg-rose-500/25 text-rose-200 border-rose-400/50',
      indicatorColor: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]',
      label: 'Active Incident',
    },
    offline: {
      cardClass: 'stitch-card bg-gradient-to-b from-[#2A101C] to-[#160A10] border-rose-500/50 shadow-[0_4px_20px_rgba(244,63,94,0.15)]',
      titleColor: 'text-rose-300 font-semibold',
      valueColor: 'text-white',
      badgeClass: 'bg-rose-500/25 text-rose-200 border-rose-400/50',
      indicatorColor: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
      label: 'Offline Outage',
    },
  };

  const config = status ? statusConfig[status] : {
    cardClass: 'stitch-card bg-gradient-to-b from-[#14203A] to-[#0E172A] border-[#2B4370]',
    titleColor: 'text-cyan-300 font-semibold',
    valueColor: 'text-white',
    badgeClass: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
    indicatorColor: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]',
    label: 'Live Telemetry',
  };

  return (
    <div className={`${config.cardClass} p-6 rounded-xl flex flex-col justify-between group transition-all duration-200 min-h-[150px]`}>
      {/* Top Header */}
      <div className="flex justify-between items-center mb-3.5">
        <span className={`text-xs uppercase tracking-wider ${config.titleColor}`}>
          {title}
        </span>
        {isLive ? (
          <span className="flex items-center text-[10px] font-mono font-bold text-rose-300 bg-rose-500/25 border border-rose-400/50 px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.3)]">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5 animate-pulse"></span>
            LIVE NOC
          </span>
        ) : (
          <span className="flex items-center text-[10px] font-mono font-medium text-slate-300 bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded-md">
            <Radio size={11} className="mr-1 text-cyan-400" />
            15s STREAM
          </span>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="my-2 flex items-baseline justify-between">
        <div className="flex items-baseline space-x-1.5">
          <span className={`text-3xl font-black tracking-tight font-mono drop-shadow-sm ${config.valueColor}`}>
            {value}
          </span>
          {unit && (
            <span className="text-sm font-bold text-slate-300 font-mono">
              {unit}
            </span>
          )}
        </div>

        {trend !== undefined && (
          <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-md border ${
            trend >= 0 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.15)]' 
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.15)]'
          }`}>
            {trend >= 0 ? <TrendingUp size={13} className="mr-1" /> : <TrendingDown size={13} className="mr-1" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      {/* Footer Status Line */}
      <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between text-[11px]">
        <span className="flex items-center text-slate-300 font-medium">
          <span className={`w-2 h-2 rounded-full ${config.indicatorColor} mr-2`}></span>
          {config.label}
        </span>
        <span className="font-mono text-cyan-300/80 bg-cyan-950/60 border border-cyan-800/50 px-1.5 py-0.2 rounded text-[10px]">
          99.98% SLA
        </span>
      </div>
    </div>
  );
}
