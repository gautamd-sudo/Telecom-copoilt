"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Users, 
  Activity, 
  Database, 
  Radio, 
  Network, 
  ShieldCheck, 
  CheckCircle2, 
  Search, 
  Plus, 
  Bot, 
  ArrowRight, 
  X
} from 'lucide-react';

interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: 'TENANT_ADMIN' | 'NETWORK_ENGINEER' | 'DATA_ANALYST' | 'CUSTOMER_OPERATIONS';
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  twoFactor: boolean;
  lastLogin: string;
}

interface RegionTopology {
  id: string;
  name: string;
  code: string;
  sitesCount: number;
  cellsCount: number;
  availability: string;
  status: 'HEALTHY' | 'WARNING';
}

interface AiToggle {
  id: string;
  title: string;
  description: string;
  engine: string;
  active: boolean;
  requiresGate: boolean;
}

interface IntegrationItem {
  id: string;
  name: string;
  type: string;
  endpoint: string;
  status: 'CONNECTED' | 'HEALTHY' | 'SYNCING';
  latency: string;
  throughput: string;
}

const DEFAULT_USERS: TenantUser[] = [
  { id: "USR-001", name: "Alex Chen", email: "alex.chen@acmetelecom.com", role: "TENANT_ADMIN", status: "ACTIVE", twoFactor: true, lastLogin: "10 mins ago" },
  { id: "USR-002", name: "Sarah Jenkins", email: "s.jenkins@acmetelecom.com", role: "NETWORK_ENGINEER", status: "ACTIVE", twoFactor: true, lastLogin: "1 hour ago" },
  { id: "USR-003", name: "Marcus Brody", email: "m.brody@acmetelecom.com", role: "DATA_ANALYST", status: "ACTIVE", twoFactor: true, lastLogin: "3 hours ago" },
  { id: "USR-004", name: "Elena Rostova", email: "e.rostova@acmetelecom.com", role: "CUSTOMER_OPERATIONS", status: "ACTIVE", twoFactor: false, lastLogin: "Yesterday" },
  { id: "USR-005", name: "David Kim", email: "d.kim@acmetelecom.com", role: "NETWORK_ENGINEER", status: "INVITED", twoFactor: false, lastLogin: "Never" }
];

const TOPOLOGY_REGIONS: RegionTopology[] = [
  { id: "REG-01", name: "North America East", code: "NA-EAST", sitesCount: 42, cellsCount: 128, availability: "99.82%", status: "WARNING" },
  { id: "REG-02", name: "North America West", code: "NA-WEST", sitesCount: 36, cellsCount: 104, availability: "99.98%", status: "HEALTHY" },
  { id: "REG-03", name: "Europe West", code: "EU-WEST", sitesCount: 28, cellsCount: 72, availability: "99.94%", status: "HEALTHY" },
  { id: "REG-04", name: "Asia Pacific South", code: "APAC-SOUTH", sitesCount: 14, cellsCount: 36, availability: "99.99%", status: "HEALTHY" }
];

const DEFAULT_AI_TOGGLES: AiToggle[] = [
  {
    id: "AI-MAINT",
    title: "Predictive Hardware Maintenance (XGBoost v2.1)",
    description: "Evaluates real-time RF equipment telemetry, core operating temperatures, and alarm history to compute 7-day failure probabilities.",
    engine: "XGBoost + Random Forest",
    active: true,
    requiresGate: true
  },
  {
    id: "AI-RCA",
    title: "Automated Root Cause Analysis (RCA Engine)",
    description: "Auto-attaches Bayesian tree hypotheses, topology causal graphs, and recommended mitigation runbooks to incoming network incidents.",
    engine: "Bayesian Topology Matcher",
    active: true,
    requiresGate: false
  },
  {
    id: "AI-COPILOT-OPS",
    title: "AI Copilot Operational State Changes",
    description: "Permits AI Copilot to execute state-changing mitigation commands (quarantine cell, reroute slice, reboot BBU) with mandatory human confirmation.",
    engine: "Ollama (qwen2.5:1.5b)",
    active: true,
    requiresGate: true
  },
  {
    id: "AI-LOCAL-ONLY",
    title: "Strict Zero-Cloud Data Boundary (Local Inference)",
    description: "Guarantees 100% of customer prompts, PII, and telemetry vectors are processed on local host runtime with zero external cloud egress.",
    engine: "On-Premises Ollama Runtime",
    active: true,
    requiresGate: false
  }
];

const DEFAULT_INTEGRATIONS: IntegrationItem[] = [
  { id: "INT-KAFKA", name: "Kafka Telemetry Streaming Bus", type: "MESSAGE_BROKER", endpoint: "kafka:9092 / telecom.telemetry.v1", status: "CONNECTED", latency: "2.4ms", throughput: "24.5k msg/s" },
  { id: "INT-SNOW", name: "ServiceNow ITSM Incident Gateway", type: "ITSM_SYNC", endpoint: "https://acme-prod.service-now.com/api/v2", status: "CONNECTED", latency: "140ms", throughput: "Bidirectional" },
  { id: "INT-PROM", name: "Prometheus Telemetry Scraper", type: "METRICS", endpoint: "http://localhost:8000/metrics", status: "HEALTHY", latency: "12ms", throughput: "15s Interval" },
  { id: "INT-DB", name: "PostgreSQL Multi-Tenant Shard", type: "DATABASE", endpoint: "127.0.0.1:5432 / schema: public", status: "HEALTHY", latency: "0.8ms", throughput: "Pool: 20 conns" }
];

export default function TenantAdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'network' | 'ai' | 'integrations'>('users');
  const [users, setUsers] = useState<TenantUser[]>(DEFAULT_USERS);
  const [aiToggles, setAiToggles] = useState<AiToggle[]>(DEFAULT_AI_TOGGLES);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [notification, setNotification] = useState<string | null>(null);

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TenantUser['role']>("NETWORK_ENGINEER");

  const handleToggleAi = (id: string) => {
    setAiToggles(prev => prev.map(item => {
      if (item.id === id) {
        const next = !item.active;
        setNotification(`Policy "${item.title}" ${next ? 'ENABLED' : 'DISABLED'}.`);
        setTimeout(() => setNotification(null), 4000);
        return { ...item, active: next };
      }
      return item;
    }));
  };

  const handleInviteUser = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    const newUser: TenantUser = {
      id: `USR-00${users.length + 1}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      status: "INVITED",
      twoFactor: false,
      lastLogin: "Never"
    };

    setUsers(prev => [...prev, newUser]);
    setInviteName("");
    setInviteEmail("");
    setShowInviteModal(false);
    setNotification(`Invitation dispatched to ${inviteEmail} with role ${inviteRole}.`);
    setTimeout(() => setNotification(null), 5000);
  };

  const handlePingIntegration = (name: string) => {
    setNotification(`Ping sent to ${name}. Health check verified 200 OK.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const getRoleBadge = (role: TenantUser['role']) => {
    switch (role) {
      case 'TENANT_ADMIN':
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case 'NETWORK_ENGINEER':
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      case 'DATA_ANALYST':
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case 'CUSTOMER_OPERATIONS':
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());
    const matchesRole = selectedRole === "ALL" || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      
      {/* Stitch AI Header */}
      <div className="stitch-card p-6 border border-[#24385E] bg-gradient-to-r from-[#111A2E] via-[#15233E] to-[#0E172A] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-cyan-400 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-bold tracking-wider uppercase">TENANT CONTROL PLANE · ACME TELECOM (TENANT A)</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <Building2 className="mr-2.5 text-cyan-400" size={26} />
            Tenant Administration & Policy Governance
          </h1>
          <p className="text-xs text-slate-300 font-mono mt-1">
            Role-based access control (RBAC), RAN network topology, AI model policies, and enterprise integration connectors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/copilot?prompt=Audit Acme Telecom tenant configuration, active user roles, topology health, and AI policy guards"
            className="bg-[#15233E] hover:bg-[#1C2F52] border border-cyan-500/40 text-cyan-300 px-3.5 py-2 rounded-lg font-bold text-xs flex items-center transition-all font-mono shadow-sm"
          >
            <Bot size={15} className="mr-1.5 text-cyan-400" /> Audit in Copilot
          </Link>
          <button 
            onClick={() => setShowInviteModal(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center shadow-[0_0_14px_rgba(6,182,212,0.3)] transition-all font-mono cursor-pointer"
          >
            <Plus size={15} className="mr-1.5" /> Invite Member
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 px-4 py-2.5 rounded-lg text-xs font-mono flex items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white text-xs font-bold ml-4">✕</button>
        </div>
      )}

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Active Seats */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <Users size={14} className="mr-1.5 text-cyan-400" /> Active Tenant Seats
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
              RBAC ON
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-white mt-2">
            {users.length} <span className="text-xs font-normal text-slate-400">/ 50 seats</span>
          </p>
          <div className="w-full bg-[#182643] rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: `${(users.length / 50) * 100}%` }}></div>
          </div>
        </div>

        {/* Network Footprint */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <Radio size={14} className="mr-1.5 text-emerald-400" /> Managed Network Footprint
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              99.8% LIVE
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-emerald-300 mt-2">
            340 Cells
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
            4 Regions · 120 Radio Sites
          </p>
        </div>

        {/* AI Model Policies */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <Activity size={14} className="mr-1.5 text-purple-400" /> AI Governance Policies
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
              GATED
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-purple-300 mt-2">
            {aiToggles.filter(t => t.active).length} Active
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
            Human-in-the-loop operational confirmation
          </p>
        </div>

        {/* Integrations */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <Database size={14} className="mr-1.5 text-amber-400" /> Live Integrations
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              CONNECTED
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-amber-300 mt-2">
            4 Connectors
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
            Kafka · ServiceNow · Prometheus · Postgres
          </p>
        </div>

      </div>

      {/* Navigation Tabs Bar */}
      <div className="stitch-card p-3 border border-[#24385E] bg-[#111A2E] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
        <div className="flex space-x-1.5 text-xs w-full sm:w-auto">
          {[
            { id: 'users', label: `Users & Roles (${users.length})`, icon: <Users size={13} className="mr-1.5" /> },
            { id: 'network', label: 'Network & RAN Topology', icon: <Network size={13} className="mr-1.5" /> },
            { id: 'ai', label: 'AI Policies & Guards', icon: <Activity size={13} className="mr-1.5" /> },
            { id: 'integrations', label: 'Enterprise Integrations', icon: <Database size={13} className="mr-1.5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 rounded-lg flex items-center transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'users' && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-[#0E172B] border border-[#253961] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Roles</option>
              <option value="TENANT_ADMIN">Tenant Admin</option>
              <option value="NETWORK_ENGINEER">Network Engineer</option>
              <option value="DATA_ANALYST">Data Analyst</option>
              <option value="CUSTOMER_OPERATIONS">Customer Operations</option>
            </select>
            <div className="flex items-center bg-[#0E172B] border border-[#253961] rounded-lg px-3 py-1.5 w-full sm:w-64">
              <Search size={14} className="text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search user or email..."
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
        )}
      </div>

      {/* TAB 1: Users & Roles */}
      {activeTab === 'users' && (
        <div className="stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono">
              <thead>
                <tr className="bg-[#0E172B] border-b border-[#1E2E4E] text-[11px] text-slate-400 uppercase tracking-wider">
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Corporate Email</th>
                  <th className="p-3.5">Assigned RBAC Role</th>
                  <th className="p-3.5">2FA Auth</th>
                  <th className="p-3.5">Last Login</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182643] text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No users match the search filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#14203A] transition-colors">
                      <td className="p-3.5 flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-bold flex items-center justify-center text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{u.name}</div>
                          <div className="text-[10px] text-slate-400">{u.id}</div>
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-300">{u.email}</td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleBadge(u.role)}`}>
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {u.twoFactor ? (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center">
                            <ShieldCheck size={12} className="mr-1" /> ENFORCED
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">
                            OFF
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-400">{u.lastLogin}</td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          u.status === 'ACTIVE' 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {u.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <button 
                          onClick={() => {
                            setNotification(`Managing role permissions for ${u.name}.`);
                            setTimeout(() => setNotification(null), 3000);
                          }}
                          className="text-cyan-400 hover:text-cyan-300 font-bold text-xs hover:underline cursor-pointer"
                        >
                          Edit Permissions
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Network & RAN Topology */}
      {activeTab === 'network' && (
        <div className="space-y-5">
          <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-mono">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center">
                <Network size={16} className="mr-2 text-cyan-400" /> Managed RAN Topology Matrix
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Active geographic regions, gNodeB macro sites, and small-cell sectors mapped to Acme Telecom.
              </p>
            </div>
            <Link
              href="/dashboard/region/NA-EAST"
              className="bg-cyan-600/30 hover:bg-cyan-600 text-cyan-200 hover:text-white border border-cyan-500/40 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center transition-all"
            >
              Inspect Live Regional NOC <ArrowRight size={13} className="ml-1.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            {TOPOLOGY_REGIONS.map(reg => (
              <div 
                key={reg.id} 
                className={`stitch-card border rounded-xl p-5 space-y-3 transition-all ${
                  reg.status === 'WARNING' 
                    ? 'border-amber-500/40 bg-gradient-to-br from-[#1C1715] to-[#111A2E]' 
                    : 'border-[#24385E] bg-[#111A2E]'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-white">{reg.name}</h3>
                    <span className="text-[10px] text-cyan-400 font-bold">{reg.code}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                    reg.status === 'HEALTHY' 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {reg.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-[#1C2C4E] pt-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Macro Sites</span>
                    <span className="font-bold text-white text-sm">{reg.sitesCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Cell Sectors</span>
                    <span className="font-bold text-white text-sm">{reg.cellsCount}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-[#1C2C4E]">
                  <span className="text-slate-400 text-[11px]">SLA Availability</span>
                  <span className={`font-bold ${reg.status === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-300'}`}>
                    {reg.availability}
                  </span>
                </div>

                <Link
                  href={`/dashboard/region/${reg.code}`}
                  className="w-full text-center block bg-[#15233E] hover:bg-[#1E335A] text-slate-300 hover:text-cyan-300 border border-[#253961] py-1.5 rounded-lg text-xs font-bold transition-all"
                >
                  Manage Region &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AI Policies & Guards */}
      {activeTab === 'ai' && (
        <div className="stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl p-6 space-y-5 font-mono">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#1E2E4E]">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center">
                <Activity size={16} className="mr-2 text-purple-400" /> AI Model Guardrails & Autonomous Execution Gates
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enable or restrict telemetry-driven machine learning models, RCA pipelines, and Copilot actuation.
              </p>
            </div>
            <span className="text-[10px] text-purple-300 bg-purple-500/20 border border-purple-500/40 px-2.5 py-0.5 rounded font-bold">
              LOCAL OLLAMA RUNTIME
            </span>
          </div>

          <div className="space-y-4">
            {aiToggles.map(toggle => (
              <div 
                key={toggle.id} 
                className={`border rounded-xl p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  toggle.active 
                    ? 'border-[#253961] bg-[#14203A]' 
                    : 'border-dashed border-[#1E2E4E] bg-[#0E172B]/60 opacity-60'
                }`}
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white">{toggle.title}</h3>
                    {toggle.requiresGate && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] px-1.5 py-0.2 rounded font-bold">
                        REQUIRES 2-PERSON GATE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{toggle.description}</p>
                  <p className="text-[10px] text-cyan-400 pt-0.5">Architecture: <strong>{toggle.engine}</strong></p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className="text-[10px] text-slate-400">
                    {toggle.active ? 'Feature Enabled' : 'Feature Paused'}
                  </span>
                  <button
                    onClick={() => handleToggleAi(toggle.id)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                      toggle.active ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                      toggle.active ? 'translate-x-5' : 'translate-x-0'
                    }`}></div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Enterprise Integrations */}
      {activeTab === 'integrations' && (
        <div className="stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl p-6 space-y-5 font-mono">
          <div className="flex justify-between items-center pb-3 border-b border-[#1E2E4E]">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center">
                <Database size={16} className="mr-2 text-cyan-400" /> Enterprise Connector Ecosystem
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time sync brokers connecting telemetry ingestors, BSS billing, and IT service management.
              </p>
            </div>
            <span className="text-[10px] text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
              4/4 CONNECTED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFAULT_INTEGRATIONS.map(int => (
              <div key={int.id} className="bg-[#14203A] border border-[#253961] p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-bold text-white">{int.name}</h3>
                    <span className="text-[10px] text-cyan-400">{int.id} · {int.type}</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[9px] font-bold">
                    {int.status}
                  </span>
                </div>

                <div className="bg-[#0E172B] p-2.5 rounded border border-[#22355A] text-[11px] text-slate-300 truncate">
                  Endpoint: <code className="text-cyan-300">{int.endpoint}</code>
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <div className="text-[11px] text-slate-400">
                    Latency: <strong className="text-emerald-400">{int.latency}</strong> · Rate: <strong className="text-slate-200">{int.throughput}</strong>
                  </div>
                  <button
                    onClick={() => handlePingIntegration(int.name)}
                    className="bg-[#15233E] hover:bg-[#1E335A] text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer"
                  >
                    Test Ping
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Invite User */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="stitch-card bg-[#111A2E] border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 font-mono shadow-[0_0_40px_rgba(6,182,212,0.15)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-[#24385E]">
              <h3 className="text-base font-black text-white flex items-center">
                <Users className="mr-2 text-cyan-400" size={18} /> Invite Team Member to Tenant
              </h3>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jordan Miller"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full bg-[#0E172B] border border-[#253961] focus:border-cyan-400 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">Corporate Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. j.miller@acmetelecom.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-[#0E172B] border border-[#253961] focus:border-cyan-400 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">Assigned RBAC Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TenantUser['role'])}
                  className="w-full bg-[#0E172B] border border-[#253961] focus:border-cyan-400 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="NETWORK_ENGINEER">NETWORK_ENGINEER (RAN telemetry & cell operations)</option>
                  <option value="TENANT_ADMIN">TENANT_ADMIN (Full tenant control & member invitations)</option>
                  <option value="DATA_ANALYST">DATA_ANALYST (Reports, exports & sentiment intelligence)</option>
                  <option value="CUSTOMER_OPERATIONS">CUSTOMER_OPERATIONS (Customer 360 & ticket triage)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-[#24385E]">
              <button
                onClick={() => setShowInviteModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteUser}
                disabled={!inviteName.trim() || !inviteEmail.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
