"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MetricCard } from '@/components/MetricCard';
import dynamic from 'next/dynamic';
const KPITimeSeriesChart = dynamic(() => import('@/components/KPITimeSeriesChart').then(mod => mod.KPITimeSeriesChart), { ssr: false });
import { Radio, Zap, Cpu, RefreshCw, Clock, Activity } from 'lucide-react';

interface MetricPoint {
  time: string;
  value: number;
  [key: string]: string | number;
}

const generateTimeSeries = (points: number, min: number, max: number) => {
  const data = [];
  const now = new Date();
  for (let i = points; i >= 0; i--) {
    data.push({
      time: new Date(now.getTime() - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: Number((Math.random() * (max - min) + min).toFixed(2))
    });
  }
  return data;
};

export default function NetworkOverview() {
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(60);
  const [countdown, setCountdown] = useState<number>(60);
  const [lastUpdated, setLastUpdated] = useState("");
  
  // Real-time second-by-second heartbeat metrics
  const [packetsStreamed, setPacketsStreamed] = useState<number>(2418930);
  const [currentBps, setCurrentBps] = useState<number>(684.2);

  // Live Top-Level KPI States
  const [networkHealth, setNetworkHealth] = useState({ value: "99.98", trend: 0.01 });
  const [activeCells, setActiveCells] = useState({ value: "12,450", trend: 2.4 });
  const [degradedCells, setDegradedCells] = useState({ value: "3", trend: -15 });
  const [activeIncidents, setActiveIncidents] = useState({ value: "1", trend: -50 });
  const [meanLatency, setMeanLatency] = useState({ value: "21.4", trend: -4.2 });
  const [handoverSuccess, setHandoverSuccess] = useState({ value: "99.2", trend: 0.15 });
  const [packetDropRatio, setPacketDropRatio] = useState({ value: "0.08", trend: -0.02 });

  // Telemetry Chart Streams
  const [latencyData, setLatencyData] = useState<MetricPoint[]>([]);
  const [throughputData, setThroughputData] = useState<MetricPoint[]>([]);
  const [meanLatencyText, setMeanLatencyText] = useState("Mean 21.8ms");
  const [peakThroughputText, setPeakThroughputText] = useState("Peak 780 Gbps");

  // Ref to hold current latency/throughput for clean synchronous calculations
  const latencyRef = useRef<MetricPoint[]>([]);
  const throughputRef = useRef<MetricPoint[]>([]);

  // Core update function called on cycle completion or manual sync
  const updateLiveData = useCallback(() => {
    setIsUpdating(true);
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedLastUpdated = now.toUTCString().slice(17, 25) + ' UTC';
    setLastUpdated(formattedLastUpdated);

    // 1. Generate noticeable telemetry points
    const newLatencyVal = Number((Math.random() * (34 - 18) + 18).toFixed(1));
    const newThroughputVal = Number(Math.round(Math.random() * (810 - 540) + 540));

    // Update Latency Stream
    const currentLat = latencyRef.current.length > 0 ? latencyRef.current : generateTimeSeries(24, 18, 38);
    const nextLat = [...currentLat.slice(1), { time: timeLabel, value: newLatencyVal }];
    latencyRef.current = nextLat;
    setLatencyData(nextLat);
    const avgLat = (nextLat.reduce((sum, p) => sum + Number(p.value), 0) / nextLat.length).toFixed(1);
    setMeanLatencyText(`Mean ${avgLat}ms`);

    // Update Throughput Stream
    const currentThr = throughputRef.current.length > 0 ? throughputRef.current : generateTimeSeries(24, 450, 780);
    const nextThr = [...currentThr.slice(1), { time: timeLabel, value: newThroughputVal }];
    throughputRef.current = nextThr;
    setThroughputData(nextThr);
    const peakThr = Math.max(...nextThr.map(p => Number(p.value)));
    setPeakThroughputText(`Peak ${peakThr} Gbps`);

    // 2. Refresh top-level KPIs with noticeable live values
    const healthNum = (99.88 + Math.random() * 0.11).toFixed(2);
    const healthTrendNum = Number(((Math.random() * 0.08) - 0.04).toFixed(2));
    setNetworkHealth({ value: healthNum, trend: healthTrendNum });

    const totalCellsNum = (12440 + Math.floor(Math.random() * 20)).toLocaleString();
    setActiveCells({ value: totalCellsNum, trend: Number((1.8 + Math.random() * 1.4).toFixed(1)) });

    const degradedNum = Math.floor(Math.random() * 4) + 1; // 1 to 4
    setDegradedCells({ value: `${degradedNum}`, trend: degradedNum > 2 ? 16 : -18 });

    const incidentNum = Math.floor(Math.random() * 3); // 0 to 2
    setActiveIncidents({ value: `${incidentNum}`, trend: incidentNum > 1 ? 33 : -45 });

    const latencyDisplay = (19.4 + Math.random() * 5.2).toFixed(1);
    setMeanLatency({ value: latencyDisplay, trend: Number((Math.random() * 8 - 4).toFixed(1)) });

    const handoverDisplay = (98.9 + Math.random() * 0.9).toFixed(1);
    setHandoverSuccess({ value: handoverDisplay, trend: Number((Math.random() * 0.4 - 0.2).toFixed(2)) });

    const dropDisplay = (0.05 + Math.random() * 0.06).toFixed(2);
    setPacketDropRatio({ value: dropDisplay, trend: Number((Math.random() * 0.05 - 0.02).toFixed(2)) });

    setTimeout(() => {
      setIsUpdating(false);
    }, 600);
  }, []);

  // Initial load
  useEffect(() => {
    const initialLat = generateTimeSeries(24, 18, 38);
    const initialThr = generateTimeSeries(24, 450, 780);
    latencyRef.current = initialLat;
    throughputRef.current = initialThr;
    setLatencyData(initialLat);
    setThroughputData(initialThr);

    const now = new Date();
    setLastUpdated(now.toUTCString().slice(17, 25) + ' UTC');
    setIsLoading(false);
  }, []);

  // 1-Second Continuous Heartbeat & Ticker
  useEffect(() => {
    if (isLoading) return;

    const timer = setInterval(() => {
      // 1. Visible continuous packet ingestion counter
      setPacketsStreamed(prev => prev + Math.floor(Math.random() * 380) + 120);

      // 2. Live bandwidth pulse
      setCurrentBps(Number((680 + Math.sin(Date.now() / 3000) * 40 + (Math.random() * 6 - 3)).toFixed(1)));

      // 3. Decrement countdown cleanly
      setCountdown(prev => {
        if (prev <= 1) {
          return 0; // Triggers effect below
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading]);

  // Clean trigger when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && !isLoading) {
      updateLiveData();
      setCountdown(refreshInterval);
    }
  }, [countdown, isLoading, refreshInterval, updateLiveData]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    updateLiveData();
    setCountdown(refreshInterval);
  };

  // Change interval (e.g. 10s, 30s, 60s)
  const handleIntervalChange = (seconds: number) => {
    setRefreshInterval(seconds);
    setCountdown(seconds);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
          <Zap className="absolute inset-0 m-auto text-cyan-400" size={18} />
        </div>
        <span className="text-xs font-mono text-slate-400 tracking-wider uppercase animate-pulse">
          Synchronizing NOC Telemetry Streams...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Stitch Mission Control Hero Bar */}
      <div className="stitch-card p-6 border border-[#1B2945] bg-gradient-to-r from-[#0C1527] via-[#0E1A34] to-[#0A1222] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-cyan-500/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Radio size={10} className="mr-1.5 animate-pulse" />
                MISSION CRITICAL NOC
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400 font-mono">CORE REGION: NA-EAST (NYC-01)</span>
              
              {/* Live Stream Pulsing Badge */}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-ping"></span>
                LIVE NOC STREAM
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center">
              Network Command & Telemetry Matrix
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Real-time monitoring of 5G Standalone and 4G LTE core equipment with continuous packet ingestion and automated cycle aggregation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            
            {/* Live Ticker & Selectable Interval Pills */}
            <div className="flex items-center space-x-2 bg-[#10192D] border border-[#1E2E4E] p-1.5 rounded-lg text-xs font-mono">
              <div className="flex items-center space-x-1.5 px-2">
                <Clock size={13} className="text-cyan-400" />
                <span className="text-slate-400 text-[11px]">Sync:</span>
                <span className="text-cyan-300 font-bold text-[12px] min-w-[28px] text-center font-mono">
                  {countdown}s
                </span>
              </div>

              {/* Interval Buttons */}
              <div className="flex items-center bg-[#090E1A] p-0.5 rounded border border-[#182642]">
                {[10, 30, 60].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => handleIntervalChange(sec)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                      refreshInterval === sec
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>

              {/* Manual Refresh Button */}
              <button
                onClick={handleManualRefresh}
                title="Force sync telemetry now"
                disabled={isUpdating}
                className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded flex items-center space-x-1 cursor-pointer disabled:opacity-50 transition-all"
              >
                <RefreshCw size={12} className={isUpdating ? 'animate-spin text-cyan-300' : ''} />
                <span className="text-[10px] font-bold">Sync Now</span>
              </button>
            </div>

            <a 
              href="/dashboard/copilot"
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all flex items-center"
            >
              <Cpu size={14} className="mr-2" />
              Launch Copilot
            </a>
            <a 
              href="/dashboard/anomalies"
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#14213D] border border-cyan-500/30 text-cyan-300 hover:bg-[#1A2C52] transition-all flex items-center"
            >
              <Zap size={14} className="mr-2 text-cyan-400" />
              Anomaly Feed
            </a>
          </div>
        </div>

        {/* Real-Time Telemetry Heartbeat Bar (Continuously updating every second) */}
        <div className="mt-4 pt-3 border-t border-[#1B2945]/70 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] font-mono">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-cyan-400 shadow-[0_0_10px_rgba(0,240,255,1)] animate-ping' : 'bg-emerald-400 animate-pulse'}`}></span>
            <span className="text-slate-400">Packets Ingested:</span>
            <span className="text-emerald-300 font-bold font-mono">
              {packetsStreamed.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-slate-300 sm:justify-center">
            <Activity size={12} className="text-cyan-400" />
            <span className="text-slate-400">Instant Core Bandwidth:</span>
            <span className="text-cyan-300 font-bold font-mono">
              {currentBps} Gbps
            </span>
          </div>

          <div className="flex items-center space-x-2 text-slate-400 sm:justify-end text-[10px]">
            <span>Last aggregation:</span>
            <span className="text-slate-200 font-mono font-medium">{lastUpdated || 'Streaming live'}</span>
          </div>
        </div>
      </div>

      {/* Top Level KPIs (Updates each cycle with visual glow indicator) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 transition-all duration-300 ${isUpdating ? 'ring-1 ring-cyan-400/40 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.15)]' : ''}`}>
        <MetricCard title="Network Health" value={networkHealth.value} unit="%" trend={networkHealth.trend} status="healthy" isLive />
        <MetricCard title="Total Active Cells" value={activeCells.value} unit="towers" trend={activeCells.trend} status="healthy" isLive />
        <MetricCard title="Degraded / Offline" value={degradedCells.value} unit="cells" trend={degradedCells.trend} status="offline" isLive />
        <MetricCard title="Active P1 Incidents" value={activeIncidents.value} unit="critical" trend={activeIncidents.trend} status="critical" isLive />
      </div>

      {/* Secondary Metrics (Updates each cycle) */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 transition-all duration-300 ${isUpdating ? 'ring-1 ring-cyan-400/40 rounded-xl' : ''}`}>
        <MetricCard title="Mean Latency (5G-SA)" value={meanLatency.value} unit="ms" trend={meanLatency.trend} status="healthy" isLive />
        <MetricCard title="Handover Success Rate" value={handoverSuccess.value} unit="%" trend={handoverSuccess.trend} status="healthy" isLive />
        <MetricCard title="Packet Drop Ratio" value={packetDropRatio.value} unit="%" trend={packetDropRatio.trend} status="healthy" isLive />
      </div>

      {/* Dual Telemetry Charts (Appends fresh data point with live Recharts animation) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`stitch-card p-6 border border-[#24385E] transition-all duration-300 ${isUpdating ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.1)]' : ''}`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white tracking-wide">5G Core Latency Stream</h3>
                <span className="text-[9px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.2 rounded">
                  LIVE STREAM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Real-time p99 latency in milliseconds (auto-appended each cycle)</p>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20 font-bold flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1.5 animate-ping"></span>
              {meanLatencyText}
            </span>
          </div>
          <KPITimeSeriesChart title="" data={latencyData} dataKey="value" unit="ms" />
        </div>

        <div className={`stitch-card p-6 border border-[#24385E] transition-all duration-300 ${isUpdating ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : ''}`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white tracking-wide">Throughput Aggregation</h3>
                <span className="text-[9px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.2 rounded">
                  LIVE STREAM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Downlink bandwidth throughput (Gbps) streaming live</p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 font-bold flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-ping"></span>
              {peakThroughputText}
            </span>
          </div>
          <KPITimeSeriesChart title="" data={throughputData} dataKey="value" unit="Gbps" />
        </div>
      </div>

    </div>
  );
}
