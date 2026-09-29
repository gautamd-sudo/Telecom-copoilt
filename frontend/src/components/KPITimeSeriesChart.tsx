"use client";

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface ChartProps {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  dataKey: string;
  timeKey?: string;
  threshold?: number;
  unit?: string;
  isLive?: boolean;
}

export function KPITimeSeriesChart({ title, data, dataKey, timeKey = 'time', threshold, unit, isLive }: ChartProps) {
  const [timeRange, setTimeRange] = useState('1h');

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-72 flex flex-col items-center justify-center border border-[#22375F] rounded-xl bg-[#0B1222] text-slate-400">
        <p className="text-sm font-medium">Awaiting telemetry telemetry stream for {title}...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
          </div>
          <div className="flex items-center space-x-3">
            {isLive && (
              <span className="flex items-center text-[10px] font-mono font-bold text-rose-400 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5 animate-pulse"></span> LIVE NOC
              </span>
            )}
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-xs font-mono border border-[#253961] rounded-lg px-2.5 py-1 bg-[#0E172B] text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="15m">Last 15m</option>
              <option value="1h">Last 1h</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7d</option>
            </select>
          </div>
        </div>
      )}

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A2845" />
            <XAxis dataKey={timeKey} tick={{ fontSize: 11, fill: '#94A3B8' }} stroke="#24385E" />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} stroke="#24385E" domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0D1527', 
                borderRadius: '8px', 
                border: '1px solid #24385E', 
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                color: '#F8FAFC',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}
              labelStyle={{ fontWeight: 'bold', color: '#38BDF8', marginBottom: '4px' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${value} ${unit || ''}`, dataKey.toUpperCase()]}
            />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#94A3B8', paddingTop: '8px' }} />
            {threshold && (
              <ReferenceLine y={threshold} label={{ position: 'top', value: 'SLA Threshold', fill: '#F43F5E', fontSize: 10 }} stroke="#F43F5E" strokeDasharray="3 3" />
            )}
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke="#00F0FF" 
                strokeWidth={2.5} 
                dot={false}
                activeDot={{ r: 6, fill: '#00F0FF', stroke: '#070B14', strokeWidth: 2 }} 
                isAnimationActive={true}
                animationDuration={500}
              />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
