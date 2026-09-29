"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Clock, 
  ShieldAlert, 
  BarChart2, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle,
  Search,
  RefreshCw,
  Bot,
  Calendar,
  Database,
  Layers
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  type: string;
  format: 'PDF' | 'EXCEL' | 'CSV' | 'PARQUET';
  schedule: string;
  scheduleHuman: string;
  roles: string[];
  description: string;
}

interface ReportExecution {
  id: string;
  template: string;
  templateId: string;
  format: 'PDF' | 'EXCEL' | 'CSV' | 'PARQUET';
  requestedBy: string;
  status: 'COMPLETED' | 'GENERATING' | 'FAILED';
  time: string;
  size: string;
  error?: string;
}

const DEFAULT_TEMPLATES: ReportTemplate[] = [
  { 
    id: "TPL-01", 
    name: "Executive Network SLA & Health Summary", 
    type: "NETWORK_PERFORMANCE", 
    format: "PDF", 
    schedule: "0 0 * * *", 
    scheduleHuman: "Daily at 00:00 UTC",
    roles: ["TENANT_ADMIN", "EXECUTIVE_BOARD"],
    description: "Holistic 24-hour network availability, MTTR breakdown, outage duration, and regional SLA compliance."
  },
  { 
    id: "TPL-02", 
    name: "Revenue Leakage & Mediation Audit", 
    type: "REVENUE_RECONCILIATION", 
    format: "EXCEL", 
    schedule: "0 6 * * 1", 
    scheduleHuman: "Weekly (Monday 06:00 UTC)",
    roles: ["TENANT_ADMIN", "FINANCE_ANALYST"],
    description: "Detailed CDR mediation variances, unbilled usage anomalies, duplicate discounts, and automated adjustments."
  },
  { 
    id: "TPL-03", 
    name: "Predictive Hardware Reliability Matrix", 
    type: "PREDICTIVE_MAINTENANCE", 
    format: "CSV", 
    schedule: "0 8 * * 1", 
    scheduleHuman: "Weekly (Monday 08:00 UTC)",
    roles: ["NETWORK_ENGINEER", "TENANT_ADMIN"],
    description: "Degradation forecasting, MTBF risk scores, core temperatures, and prescribed field work order dispatches."
  },
  { 
    id: "TPL-04", 
    name: "Omnichannel Churn Risk & Sentiment Intelligence", 
    type: "CHURN_ANALYTICS", 
    format: "PDF", 
    schedule: "On-demand", 
    scheduleHuman: "Manual trigger / Event driven",
    roles: ["DATA_ANALYST", "TENANT_ADMIN", "CUSTOMER_SUPPORT"],
    description: "Customer emotion tracking, high-urgency ticket clusters, subscriber NPS risk, and retention ROI."
  },
  { 
    id: "TPL-05", 
    name: "5G-SA RAN Telemetry & Anomaly Trace", 
    type: "RADIO_ANALYTICS", 
    format: "PARQUET", 
    schedule: "*/15 * * * *", 
    scheduleHuman: "Every 15 minutes (Streaming)",
    roles: ["NETWORK_ENGINEER", "PLATFORM_SUPER_ADMIN"],
    description: "Compressed cell-level telemetry datasets containing throughput, RSRP, SINR, and handover failure events."
  },
  { 
    id: "TPL-06", 
    name: "Regulatory SLA & Emergency E911 Compliance", 
    type: "REGULATORY_COMPLIANCE", 
    format: "PDF", 
    schedule: "0 0 1 * *", 
    scheduleHuman: "Monthly (1st of month)",
    roles: ["LEGAL_COMPLIANCE", "TENANT_ADMIN"],
    description: "Audited telecommunication authority compliance records, uptime certificates, and public safety routing."
  }
];

const DEFAULT_EXECUTIONS: ReportExecution[] = [
  { 
    id: "EXEC-904", 
    template: "Revenue Leakage & Mediation Audit", 
    templateId: "TPL-02", 
    format: "EXCEL", 
    requestedBy: "Sarah J. (Finance Lead)", 
    status: "COMPLETED", 
    time: "12 mins ago", 
    size: "4.8 MB" 
  },
  { 
    id: "EXEC-903", 
    template: "Executive Network SLA & Health Summary", 
    templateId: "TPL-01", 
    format: "PDF", 
    requestedBy: "Automated System (Cron)", 
    status: "COMPLETED", 
    time: "1 hour ago", 
    size: "1.2 MB" 
  },
  { 
    id: "EXEC-902", 
    template: "Predictive Hardware Reliability Matrix", 
    templateId: "TPL-03", 
    format: "CSV", 
    requestedBy: "John D. (NOC Ops)", 
    status: "COMPLETED", 
    time: "3 hours ago", 
    size: "18.4 MB" 
  },
  { 
    id: "EXEC-901", 
    template: "Omnichannel Churn Risk & Sentiment Intelligence", 
    templateId: "TPL-04", 
    format: "PDF", 
    requestedBy: "System Dispatcher", 
    status: "COMPLETED", 
    time: "6 hours ago", 
    size: "890 KB" 
  },
  { 
    id: "EXEC-900", 
    template: "5G-SA RAN Telemetry & Anomaly Trace", 
    templateId: "TPL-05", 
    format: "PARQUET", 
    requestedBy: "DuckDB Pipeline", 
    status: "FAILED", 
    time: "Yesterday, 22:15 UTC", 
    size: "0 KB", 
    error: "S3 Export Storage Timeout (Code: S3_CONN_ERR)" 
  }
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'history' | 'schedules'>('templates');
  const [templates] = useState<ReportTemplate[]>(DEFAULT_TEMPLATES);
  const [executions, setExecutions] = useState<ReportExecution[]>(DEFAULT_EXECUTIONS);
  const [search, setSearch] = useState("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const handleGenerateNow = (tpl: ReportTemplate) => {
    setGeneratingId(tpl.id);
    setTimeout(() => {
      const newExecId = `EXEC-${Math.floor(1000 + Math.random() * 9000)}`;
      const newExec: ReportExecution = {
        id: newExecId,
        template: tpl.name,
        templateId: tpl.id,
        format: tpl.format,
        requestedBy: "Operator (Manual Session)",
        status: "COMPLETED",
        time: "Just now",
        size: tpl.format === 'PDF' ? '1.4 MB' : tpl.format === 'EXCEL' ? '5.2 MB' : tpl.format === 'PARQUET' ? '42.0 MB' : '8.6 MB'
      };

      setExecutions(prev => [newExec, ...prev]);
      setGeneratingId(null);
      setNotification(`Report ${newExecId} (${tpl.name}) compiled successfully and ready for download.`);
      setTimeout(() => setNotification(null), 5000);
    }, 700);
  };

  const handleDownloadFile = (exec: ReportExecution) => {
    const csvContent = `ReportID,Template,Format,GeneratedAt,Status\n${exec.id},"${exec.template}",${exec.format},${new Date().toISOString()},${exec.status}\n# Telecom AI Command Center Export - Verified Telemetry Data`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exec.id}-${exec.template.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.${exec.format.toLowerCase() === 'excel' ? 'csv' : exec.format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setNotification(`Downloaded ${exec.id} (${exec.format}) to local system.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const getFormatBadge = (format: ReportTemplate['format']) => {
    switch (format) {
      case 'PDF':
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case 'EXCEL':
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case 'CSV':
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      case 'PARQUET':
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
    }
  };

  const getFormatIcon = (format: ReportTemplate['format']) => {
    switch (format) {
      case 'PDF':
        return <FileText size={15} className="text-rose-400" />;
      case 'EXCEL':
        return <FileSpreadsheet size={15} className="text-emerald-400" />;
      case 'CSV':
        return <FileText size={15} className="text-cyan-400" />;
      case 'PARQUET':
        return <Database size={15} className="text-purple-400" />;
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase()) ||
    t.format.toLowerCase().includes(search.toLowerCase())
  );

  const filteredExecutions = executions.filter(e =>
    e.template.toLowerCase().includes(search.toLowerCase()) ||
    e.id.toLowerCase().includes(search.toLowerCase()) ||
    e.requestedBy.toLowerCase().includes(search.toLowerCase()) ||
    e.format.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Stitch AI Header */}
      <div className="stitch-card p-6 border border-[#24385E] bg-gradient-to-r from-[#111A2E] via-[#15233E] to-[#0E172A] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-cyan-400 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-bold tracking-wider uppercase">TELECOM DATA WAREHOUSE & EXPORT ENGINE</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <BarChart2 className="mr-2.5 text-cyan-400" size={26} />
            Enterprise Reports & Telemetry Exports
          </h1>
          <p className="text-xs text-slate-300 font-mono mt-1">
            Automated NOC performance intelligence, regulatory compliance audits, CDR datasets, and executive exports.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/copilot?prompt=Summarize the latest executive network reports and highlight SLA breaches"
            className="bg-[#15233E] hover:bg-[#1C2F52] border border-cyan-500/40 text-cyan-300 px-4 py-2 rounded-lg font-bold text-xs flex items-center transition-all font-mono shadow-sm"
          >
            <Bot size={15} className="mr-1.5 text-cyan-400" /> Analyze in Copilot
          </Link>
          <button 
            onClick={() => setActiveTab('history')}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center shadow-[0_0_14px_rgba(6,182,212,0.3)] transition-all font-mono cursor-pointer"
          >
            <Download size={14} className="mr-1.5" /> View Downloads ({executions.length})
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
        
        {/* Reports Generated */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <FileText size={14} className="mr-1.5 text-cyan-400" /> Monthly Exports (30D)
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
              +14.2%
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-white mt-2">
            1,248 <span className="text-xs font-normal text-slate-400">reports</span>
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
            PDF · Excel · Parquet · CSV
          </p>
        </div>

        {/* Active Automated Crons */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <Calendar size={14} className="mr-1.5 text-emerald-400" /> Automated Schedules
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              ACTIVE
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-emerald-300 mt-2">
            18 Crons
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
            Daily midnight & weekly recurring
          </p>
        </div>

        {/* Data Volume */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <Database size={14} className="mr-1.5 text-purple-400" /> Total Exported Volume
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
              WAREHOUSE
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-purple-300 mt-2">
            4.8 TB
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
            Encrypted object storage repository
          </p>
        </div>

        {/* Latency */}
        <div className="stitch-card p-5 border border-[#24385E] bg-[#111A2E] rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center">
              <Clock size={14} className="mr-1.5 text-amber-400" /> Avg Generation Speed
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              SLA READY
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-amber-300 mt-2">
            1.4s
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
            DuckDB columnar analytics engine
          </p>
        </div>

      </div>

      {/* Tabs & Search Navigation Bar */}
      <div className="stitch-card p-3 border border-[#24385E] bg-[#111A2E] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex space-x-1.5 font-mono text-xs w-full sm:w-auto">
          {[
            { id: 'templates', label: 'Report Templates', icon: <Layers size={13} className="mr-1.5" /> },
            { id: 'history', label: `Generation History (${executions.length})`, icon: <Clock size={13} className="mr-1.5" /> },
            { id: 'schedules', label: 'Automated Crons', icon: <Calendar size={13} className="mr-1.5" /> },
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

        <div className="flex items-center bg-[#0E172B] border border-[#253961] rounded-lg px-3 py-1.5 w-full sm:w-72">
          <Search size={14} className="text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search templates or history..."
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

      {/* TAB 1: Report Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Create Custom Template Card */}
          <div className="stitch-card border-2 border-dashed border-[#2A4270] hover:border-cyan-400/60 bg-[#0E172B]/60 rounded-xl p-6 flex flex-col items-center justify-center text-center group cursor-pointer transition-all min-h-[260px]">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
              <PlusCircle size={24} />
            </div>
            <h3 className="font-bold font-mono text-sm text-white group-hover:text-cyan-300 transition-colors">
              Create Custom Report Template
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-1.5 max-w-xs leading-relaxed">
              Define custom SQL/DuckDB telemetry queries, select format (PDF/Excel/Parquet), and assign RBAC roles.
            </p>
            <span className="mt-4 px-3 py-1 rounded bg-[#15233E] border border-[#253961] text-[10px] font-mono text-cyan-300 font-bold group-hover:border-cyan-500/40">
              Configure Query & Scheduling
            </span>
          </div>

          {filteredTemplates.map(tpl => {
            const isGenerating = generatingId === tpl.id;
            return (
              <div 
                key={tpl.id} 
                className="stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl p-5 flex flex-col justify-between hover:border-cyan-500/40 transition-all shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-[#15233E] border border-[#253961] px-2 py-0.5 rounded">
                      {tpl.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center space-x-1 ${getFormatBadge(tpl.format)}`}>
                      {getFormatIcon(tpl.format)}
                      <span className="ml-1">{tpl.format}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white font-mono tracking-tight leading-snug mb-1">
                    {tpl.name}
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-slate-400 block mb-3 uppercase tracking-wider">
                    {tpl.type.replace(/_/g, ' ')}
                  </span>

                  <p className="text-xs font-mono text-slate-300 mb-4 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>

                  <div className="space-y-1.5 text-xs font-mono border-t border-[#1C2C4E] pt-3 mb-4">
                    <div className="flex items-center text-slate-400">
                      <Clock size={13} className="mr-2 text-cyan-400 shrink-0" />
                      <span className="truncate">{tpl.scheduleHuman}</span>
                    </div>
                    <div className="flex items-center text-slate-400">
                      <ShieldAlert size={13} className="mr-2 text-amber-400 shrink-0" />
                      <span className="truncate" title={tpl.roles.join(', ')}>Roles: {tpl.roles.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-3 border-t border-[#1C2C4E]">
                  <button 
                    onClick={() => handleGenerateNow(tpl)}
                    disabled={isGenerating}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold font-mono py-2 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  >
                    <RefreshCw size={13} className={`mr-1.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? "Compiling..." : "Generate Now"}
                  </button>

                  <Link 
                    href={`/dashboard/copilot?prompt=${encodeURIComponent(`Summarize the contents and operational key findings for ${tpl.name} (${tpl.id}) across current network telemetry.`)}`}
                    className="bg-[#15233E] hover:bg-[#1E335A] text-slate-300 hover:text-cyan-300 border border-[#253961] p-2 rounded-lg text-xs font-mono transition-all flex items-center"
                    title="Audit with Copilot"
                  >
                    <Bot size={15} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Generation History & Downloads */}
      {activeTab === 'history' && (
        <div className="stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0E172B] border-b border-[#1E2E4E] font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                  <th className="p-3.5">Execution ID</th>
                  <th className="p-3.5">Report Template</th>
                  <th className="p-3.5">Format</th>
                  <th className="p-3.5">Requested By</th>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Size</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Download Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182643] font-mono text-xs">
                {filteredExecutions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No report executions match criteria.
                    </td>
                  </tr>
                ) : (
                  filteredExecutions.map(exec => (
                    <tr key={exec.id} className="hover:bg-[#14203A] transition-colors">
                      <td className="p-3.5 font-bold text-cyan-400">{exec.id}</td>
                      <td className="p-3.5 font-bold text-white flex items-center space-x-2">
                        <span>{exec.template}</span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getFormatBadge(exec.format)}`}>
                          {exec.format}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300">{exec.requestedBy}</td>
                      <td className="p-3.5 text-slate-400" suppressHydrationWarning>{exec.time}</td>
                      <td className="p-3.5 text-slate-300">{exec.size}</td>
                      <td className="p-3.5">
                        {exec.status === 'COMPLETED' ? (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center">
                            <CheckCircle2 size={11} className="mr-1 text-emerald-400" /> READY
                          </span>
                        ) : exec.status === 'FAILED' ? (
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center" title={exec.error}>
                            <AlertCircle size={11} className="mr-1 text-rose-400" /> FAILED
                          </span>
                        ) : (
                          <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center">
                            <RefreshCw size={11} className="mr-1 animate-spin text-cyan-400" /> COMPILING
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {exec.status === 'COMPLETED' && (
                          <button
                            onClick={() => handleDownloadFile(exec)}
                            className="bg-cyan-600/30 hover:bg-cyan-600 text-cyan-200 hover:text-white border border-cyan-500/40 px-3 py-1 rounded text-xs font-bold inline-flex items-center transition-all cursor-pointer"
                          >
                            <Download size={13} className="mr-1.5" /> Download
                          </button>
                        )}
                        {exec.status === 'FAILED' && (
                          <span className="text-[10px] text-rose-400 italic">
                            {exec.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Automated Crons */}
      {activeTab === 'schedules' && (
        <div className="stitch-card border border-[#24385E] bg-[#111A2E] rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-[#1E2E4E]">
            <div>
              <h2 className="text-sm font-bold text-white font-mono flex items-center">
                <Calendar size={16} className="mr-2 text-cyan-400" /> Enterprise Cron Automation Scheduler
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Configured periodic report pipelines executing against the telemetry data warehouse.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              KAFKA/CRON WORKER: ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.filter(t => t.schedule !== 'On-demand').map(t => (
              <div key={t.id} className="bg-[#15233E] border border-[#253961] p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-bold text-white font-mono">{t.name}</h3>
                    <span className="text-[10px] font-mono text-cyan-400">{t.id} · {t.type}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${getFormatBadge(t.format)}`}>
                    {t.format}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-[#1F3358]">
                  <span className="text-slate-300 flex items-center">
                    <Clock size={13} className="mr-1.5 text-cyan-400" />
                    {t.scheduleHuman}
                  </span>
                  <code className="bg-[#0E172B] px-2 py-0.5 rounded text-[10px] text-amber-300 border border-[#22355A]">
                    {t.schedule}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
