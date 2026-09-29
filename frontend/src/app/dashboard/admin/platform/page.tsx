"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  Server, 
  Activity, 
  Database, 
  Cpu, 
  HardDrive, 
  List, 
  Bot, 
  Plus, 
  Search, 
  CheckCircle2, 
  Power, 
  X, 
  Radio
} from 'lucide-react';

interface TenantRecord {
  id: string;
  name: string;
  tier: 'ENTERPRISE' | 'PROFESSIONAL' | 'STARTER';
  region: string;
  isolation: 'SCHEMA_SHARD' | 'DEDICATED_CLUSTER';
  users: number;
  cells: number;
  monthlyInferences: string;
  status: 'ACTIVE' | 'PROVISIONING' | 'SUSPENDED';
  joinedDate: string;
}

interface AiModelRecord {
  id: string;
  name: string;
  task: string;
  version: string;
  runtime: string;
  endpoint: string;
  status: 'ONLINE' | 'RELOADING' | 'DEGRADED';
  latency: string;
  memory: string;
  accuracy: string;
  zeroCloud: boolean;
}

interface InfraNode {
  name: string;
  role: string;
  target: string;
  status: 'ONLINE' | 'STANDBY' | 'DEGRADED';
  latency: string;
  load: string;
  uptime: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  ipAddress: string;
}

const DEFAULT_TENANTS: TenantRecord[] = [
  {
    id: "T-1001",
    name: "Acme Telecom (Tenant A)",
    tier: "ENTERPRISE",
    region: "NA-EAST / EU-WEST",
    isolation: "SCHEMA_SHARD",
    users: 1204,
    cells: 340,
    monthlyInferences: "1.84M",
    status: "ACTIVE",
    joinedDate: "2025-11-12"
  },
  {
    id: "T-1002",
    name: "Globex Mobile Carriers",
    tier: "PROFESSIONAL",
    region: "NA-WEST",
    isolation: "SCHEMA_SHARD",
    users: 412,
    cells: 180,
    monthlyInferences: "420K",
    status: "ACTIVE",
    joinedDate: "2026-01-08"
  },
  {
    id: "T-1003",
    name: "Apex 5G Infrastructure",
    tier: "ENTERPRISE",
    region: "APAC-SOUTH",
    isolation: "DEDICATED_CLUSTER",
    users: 890,
    cells: 520,
    monthlyInferences: "2.10M",
    status: "ACTIVE",
    joinedDate: "2026-03-15"
  },
  {
    id: "T-1004",
    name: "Nordic Wave Telecom",
    tier: "PROFESSIONAL",
    region: "EU-NORTH",
    isolation: "SCHEMA_SHARD",
    users: 145,
    cells: 95,
    monthlyInferences: "180K",
    status: "PROVISIONING",
    joinedDate: "2026-09-22"
  },
  {
    id: "T-1005",
    name: "MetroConnect Wireless",
    tier: "STARTER",
    region: "NA-CENTRAL",
    isolation: "SCHEMA_SHARD",
    users: 48,
    cells: 32,
    monthlyInferences: "45K",
    status: "ACTIVE",
    joinedDate: "2026-05-19"
  }
];

const DEFAULT_MODELS: AiModelRecord[] = [
  {
    id: "MOD-LLM-01",
    name: "qwen2.5:1.5b (Local Ollama Engine)",
    task: "Generative Telco Diagnostics & Copilot Reasoning",
    version: "v2.5-1.5b-q4_k_m",
    runtime: "Ollama Local Core (:11434)",
    endpoint: "http://localhost:11434/api/generate",
    status: "ONLINE",
    latency: "42ms",
    memory: "1.9 GB",
    accuracy: "99.4% intent parse",
    zeroCloud: true
  },
  {
    id: "MOD-XGB-02",
    name: "XGBoost-RAN-Failure-Predictor",
    task: "Predictive Maintenance & Degradation Forecast",
    version: "v2.1.4-tuned",
    runtime: "Python scikit-learn / XGBoost C++",
    endpoint: "http://localhost:8000/api/predict/maintenance",
    status: "ONLINE",
    latency: "4.8ms",
    memory: "380 MB",
    accuracy: "98.4% ROC-AUC",
    zeroCloud: true
  },
  {
    id: "MOD-RCA-03",
    name: "Transformer-RCA-Correlator",
    task: "Topology Multimodal Anomaly Root Cause Analysis",
    version: "v1.4.0-onnx",
    runtime: "ONNX Runtime High-Perf CPU",
    endpoint: "http://localhost:8000/api/rca/analyze",
    status: "ONLINE",
    latency: "16.2ms",
    memory: "620 MB",
    accuracy: "99.1% F1-Score",
    zeroCloud: true
  },
  {
    id: "MOD-ANOM-04",
    name: "IsolationForest-Optical-Detector",
    task: "Optical Fiber & Backhaul Packet Drop Sentry",
    version: "v3.0.2",
    runtime: "FastAPI Async Worker Thread",
    endpoint: "http://localhost:8000/api/anomalies/detect",
    status: "ONLINE",
    latency: "1.8ms",
    memory: "190 MB",
    accuracy: "99.8% precision",
    zeroCloud: true
  }
];

const INFRA_NODES: InfraNode[] = [
  { name: "Express API Core Gateway", role: "Reverse Proxy & Multi-Tenant RBAC", target: "127.0.0.1:3001", status: "ONLINE", latency: "1.2ms", load: "14%", uptime: "99.99%" },
  { name: "FastAPI AI Engine", role: "Inference Dispatcher & Embeddings Hub", target: "127.0.0.1:8000", status: "ONLINE", latency: "3.4ms", load: "22%", uptime: "99.98%" },
  { name: "Ollama Local LLM Daemon", role: "Zero-Cloud Local Reasoning Runtime", target: "127.0.0.1:11434", status: "ONLINE", latency: "42ms", load: "31%", uptime: "100.0%" },
  { name: "PostgreSQL 16 Multi-Tenant DB", role: "Row-Level Sharded Relational Store", target: "127.0.0.1:5432 (telecom_ai)", status: "ONLINE", latency: "0.8ms", load: "18%", uptime: "99.99%" },
  { name: "Kafka Telemetry Stream Bus", role: "RAN Ingestion Stream Buffer", target: "localhost:9092 (topic: ran-telemetry)", status: "ONLINE", latency: "2.1ms", load: "28%", uptime: "99.97%" },
  { name: "Redis Memory Cache & Sessions", role: "Fast State & Rate Limit Sentry", target: "127.0.0.1:6379", status: "ONLINE", latency: "0.3ms", load: "8%", uptime: "100.0%" }
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  { id: "AUD-9912", timestamp: "2026-09-24 19:42:10", actor: "superadmin@telecom.ai", action: "TENANT_PROVISION", target: "Nordic Wave Telecom (T-1004)", severity: "INFO", ipAddress: "10.240.0.12" },
  { id: "AUD-9911", timestamp: "2026-09-24 19:30:05", actor: "system.scheduler", action: "MODEL_WARMUP", target: "qwen2.5:1.5b via Ollama API", severity: "INFO", ipAddress: "127.0.0.1" },
  { id: "AUD-9910", timestamp: "2026-09-24 18:55:22", actor: "sec-bot-guard", action: "ZERO_CLOUD_VERIFY", target: "Egress Boundary Check (0 Leaks)", severity: "INFO", ipAddress: "127.0.0.1" },
  { id: "AUD-9909", timestamp: "2026-09-24 17:14:48", actor: "superadmin@telecom.ai", action: "QUOTA_OVERRIDE", target: "Apex 5G (T-1003) -> 2.5M Tokens", severity: "WARN", ipAddress: "10.240.0.12" },
  { id: "AUD-9908", timestamp: "2026-09-24 15:02:19", actor: "dba-lead@telecom.ai", action: "DB_INDEX_REINDEX", target: "telecom_ai.cells_metrics_shard", severity: "INFO", ipAddress: "10.240.4.8" },
  { id: "AUD-9907", timestamp: "2026-09-24 12:20:00", actor: "superadmin@telecom.ai", action: "EMERGENCY_FAILOVER_TEST", target: "Kafka Secondary Mirror Shard", severity: "CRITICAL", ipAddress: "10.240.0.12" }
];

export default function PlatformAdminPage() {
  const [activeTab, setActiveTab] = useState<'tenants' | 'models' | 'health' | 'audit'>('tenants');
  const [tenants, setTenants] = useState<TenantRecord[]>(DEFAULT_TENANTS);
  const [models, setModels] = useState<AiModelRecord[]>(DEFAULT_MODELS);
  const [auditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [notification, setNotification] = useState<string | null>(null);

  // Tenant Search & Filter
  const [tenantSearch, setTenantSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");

  // Provision Tenant Modal
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantTier, setNewTenantTier] = useState<TenantRecord['tier']>("ENTERPRISE");
  const [newTenantRegion, setNewTenantRegion] = useState("NA-EAST");
  const [newTenantIsolation, setNewTenantIsolation] = useState<TenantRecord['isolation']>("SCHEMA_SHARD");

  // Action feedback helper
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  const handleProvisionTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;

    const nextId = `T-${1000 + tenants.length + 1}`;
    const newRecord: TenantRecord = {
      id: nextId,
      name: newTenantName.trim(),
      tier: newTenantTier,
      region: newTenantRegion,
      isolation: newTenantIsolation,
      users: 1,
      cells: 0,
      monthlyInferences: "0",
      status: "ACTIVE",
      joinedDate: new Date().toISOString().split('T')[0]
    };

    setTenants(prev => [newRecord, ...prev]);
    setNewTenantName("");
    setShowProvisionModal(false);
    showToast(`Tenant "${newRecord.name}" (${newRecord.id}) provisioned successfully with tier ${newRecord.tier}.`);
  };

  const handleToggleTenantStatus = (id: string) => {
    setTenants(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus: TenantRecord['status'] = t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        showToast(`Tenant ${t.name} (${t.id}) transitioned to ${nextStatus}.`);
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const handleReloadModel = (id: string, name: string) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, status: 'RELOADING' } : m));
    showToast(`Triggered zero-downtime hot reload for ${name}...`);

    setTimeout(() => {
      setModels(prev => prev.map(m => m.id === id ? { ...m, status: 'ONLINE' } : m));
      showToast(`Model ${name} hot-reload verified 100% operational.`);
    }, 2000);
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(tenantSearch.toLowerCase()) || 
                          t.id.toLowerCase().includes(tenantSearch.toLowerCase()) ||
                          t.region.toLowerCase().includes(tenantSearch.toLowerCase());
    const matchesTier = selectedTier === 'ALL' || t.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const tabs = [
    { id: 'tenants' as const, label: 'Tenants & Partitioning', icon: <Database size={15} />, badge: tenants.length.toString() },
    { id: 'models' as const, label: 'Global AI Model Registry', icon: <Cpu size={15} />, badge: 'Zero-Cloud' },
    { id: 'health' as const, label: 'Platform Infrastructure', icon: <Activity size={15} />, badge: '6/6 Up' },
    { id: 'audit' as const, label: 'Super Admin Audit Trail', icon: <List size={15} />, badge: 'Live' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Platform Header */}
      <div className="stitch-card p-6 border border-[#24385E] bg-gradient-to-r from-[#111A2E] via-[#15233E] to-[#0E172A] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-rose-400 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="font-bold tracking-wider uppercase">SUPER ADMIN ROOT AUTHORITY · MULTI-TENANT CORE</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <Shield className="mr-2.5 text-rose-500" size={26} />
            Platform Administration & Fleet Infrastructure
          </h1>
          <p className="text-xs text-slate-300 font-mono mt-1">
            Global multi-tenant governance, zero-cloud local AI runtime coordination, and hardware shard orchestration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/copilot?prompt=Perform deep platform infrastructure health audit across Express gateway, local Ollama daemon, PostgreSQL shard pools, and Kafka streams"
            className="bg-[#15233E] hover:bg-[#1C2F52] border border-cyan-500/40 text-cyan-300 px-3.5 py-2 rounded-lg font-bold text-xs flex items-center transition-all font-mono shadow-sm"
          >
            <Bot size={15} className="mr-1.5 text-cyan-400" /> Platform AI Audit
          </Link>
          <button
            onClick={() => setShowProvisionModal(true)}
            className="bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2 rounded-lg font-bold text-xs flex items-center transition-all font-mono shadow-md shadow-rose-900/40"
          >
            <Plus size={15} className="mr-1.5" /> Provision Tenant
          </button>
        </div>
      </div>

      {/* Global Toast Alert */}
      {notification && (
        <div className="p-3.5 rounded-lg border border-cyan-500/50 bg-cyan-950/70 text-cyan-200 text-xs font-mono flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white ml-4">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Super Admin Top KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="stitch-card p-4 border border-[#24385E] bg-[#111A2E] rounded-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center">
              <Database size={13} className="mr-1.5 text-rose-400" /> Managed Tenants
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-300 font-bold">
              MULTI-TENANT
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2 flex items-baseline space-x-2">
            <span>{tenants.length}</span>
            <span className="text-xs font-normal text-slate-400">Tenants Active</span>
          </div>
          <div className="text-[11px] text-slate-300 font-mono mt-2 flex items-center space-x-2">
            <span className="text-emerald-400 font-bold">1,167 Cells</span>
            <span className="text-slate-500">·</span>
            <span className="text-cyan-400">2,699 Users</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="stitch-card p-4 border border-[#24385E] bg-[#111A2E] rounded-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center">
              <Cpu size={13} className="mr-1.5 text-cyan-400" /> AI Inference Volume
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-bold">
              ZERO-CLOUD
            </span>
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono mt-2 flex items-baseline space-x-2">
            <span>4.58M</span>
            <span className="text-xs font-normal text-slate-400">Inferences / 30d</span>
          </div>
          <div className="text-[11px] text-slate-300 font-mono mt-2 flex items-center space-x-2">
            <span className="text-slate-400">Avg Latency:</span>
            <span className="text-emerald-400 font-bold font-mono">16.1ms</span>
            <span className="text-slate-500">·</span>
            <span className="text-rose-400 font-mono font-bold">0 Egress Leaks</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="stitch-card p-4 border border-[#24385E] bg-[#111A2E] rounded-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center">
              <Activity size={13} className="mr-1.5 text-emerald-400" /> Infrastructure SLA
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-bold">
              NOMINAL
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-2 flex items-baseline space-x-2">
            <span>99.992%</span>
            <span className="text-xs font-normal text-slate-400">30d Global Uptime</span>
          </div>
          <div className="text-[11px] text-slate-300 font-mono mt-2 flex items-center space-x-2">
            <span className="text-slate-400">Core Services:</span>
            <span className="text-emerald-400 font-bold font-mono">6/6 Healthy</span>
            <span className="text-slate-500">·</span>
            <span className="text-cyan-400 font-mono font-bold">0 Incidents</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="stitch-card p-4 border border-[#24385E] bg-[#111A2E] rounded-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center">
              <HardDrive size={13} className="mr-1.5 text-amber-400" /> DB Storage Sharding
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 font-bold">
              RLS ENABLED
            </span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-2 flex items-baseline space-x-2">
            <span>42.8 GB</span>
            <span className="text-xs font-normal text-slate-400">/ 250 GB Cluster</span>
          </div>
          <div className="w-full bg-[#1A2844] rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-1.5 rounded-full" style={{ width: '17%' }}></div>
          </div>
        </div>

      </div>

      {/* Tabs and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#24385E] pb-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold flex items-center space-x-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-rose-600/20 text-rose-300 border border-rose-500/50 shadow-sm'
                  : 'bg-[#111A2E] text-slate-400 hover:text-slate-200 border border-[#1F3154]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                activeTab === tab.id ? 'bg-rose-500/30 text-rose-200' : 'bg-[#182643] text-slate-400'
              }`}>
                {tab.badge}
              </span>
            </button>
          ))}
        </div>

        {activeTab === 'tenants' && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="bg-[#0E172B] border border-[#253961] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500"
            >
              <option value="ALL">All Tiers</option>
              <option value="ENTERPRISE">Enterprise</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="STARTER">Starter</option>
            </select>
            <div className="flex items-center bg-[#0E172B] border border-[#253961] rounded-lg px-3 py-1.5 w-full sm:w-64">
              <Search size={14} className="text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search tenant name or id..."
                value={tenantSearch}
                onChange={(e) => setTenantSearch(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-xs text-slate-100 placeholder-slate-400 w-full font-mono"
              />
              {tenantSearch && (
                <button onClick={() => setTenantSearch("")} className="text-slate-400 hover:text-white text-xs font-mono ml-1">
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: Tenants & Multi-Tenancy */}
      {activeTab === 'tenants' && (
        <div className="stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-[#0E172B] border-b border-[#1E2E4E] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-white font-mono flex items-center">
                <Database size={15} className="mr-2 text-rose-400" />
                Active Multi-Tenant Database Shards & Partition Registry
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Cryptographically isolated row-level schemas with strict tenant boundary enforcement.
              </p>
            </div>
            <div className="text-[11px] font-mono text-cyan-400 flex items-center space-x-1">
              <Shield size={13} className="text-cyan-400" />
              <span>Zero Cross-Tenant Leakage Guaranteed</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono">
              <thead>
                <tr className="bg-[#0B1322] border-b border-[#1E2E4E] text-[10px] text-slate-400 uppercase tracking-wider">
                  <th className="p-3.5">Tenant Details</th>
                  <th className="p-3.5">Subscription Tier</th>
                  <th className="p-3.5">Partition Region</th>
                  <th className="p-3.5">Isolation Strategy</th>
                  <th className="p-3.5">Cells Managed</th>
                  <th className="p-3.5">Monthly Inference</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182643] text-xs">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No tenants matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-[#14203A] transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 font-bold flex items-center justify-center text-xs">
                            {tenant.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{tenant.name}</div>
                            <div className="text-[10px] text-slate-400 flex items-center space-x-2">
                              <span>{tenant.id}</span>
                              <span>·</span>
                              <span>{tenant.users} Users</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          tenant.tier === 'ENTERPRISE'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : tenant.tier === 'PROFESSIONAL'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                        }`}>
                          {tenant.tier}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-300">{tenant.region}</td>

                      <td className="p-3.5">
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[#162544] border border-[#233B6B] text-slate-300">
                          {tenant.isolation.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono text-cyan-300">{tenant.cells} Cells</td>

                      <td className="p-3.5 font-mono text-emerald-400">{tenant.monthlyInferences}</td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          tenant.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : tenant.status === 'PROVISIONING'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}>
                          {tenant.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleToggleTenantStatus(tenant.id)}
                          className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                            tenant.status === 'ACTIVE'
                              ? 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-500/40 text-rose-300'
                              : 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-500/40 text-emerald-300'
                          }`}
                        >
                          {tenant.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                        <Link
                          href="/dashboard/admin/tenant"
                          className="px-2 py-1 rounded text-[10px] font-mono border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 transition-colors inline-block"
                        >
                          Inspect Tenant
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

      {/* TAB 2: Global AI Model Registry */}
      {activeTab === 'models' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#0E172B] border border-[#24385E] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Global Telco AI Fleet Orchestrator</h3>
                <p className="text-xs text-slate-400">Strictly localized local Ollama and ONNX neural inferencing runtime engines.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2.5 py-1 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-bold flex items-center">
                <CheckCircle2 size={12} className="mr-1.5 text-emerald-400" />
                Zero-Cloud Data Boundary Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {models.map(model => (
              <div key={model.id} className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">{model.id}</span>
                      <h4 className="text-base font-bold text-white mt-0.5">{model.name}</h4>
                      <p className="text-xs text-slate-300 font-mono mt-0.5">{model.task}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      model.status === 'ONLINE'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {model.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-[#0E172B] rounded-lg border border-[#1E2E4E] font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Version / Tag</span>
                      <span className="text-slate-200 font-bold">{model.version}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Benchmark Accuracy</span>
                      <span className="text-cyan-300 font-bold">{model.accuracy}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Inference Latency</span>
                      <span className="text-emerald-400 font-bold">{model.latency}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Host Memory</span>
                      <span className="text-amber-300 font-bold">{model.memory}</span>
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-[#090F1C] rounded border border-[#162544] text-[11px] font-mono text-slate-400 truncate">
                    <span className="text-slate-500">Endpoint: </span>
                    <span className="text-cyan-400">{model.endpoint}</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#1E2E4E] flex items-center justify-between">
                  <div className="flex items-center text-[10px] font-mono text-emerald-400">
                    <Shield size={12} className="mr-1" />
                    <span>Air-Gapped Local Inference</span>
                  </div>
                  <button
                    onClick={() => handleReloadModel(model.id, model.name)}
                    disabled={model.status === 'RELOADING'}
                    className="px-3 py-1.5 rounded text-xs font-mono font-bold bg-[#15233E] hover:bg-[#1E335C] border border-cyan-500/40 text-cyan-300 transition-colors flex items-center"
                  >
                    <Power size={12} className="mr-1.5 text-cyan-400" />
                    {model.status === 'RELOADING' ? 'Reloading...' : 'Hot-Reload Weights'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Platform Infrastructure Health */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          {/* Hardware & Resource Cluster Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            <div className="stitch-card p-4 border border-[#24385E] bg-[#111A2E] rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center">
                <Cpu size={13} className="mr-1.5 text-cyan-400" /> CPU Core Capacity
              </span>
              <div className="text-2xl font-black text-white mt-1">28.4% Load</div>
              <p className="text-[11px] text-slate-400 mt-1">8 Cores Active · 16 Threads Scheduled</p>
              <div className="w-full bg-[#182643] rounded-full h-1.5 mt-2">
                <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: '28.4%' }}></div>
              </div>
            </div>

            <div className="stitch-card p-4 border border-[#24385E] bg-[#111A2E] rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center">
                <HardDrive size={13} className="mr-1.5 text-emerald-400" /> Memory Footprint
              </span>
              <div className="text-2xl font-black text-white mt-1">8.2 / 32 GB</div>
              <p className="text-[11px] text-slate-400 mt-1">Shared Local RAM (Ollama + App Pool)</p>
              <div className="w-full bg-[#182643] rounded-full h-1.5 mt-2">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '25.6%' }}></div>
              </div>
            </div>

            <div className="stitch-card p-4 border border-[#24385E] bg-[#111A2E] rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center">
                <Radio size={13} className="mr-1.5 text-amber-400" /> Kafka Pipeline Throughput
              </span>
              <div className="text-2xl font-black text-white mt-1">14,200 msg/s</div>
              <p className="text-[11px] text-slate-400 mt-1">0 Message Drop · 2.1ms Buffer Delay</p>
              <div className="w-full bg-[#182643] rounded-full h-1.5 mt-2">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>
          </div>

          {/* Node Grid */}
          <div className="stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl overflow-hidden">
            <div className="p-4 bg-[#0E172B] border-b border-[#1E2E4E] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center">
                  <Server size={15} className="mr-2 text-emerald-400" />
                  Cluster Microservice Architecture Status
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Daemon heartbeat sentries running in high-availability loopback isolation.
                </p>
              </div>
              <button 
                onClick={() => showToast("Health heartbeat ping sent to all 6 platform microservices. All reporting 100% OK.")}
                className="px-3 py-1.5 rounded text-xs font-mono font-bold bg-[#15233E] hover:bg-[#1E335C] border border-emerald-500/40 text-emerald-300 transition-colors flex items-center"
              >
                <CheckCircle2 size={13} className="mr-1.5 text-emerald-400" /> Test Heartbeats
              </button>
            </div>

            <div className="divide-y divide-[#182643] font-mono text-xs">
              {INFRA_NODES.map((node, idx) => (
                <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#14203A] transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0E172B] border border-[#233B6B] flex items-center justify-center text-cyan-400 font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm flex items-center">
                        <span>{node.name}</span>
                        <span className="ml-2.5 px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                          {node.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{node.role}</div>
                      <div className="text-[10px] text-cyan-400 mt-0.5">{node.target}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-xs text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Latency</span>
                      <span className="text-emerald-400 font-bold">{node.latency}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Load</span>
                      <span className="text-slate-200 font-bold">{node.load}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Uptime</span>
                      <span className="text-cyan-300 font-bold">{node.uptime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Platform Audit Log */}
      {activeTab === 'audit' && (
        <div className="stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-[#0E172B] border-b border-[#1E2E4E] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center">
                <List size={15} className="mr-2 text-rose-400" />
                Immutable Platform Governance Audit Trail
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Cryptographically verifiable event log of root mutations, provisioning, and policy alterations.
              </p>
            </div>
            <button
              onClick={() => showToast("Exporting platform audit log to JSON/CSV bundle...")}
              className="px-3 py-1.5 rounded text-xs font-mono font-bold bg-[#15233E] hover:bg-[#1C2F52] border border-[#253961] text-slate-200 transition-colors self-start sm:self-auto"
            >
              Export Audit Trail
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono">
              <thead>
                <tr className="bg-[#0B1322] border-b border-[#1E2E4E] text-[10px] text-slate-400 uppercase tracking-wider">
                  <th className="p-3.5">Log ID</th>
                  <th className="p-3.5">Timestamp (UTC)</th>
                  <th className="p-3.5">Actor Identity</th>
                  <th className="p-3.5">Action Executed</th>
                  <th className="p-3.5">Target Scope</th>
                  <th className="p-3.5">Level</th>
                  <th className="p-3.5 text-right">Client IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182643] text-xs">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#14203A] transition-colors">
                    <td className="p-3.5 text-cyan-400 font-bold">{log.id}</td>
                    <td className="p-3.5 text-slate-400 text-[11px]">{log.timestamp}</td>
                    <td className="p-3.5 text-slate-200 font-bold">{log.actor}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#162544] border border-[#233B6B] text-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300 text-[11px]">{log.target}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : log.severity === 'WARN'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-400 text-[11px]">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provision New Tenant Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="stitch-card bg-[#111A2E] border border-rose-500/50 rounded-xl p-6 max-w-lg w-full shadow-2xl text-white font-mono space-y-4">
            <div className="flex justify-between items-center border-b border-[#24385E] pb-3">
              <div className="flex items-center space-x-2">
                <Shield className="text-rose-400" size={18} />
                <h3 className="font-bold text-base text-white">Provision New Tenant Partition</h3>
              </div>
              <button onClick={() => setShowProvisionModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProvisionTenant} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">Tenant Legal / Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Horizon Wireless Europe"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  className="w-full bg-[#0E172B] border border-[#253961] rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Licensing Tier</label>
                  <select
                    value={newTenantTier}
                    onChange={(e) => setNewTenantTier(e.target.value as TenantRecord['tier'])}
                    className="w-full bg-[#0E172B] border border-[#253961] rounded-lg p-2 text-white focus:outline-none focus:border-rose-500 font-mono"
                  >
                    <option value="ENTERPRISE">Enterprise (Unlimited Cells)</option>
                    <option value="PROFESSIONAL">Professional (Up to 500 Cells)</option>
                    <option value="STARTER">Starter (Up to 100 Cells)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Primary Region</label>
                  <select
                    value={newTenantRegion}
                    onChange={(e) => setNewTenantRegion(e.target.value)}
                    className="w-full bg-[#0E172B] border border-[#253961] rounded-lg p-2 text-white focus:outline-none focus:border-rose-500 font-mono"
                  >
                    <option value="NA-EAST">NA-EAST (Virginia)</option>
                    <option value="NA-WEST">NA-WEST (Oregon)</option>
                    <option value="EU-WEST">EU-WEST (Frankfurt)</option>
                    <option value="APAC-SOUTH">APAC-SOUTH (Mumbai)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">DB Isolation Strategy</label>
                <select
                  value={newTenantIsolation}
                  onChange={(e) => setNewTenantIsolation(e.target.value as TenantRecord['isolation'])}
                  className="w-full bg-[#0E172B] border border-[#253961] rounded-lg p-2 text-white focus:outline-none focus:border-rose-500 font-mono"
                >
                  <option value="SCHEMA_SHARD">PostgreSQL Row-Level Shard (Standard)</option>
                  <option value="DEDICATED_CLUSTER">Dedicated DB Cluster (High Isolation)</option>
                </select>
              </div>

              <div className="p-3 rounded bg-[#0A1220] border border-[#182846] text-[11px] text-slate-400 space-y-1">
                <div className="text-cyan-300 font-bold flex items-center">
                  <CheckCircle2 size={13} className="mr-1.5 text-cyan-400" />
                  Default Zero-Cloud AI Policies Applied
                </div>
                <p>New tenants automatically inherit local Ollama inference models and strict cryptographic database partitions.</p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#24385E]">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#182643] hover:bg-[#203256] text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-900/40"
                >
                  Provision Shard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
