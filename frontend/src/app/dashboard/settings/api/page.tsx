"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Key, 
  Code, 
  Activity, 
  Copy, 
  BookOpen, 
  Clock, 
  ShieldCheck, 
  Database, 
  Zap, 
  Check, 
  CheckCircle2, 
  Search, 
  Plus, 
  Bot, 
  ExternalLink, 
  Terminal, 
  X,
  ShieldAlert
} from 'lucide-react';

interface ApiKeyItem {
  id: string;
  name: string;
  tokenMasked: string;
  fullToken: string;
  scopes: string[];
  status: 'ACTIVE' | 'REVOKED';
  lastUsed: string;
  created: string;
}

const DEFAULT_KEYS: ApiKeyItem[] = [
  { 
    id: "API-9X82", 
    name: "Production ERP & Billing Sync", 
    tokenMasked: "tk_live_9X82...d4a1", 
    fullToken: "tk_live_9X82fa8102b4d99c381ad4a1",
    scopes: ["read:network", "read:incidents", "read:billing"], 
    status: "ACTIVE", 
    lastUsed: "2 mins ago", 
    created: "Oct 1, 2026" 
  },
  { 
    id: "API-4B21", 
    name: "Data Warehouse Telemetry ETL", 
    tokenMasked: "tk_live_4B21...8f02", 
    fullToken: "tk_live_4B21cc90184b91aa048f02",
    scopes: ["read:metrics", "read:ai", "read:cells"], 
    status: "ACTIVE", 
    lastUsed: "1 hour ago", 
    created: "Oct 5, 2026" 
  },
  { 
    id: "API-7K19", 
    name: "NOC Field Dispatch Webhook Integration", 
    tokenMasked: "tk_live_7K19...3b99", 
    fullToken: "tk_live_7K1988ef110bc88aa3b99",
    scopes: ["read:incidents", "write:incidents"], 
    status: "ACTIVE", 
    lastUsed: "Yesterday", 
    created: "Sep 28, 2026" 
  },
  { 
    id: "API-1V99", 
    name: "Deprecated Testing Key (Staging)", 
    tokenMasked: "tk_live_1V99...00ab", 
    fullToken: "tk_live_1V99aa001188bb99cc00ab",
    scopes: ["read:all", "write:all"], 
    status: "REVOKED", 
    lastUsed: "3 weeks ago", 
    created: "Sep 15, 2026" 
  }
];

const LOG_ENTRIES = [
  { time: "14:02:01", code: 200, method: "GET", path: "/api/v1/network", latency: "45ms", key: "tk_live_...9X82", status: "OK" },
  { time: "14:02:15", code: 200, method: "GET", path: "/api/v1/incidents?status=OPEN", latency: "112ms", key: "tk_live_...9X82", status: "OK" },
  { time: "14:03:00", code: 401, method: "POST", path: "/api/v1/ai/predict", latency: "2ms", key: "tk_live_...4B21", status: "Insufficient Scope" },
  { time: "14:03:05", code: 200, method: "GET", path: "/api/v1/cells?site=NYC-01", latency: "65ms", key: "tk_live_...9X82", status: "OK" },
  { time: "14:03:42", code: 200, method: "GET", path: "/api/v1/sites", latency: "38ms", key: "tk_live_...4B21", status: "OK" },
  { time: "14:04:19", code: 200, method: "POST", path: "/api/v1/incidents/INC-8492/ack", latency: "84ms", key: "tk_live_...7K19", status: "OK" },
];

export default function ApiSettingsPage() {
  const [activeTab, setActiveTab] = useState<'keys' | 'usage' | 'snippets' | 'logs'>('keys');
  const [keys, setKeys] = useState<ApiKeyItem[]>(DEFAULT_KEYS);
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // New Key Modal State
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["read:network", "read:metrics"]);

  // Code Snippet Tab
  const [snippetLang, setSnippetLang] = useState<'curl' | 'python' | 'ts'>('curl');

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setNotification(`Copied token to clipboard.`);
    setTimeout(() => {
      setCopiedKeyId(null);
      setNotification(null);
    }, 3000);
  };

  const handleToggleKeyStatus = (id: string) => {
    setKeys(prev => prev.map(k => {
      if (k.id === id) {
        const nextStatus = k.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
        setNotification(`API Key ${k.id} (${k.name}) marked as ${nextStatus}.`);
        setTimeout(() => setNotification(null), 4000);
        return { ...k, status: nextStatus };
      }
      return k;
    }));
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newId = `API-${randomHex}`;
    const fullToken = `tk_live_${randomHex.toLowerCase()}${Math.random().toString(36).substring(2, 16)}`;
    const newKey: ApiKeyItem = {
      id: newId,
      name: newKeyName,
      tokenMasked: `tk_live_${randomHex.toLowerCase()}...${fullToken.slice(-4)}`,
      fullToken,
      scopes: selectedScopes.length > 0 ? selectedScopes : ["read:network"],
      status: "ACTIVE",
      lastUsed: "Never",
      created: "Just now"
    };

    setKeys(prev => [newKey, ...prev]);
    setNewKeyName("");
    setShowNewKeyModal(false);
    setNotification(`Created new API key ${newId}. Make sure to copy your secret key.`);
    setTimeout(() => setNotification(null), 5000);
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes(prev => 
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    );
  };

  const filteredKeys = keys.filter(k => 
    k.name.toLowerCase().includes(search.toLowerCase()) ||
    k.id.toLowerCase().includes(search.toLowerCase()) ||
    k.scopes.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Stitch AI Header */}
      <div className="stitch-card p-6 border border-[#24385E] bg-gradient-to-r from-[#111A2E] via-[#15233E] to-[#0E172A] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-cyan-400 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-bold tracking-wider uppercase">PROGRAMMATIC GATEWAY & DEVELOPER APIS</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <Code className="mr-2.5 text-cyan-400" size={26} />
            Developer & API Access Control
          </h1>
          <p className="text-xs text-slate-300 font-mono mt-1">
            Manage scoped REST API keys, JWT service tokens, rate-limit quotas, and live telemetry request logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/copilot?prompt=Review active developer API keys, token scopes, and recent 401 error logs"
            className="bg-[#15233E] hover:bg-[#1C2F52] border border-cyan-500/40 text-cyan-300 px-3.5 py-2 rounded-lg font-bold text-xs flex items-center transition-all font-mono shadow-sm"
          >
            <Bot size={15} className="mr-1.5 text-cyan-400" /> Audit in Copilot
          </Link>
          
          <a 
            href="http://localhost:3001/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-[#14203A] hover:bg-[#1A2A4C] border border-[#253961] text-slate-200 px-3.5 py-2 rounded-lg font-bold text-xs flex items-center transition-all font-mono shadow-sm"
          >
            <BookOpen size={15} className="mr-1.5 text-cyan-400" /> View OpenAPI Docs <ExternalLink size={12} className="ml-1.5 text-slate-400" />
          </a>

          <button 
            onClick={() => setShowNewKeyModal(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center shadow-[0_0_14px_rgba(6,182,212,0.3)] transition-all font-mono cursor-pointer"
          >
            <Plus size={15} className="mr-1.5" /> Generate New Key
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
        
        {/* Daily Requests */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <Zap size={14} className="mr-1.5 text-amber-400" /> Daily Requests (24h)
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              42% QUOTA
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-white mt-2">
            42,109 <span className="text-xs font-normal text-slate-400">/ 100k</span>
          </p>
          <div className="w-full bg-[#182643] rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: '42%' }}></div>
          </div>
        </div>

        {/* Latency */}
        <div className="stitch-card p-5 border border-cyan-500/40 bg-gradient-to-br from-[#102038] to-[#111A2E] rounded-xl shadow-[0_4px_20px_rgba(6,182,212,0.08)]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center">
              <Activity size={14} className="mr-1.5 text-cyan-400" /> Gateway Avg Latency
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
              FAST p95
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-cyan-300 mt-2">
            45ms
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
            p99 &lt; 115ms across Express & FastAPI
          </p>
        </div>

        {/* Error Rate */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <Database size={14} className="mr-1.5 text-emerald-400" /> Global Error Rate
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              SLA NORMAL
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-emerald-300 mt-2">
            0.02%
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
            4xx: 8 events · 5xx: 0 events
          </p>
        </div>

        {/* Security / Tokens */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <ShieldCheck size={14} className="mr-1.5 text-purple-400" /> Token Security
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
              SHA-256
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-purple-300 mt-2">
            {keys.filter(k => k.status === 'ACTIVE').length} Active Keys
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
            Strict tenant isolation enforced
          </p>
        </div>

      </div>

      {/* Security Best Practices Banner */}
      <div className="stitch-card p-4 border border-cyan-500/40 bg-gradient-to-r from-[#102038] via-[#122442] to-[#0E172B] rounded-xl flex items-start space-x-3.5 shadow-sm">
        <ShieldCheck className="text-cyan-400 mt-0.5 shrink-0" size={20} />
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
            Zero-Trust API Key Architecture & Tenant Sandboxing
          </h3>
          <p className="text-xs font-mono text-slate-300 leading-relaxed">
            API Keys grant direct programmatic access to your tenant telemetry. All secret tokens are stored as salted <code className="bg-[#090F1D] px-1.5 py-0.5 rounded text-cyan-300 border border-cyan-500/30 text-[11px]">SHA-256</code> hashes and verified in memory. Always enforce the principle of least privilege by scoping keys strictly (e.g. <code className="text-cyan-300">read:metrics</code> only) rather than granting global permissions.
          </p>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="stitch-card p-3 border border-[#24385E] bg-[#111A2E] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex space-x-1.5 font-mono text-xs w-full sm:w-auto">
          {[
            { id: 'keys', label: `API Access Keys (${keys.length})`, icon: <Key size={13} className="mr-1.5" /> },
            { id: 'snippets', label: 'Code Snippets (cURL, Python)', icon: <Terminal size={13} className="mr-1.5" /> },
            { id: 'logs', label: 'Live Request Stream', icon: <Activity size={13} className="mr-1.5" /> },
            { id: 'usage', label: 'Quota Breakdown', icon: <Zap size={13} className="mr-1.5" /> },
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

        {activeTab === 'keys' && (
          <div className="flex items-center bg-[#0E172B] border border-[#253961] rounded-lg px-3 py-1.5 w-full sm:w-72">
            <Search size={14} className="text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search keys or scopes..."
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
        )}
      </div>

      {/* TAB 1: API Keys List */}
      {activeTab === 'keys' && (
        <div className="stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono">
              <thead>
                <tr className="bg-[#0E172B] border-b border-[#1E2E4E] text-[11px] text-slate-400 uppercase tracking-wider">
                  <th className="p-3.5">Key Name & Identifier</th>
                  <th className="p-3.5">Token Secret</th>
                  <th className="p-3.5">Assigned Scopes</th>
                  <th className="p-3.5">Last Used</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182643] text-xs">
                {filteredKeys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No API keys match criteria.
                    </td>
                  </tr>
                ) : (
                  filteredKeys.map(k => (
                    <tr key={k.id} className="hover:bg-[#14203A] transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white text-sm">{k.name}</div>
                        <div className="text-[10px] text-cyan-400 mt-0.5">{k.id} · Created {k.created}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="inline-flex items-center space-x-2 bg-[#0E172B] border border-[#253961] px-2.5 py-1 rounded text-slate-300">
                          <code className="text-xs text-cyan-300">{k.tokenMasked}</code>
                          <button
                            onClick={() => handleCopy(k.id, k.fullToken)}
                            className="text-slate-400 hover:text-cyan-300 transition-colors p-0.5"
                            title="Copy Secret Token"
                          >
                            {copiedKeyId === k.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {k.scopes.map(s => (
                            <span 
                              key={s} 
                              className="bg-[#15233E] text-slate-300 border border-[#253961] text-[10px] px-1.5 py-0.5 rounded font-mono"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-400">
                        <div className="flex items-center text-xs">
                          <Clock size={12} className="mr-1 text-slate-500" />
                          {k.lastUsed}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          k.status === 'ACTIVE' 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}>
                          {k.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleKeyStatus(k.id)}
                          className={`text-xs font-bold px-2.5 py-1 rounded border transition-all ${
                            k.status === 'ACTIVE' 
                              ? 'text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30' 
                              : 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30'
                          }`}
                        >
                          {k.status === 'ACTIVE' ? 'Revoke Key' : 'Reactivate'}
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

      {/* TAB 2: Code Integration Snippets */}
      {activeTab === 'snippets' && (
        <div className="stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl p-6 space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#1E2E4E]">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center">
                <Terminal size={16} className="mr-2 text-cyan-400" /> Ready-to-Use SDK & API Snippets
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Authenticating against the Telecom Platform Core REST API at <code className="text-cyan-300">http://localhost:3001/api/v1</code>.
              </p>
            </div>

            <div className="flex space-x-1.5 text-xs bg-[#0E172B] p-1 rounded-lg border border-[#253961]">
              {(['curl', 'python', 'ts'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setSnippetLang(lang)}
                  className={`px-3 py-1 rounded uppercase font-bold transition-all ${
                    snippetLang === lang 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="relative bg-[#090F1D] border border-cyan-500/30 rounded-xl p-4 overflow-x-auto text-xs">
            <button
              onClick={() => handleCopy('snippet', snippetLang === 'curl' 
                ? `curl -X GET "http://localhost:3001/api/v1/network" \\\n  -H "Authorization: Bearer tk_live_9X82fa8102b4d99c381ad4a1" \\\n  -H "Content-Type: application/json"`
                : snippetLang === 'python'
                ? `import requests\n\nheaders = {\n    "Authorization": "Bearer tk_live_9X82fa8102b4d99c381ad4a1",\n    "Content-Type": "application/json"\n}\nres = requests.get("http://localhost:3001/api/v1/network", headers=headers)\nprint(res.json())`
                : `const res = await fetch("http://localhost:3001/api/v1/network", {\n  headers: {\n    "Authorization": "Bearer tk_live_9X82fa8102b4d99c381ad4a1",\n    "Content-Type": "application/json"\n  }\n});\nconst data = await res.json();\nconsole.log(data);`
              )}
              className="absolute top-3 right-3 bg-[#15233E] hover:bg-[#1E335A] text-slate-300 hover:text-white px-2.5 py-1 rounded border border-[#253961] text-[11px] flex items-center transition-all"
            >
              <Copy size={12} className="mr-1" /> Copy Snippet
            </button>

            {snippetLang === 'curl' && (
              <pre className="text-cyan-300 leading-relaxed">
{`# 1. Query Real-Time Network Inventory
curl -X GET "http://localhost:3001/api/v1/network" \\
  -H "Authorization: Bearer tk_live_9X82fa8102b4d99c381ad4a1" \\
  -H "Content-Type: application/json"

# 2. Query Active Network Incidents
curl -X GET "http://localhost:3001/api/v1/incidents?status=OPEN" \\
  -H "Authorization: Bearer tk_live_9X82fa8102b4d99c381ad4a1"`}
              </pre>
            )}

            {snippetLang === 'python' && (
              <pre className="text-emerald-300 leading-relaxed">
{`import requests

API_URL = "http://localhost:3001/api/v1"
HEADERS = {
    "Authorization": "Bearer tk_live_9X82fa8102b4d99c381ad4a1",
    "Content-Type": "application/json"
}

# Fetch cell status and topology
response = requests.get(f"{API_URL}/cells", headers=HEADERS)
if response.status_code == 200:
    cells = response.json().get("data", [])
    print(f"Loaded {len(cells)} operational cell towers")`}
              </pre>
            )}

            {snippetLang === 'ts' && (
              <pre className="text-purple-300 leading-relaxed">
{`import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  headers: {
    'Authorization': 'Bearer tk_live_9X82fa8102b4d99c381ad4a1',
    'Content-Type': 'application/json',
  },
});

export async function fetchLiveIncidents() {
  const { data } = await client.get('/incidents', { params: { status: 'OPEN' } });
  return data.data;
}`}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Live Request Stream */}
      {activeTab === 'logs' && (
        <div className="stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl p-5 space-y-3 font-mono">
          <div className="flex justify-between items-center pb-3 border-b border-[#1E2E4E]">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
              <Activity size={15} className="mr-2 text-cyan-400" /> Live Inbound HTTP Telemetry Stream
            </h2>
            <span className="text-[10px] text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
              LOGGING STREAM: ACTIVE
            </span>
          </div>

          <div className="bg-[#080E1B] border border-[#1A2846] rounded-xl p-4 space-y-2 text-xs overflow-x-auto">
            {LOG_ENTRIES.map((log, idx) => (
              <div key={idx} className="flex items-center space-x-3 py-1 border-b border-white/5 last:border-0">
                <span className="text-slate-500 text-[11px]">[{log.time}]</span>
                <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                  log.code === 200 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {log.code} {log.method}
                </span>
                <span className="text-white font-bold">{log.path}</span>
                <span className="text-cyan-400 text-[11px]">({log.latency})</span>
                <span className="text-slate-400 text-[11px] truncate">{log.key}</span>
                {log.code !== 200 && (
                  <span className="text-rose-400 text-[10px] font-bold">[{log.status}]</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Quota Breakdown */}
      {activeTab === 'usage' && (
        <div className="stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl p-6 space-y-5 font-mono">
          <div className="flex justify-between items-center pb-3 border-b border-[#1E2E4E]">
            <h2 className="text-sm font-bold text-white flex items-center">
              <Zap size={16} className="mr-2 text-amber-400" /> Tenant Quotas & Rate Limiting Engine
            </h2>
            <span className="text-[10px] text-cyan-300 bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-0.5 rounded font-bold">
              TIER: ENTERPRISE NOC
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#15233E] border border-[#253961] p-4 rounded-xl space-y-2">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">In-Flight Concurrency</span>
              <p className="text-2xl font-black text-white">12 <span className="text-xs text-slate-400">/ 50 streams</span></p>
              <div className="w-full bg-[#182643] rounded-full h-1.5 overflow-hidden">
                <div className="bg-cyan-400 h-1.5" style={{ width: '24%' }}></div>
              </div>
            </div>

            <div className="bg-[#15233E] border border-[#253961] p-4 rounded-xl space-y-2">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Burst Window Limit</span>
              <p className="text-2xl font-black text-amber-300">1,000 <span className="text-xs text-slate-400">req / 15m</span></p>
              <div className="w-full bg-[#182643] rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-400 h-1.5" style={{ width: '42%' }}></div>
              </div>
            </div>

            <div className="bg-[#15233E] border border-[#253961] p-4 rounded-xl space-y-2">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">AI Inference Requests</span>
              <p className="text-2xl font-black text-emerald-300">20 <span className="text-xs text-slate-400">req / min</span></p>
              <div className="w-full bg-[#182643] rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-400 h-1.5" style={{ width: '30%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Generate New API Key */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="stitch-card bg-[#111A2E] border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 font-mono shadow-[0_0_40px_rgba(6,182,212,0.15)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-[#24385E]">
              <h3 className="text-base font-black text-white flex items-center">
                <Key className="mr-2 text-cyan-400" size={18} /> Generate Secret API Key
              </h3>
              <button 
                onClick={() => setShowNewKeyModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">Key Identifier / Integration Name</label>
                <input
                  type="text"
                  placeholder="e.g. Prometheus Exporter or Billing Bot..."
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full bg-[#0E172B] border border-[#253961] focus:border-cyan-400 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 font-bold block">Assigned Least-Privilege Scopes</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "read:network",
                    "read:metrics",
                    "read:incidents",
                    "write:incidents",
                    "read:ai",
                    "read:billing"
                  ].map(scope => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => toggleScope(scope)}
                      className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                        selectedScopes.includes(scope)
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                          : 'bg-[#15233E] text-slate-400 border-[#253961] hover:text-slate-200'
                      }`}
                    >
                      <span>{scope}</span>
                      {selectedScopes.includes(scope) && <Check size={12} className="text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#090F1D] border border-amber-500/30 p-3 rounded-lg text-amber-200 text-[11px] flex items-start space-x-2">
                <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <p>Secret tokens are displayed only once upon generation. Be sure to copy and store the key in a secure secrets manager.</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-[#24385E]">
              <button
                onClick={() => setShowNewKeyModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                disabled={!newKeyName.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer"
              >
                Create API Key
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
