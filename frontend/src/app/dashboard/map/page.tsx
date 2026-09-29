"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Map, Activity, ShieldAlert, BarChart2, Radio, Server, X, CheckCircle } from 'lucide-react';

const NetworkMap = dynamic(() => import('../../../components/NetworkMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center rounded-lg">
      <p className="text-gray-500 font-bold flex items-center"><Map className="mr-2 animate-spin" /> Loading Geospatial Engine...</p>
    </div>
  )
});

// Mock Backend Data for production simulation
const MOCK_SITES = [
  {
    id: "SITE-NYC-01", name: "NYC Downtown Core", lat: 40.7128, lng: -74.0060, health: "CRITICAL", activeAlarms: 12, availability: 98.4,
    cells: [
      { id: "CELL-NYC-01-5G", technology: "5G NR", latency: 45.2, trafficGb: 1450, anomalies: 3 },
      { id: "CELL-NYC-01-4G", technology: "4G LTE", latency: 22.1, trafficGb: 890, anomalies: 0 }
    ]
  },
  {
    id: "SITE-NYC-02", name: "Brooklyn Bridge", lat: 40.7061, lng: -73.9969, health: "DEGRADED", activeAlarms: 4, availability: 99.2,
    cells: [
      { id: "CELL-BKL-02-5G", technology: "5G NR", latency: 15.0, trafficGb: 1120, anomalies: 1 }
    ]
  },
  {
    id: "SITE-NYC-03", name: "Midtown Tower", lat: 40.7549, lng: -73.9840, health: "HEALTHY", activeAlarms: 0, availability: 99.99,
    cells: [
      { id: "CELL-MID-03-5G", technology: "5G NR", latency: 8.5, trafficGb: 2100, anomalies: 0 },
      { id: "CELL-MID-03-4G", technology: "4G LTE", latency: 18.2, trafficGb: 1500, anomalies: 0 }
    ]
  },
  {
    id: "SITE-NWK-01", name: "Newark Hub", lat: 40.7357, lng: -74.1724, health: "HEALTHY", activeAlarms: 0, availability: 99.95,
    cells: [
      { id: "CELL-NWK-01-4G", technology: "4G LTE", latency: 20.1, trafficGb: 600, anomalies: 0 }
    ]
  }
];

export default function GeospatialMapPage() {
  const [selectedSite, setSelectedSite] = useState<typeof MOCK_SITES[0] | null>(null);
  const [selectedCell, setSelectedCell] = useState<typeof MOCK_SITES[0]['cells'][0] | null>(null);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Map className="mr-2 text-indigo-600" /> Geospatial Network Topology
          </h1>
          <p className="text-sm text-gray-500 mt-1">Live physical infrastructure health, traffic, and fault mapping.</p>
        </div>
        <div className="flex space-x-2">
          <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded border border-red-200">1 Critical Site</span>
          <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded border border-orange-200">1 Degraded</span>
          <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded border border-green-200">2 Healthy</span>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        
        {/* Map Container */}
        <div className={`transition-all duration-300 ${selectedSite ? 'w-2/3' : 'w-full'} bg-white border rounded-lg shadow-sm overflow-hidden relative`}>
          <NetworkMap data={MOCK_SITES} onSelectSite={(site) => { setSelectedSite(site); setSelectedCell(null); }} />
        </div>

        {/* Site / Cell Intelligence Panel */}
        {selectedSite && (
          <div className="w-1/3 bg-white border rounded-lg shadow-sm flex flex-col h-[700px] overflow-hidden animate-in slide-in-from-right-4">
            
            <div className="bg-gray-900 text-white p-4 shrink-0 relative">
              <button 
                onClick={() => setSelectedSite(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
              <div className="flex items-center mb-1">
                <span className={`w-3 h-3 rounded-full mr-2 ${selectedSite.health === 'CRITICAL' ? 'bg-red-500' : selectedSite.health === 'DEGRADED' ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                <span className="text-xs font-mono font-bold text-gray-400">{selectedSite.id}</span>
              </div>
              <h2 className="text-xl font-bold">{selectedSite.name}</h2>
              <div className="flex space-x-4 mt-3">
                <div className="text-xs"><span className="text-gray-400 block">Availability</span><span className="font-bold">{selectedSite.availability}%</span></div>
                <div className="text-xs"><span className="text-gray-400 block">Active Alarms</span><span className={`font-bold ${selectedSite.activeAlarms > 0 ? 'text-red-400' : 'text-green-400'}`}>{selectedSite.activeAlarms}</span></div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-b shrink-0 flex overflow-x-auto space-x-2">
              {selectedSite.cells.map((cell) => (
                <button
                  key={cell.id}
                  onClick={() => setSelectedCell(cell)}
                  className={`flex items-center px-3 py-2 rounded-md text-xs font-bold whitespace-nowrap transition-colors border ${selectedCell?.id === cell.id ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                >
                  <Radio size={14} className="mr-1.5" />
                  {cell.technology}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-white">
              {!selectedCell ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                  <Radio size={32} className="opacity-20" />
                  <p className="text-sm">Select a cell sector above for detailed telemetry.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Live Telemetry: {selectedCell.id}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="border rounded p-3 bg-gray-50">
                        <span className="flex items-center text-xs text-gray-500 mb-1"><Activity size={12} className="mr-1"/> Latency</span>
                        <span className={`text-xl font-bold ${selectedCell.latency > 40 ? 'text-red-600' : 'text-gray-900'}`}>{selectedCell.latency} ms</span>
                      </div>
                      <div className="border rounded p-3 bg-gray-50">
                        <span className="flex items-center text-xs text-gray-500 mb-1"><BarChart2 size={12} className="mr-1"/> Traffic (24h)</span>
                        <span className="text-xl font-bold text-gray-900">{selectedCell.trafficGb} GB</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Active Issues</h3>
                    {selectedCell.anomalies > 0 ? (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <div className="flex items-start">
                          <ShieldAlert size={16} className="text-red-600 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-red-900">AI Anomaly Detected</p>
                            <p className="text-xs text-red-800 mt-1">High latency deviation (45.2ms &gt; 3σ from baseline). High predictive failure risk on connected BBU.</p>
                            <button className="text-xs font-bold text-red-700 mt-2 hover:underline">Investigate Incident &rarr;</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded p-3 flex items-center text-green-800">
                        <CheckCircle size={16} className="mr-2" />
                        <span className="text-sm font-bold">No active anomalies or incidents.</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Hardware Status</h3>
                    <div className="border rounded divide-y">
                      <div className="p-3 flex justify-between items-center bg-gray-50">
                        <div className="flex items-center">
                          <Server size={14} className="text-gray-500 mr-2" />
                          <span className="text-xs font-bold text-gray-700">Remote Radio Unit (RRU)</span>
                        </div>
                        <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded font-bold">HEALTHY</span>
                      </div>
                      <div className="p-3 flex justify-between items-center bg-gray-50">
                        <div className="flex items-center">
                          <Server size={14} className="text-gray-500 mr-2" />
                          <span className="text-xs font-bold text-gray-700">Baseband Unit (BBU)</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${selectedSite.health === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {selectedSite.health === 'CRITICAL' ? 'CRITICAL RISK' : 'HEALTHY'}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
