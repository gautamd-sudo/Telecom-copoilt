"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Activity, 
  Map, 
  BarChart2, 
  ShieldAlert, 
  Settings, 
  Search, 
  Bot, 
  Users, 
  MessageSquare, 
  DollarSign, 
  Wrench, 
  Bell, 
  FileText, 
  Code,
  Radio,
  Cpu,
  CheckCircle2,
  Terminal,
  Zap,
  Globe,
  LucideIcon,
  LogOut,
  LogIn
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
  highlight?: boolean;
  danger?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, tenant, isAuthenticated, isLoading, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AT';

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const navGroups: NavGroup[] = [
    {
      title: "Operations & Health",
      items: [
        { href: "/dashboard", label: "Network Overview", icon: BarChart2 },
        { href: "/dashboard/region/na", label: "Regions & Sites", icon: Map },
        { href: "/dashboard/kpi/all", label: "KPI Explorer", icon: Activity },
        { href: "/dashboard/incidents", label: "Active Incidents", icon: ShieldAlert, badge: "3", badgeColor: "bg-rose-500/20 text-rose-400 border border-rose-500/30" },
      ]
    },
    {
      title: "AI & Automation",
      items: [
        { href: "/dashboard/copilot", label: "AI Copilot (DeepSeek)", icon: Bot, highlight: true },
        { href: "/dashboard/anomalies", label: "AI Anomalies", icon: Zap, badge: "5", badgeColor: "bg-purple-500/20 text-purple-300 border border-purple-500/30" },
        { href: "/dashboard/predictive-maintenance", label: "Predictive Maint.", icon: Wrench },
        { href: "/dashboard/revenue-leakage", label: "Revenue Leakage", icon: DollarSign },
        { href: "/dashboard/conversations", label: "Conversation AI", icon: MessageSquare },
        { href: "/dashboard/customers/CUST-1001", label: "Customer 360", icon: Users },
      ]
    },
    {
      title: "Governance & Settings",
      items: [
        { href: "/dashboard/reports", label: "Reports & Exports", icon: FileText },
        { href: "/dashboard/settings/notifications", label: "Notification Rules", icon: Bell },
        { href: "/dashboard/settings/api", label: "Developer API", icon: Code },
        { href: "/dashboard/admin/tenant", label: "Tenant Admin", icon: Settings },
        { href: "/dashboard/admin/platform", label: "Platform Admin", icon: Terminal, danger: true },
      ]
    }
  ];

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.3)] animate-pulse">
          <Radio className="text-white animate-pulse" size={24} />
        </div>
        <p className="text-xs font-mono text-cyan-400 tracking-wider uppercase">
          Verifying Operator Authorization...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#080C14] text-slate-100 overflow-hidden font-sans select-none">
      
      {/* Stitch Sidebar */}
      <aside className="w-64 bg-[#0B101D] border-r border-[#1B2945] flex flex-col justify-between shrink-0">
        
        {/* Brand / Logo */}
        <div>
          <div className="h-16 px-5 border-b border-[#1B2945] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                <Radio className="text-white animate-pulse" size={18} />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-white block">
                  TELECOM <span className="text-cyan-400">AI</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 block tracking-wider uppercase">
                  Command Center
                </span>
              </div>
            </div>

            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          {/* Navigation Links */}
          <div className="p-3 overflow-y-auto max-h-[calc(100vh-220px)] space-y-5">
            {navGroups.map((group, idx) => (
              <div key={idx}>
                <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">
                  {group.title}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item, itemIdx) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <a
                        key={itemIdx}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-500/15 via-indigo-500/15 to-transparent text-cyan-300 border-l-2 border-cyan-400 pl-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                            : item.danger
                            ? 'text-rose-400 hover:bg-rose-500/10 hover:text-rose-300'
                            : item.highlight
                            ? 'text-purple-300 hover:bg-purple-500/10 hover:text-purple-200'
                            : 'text-slate-400 hover:bg-[#141F36] hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon size={16} className={isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-400'}`}>
                            {item.badge}
                          </span>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live System Telemetry Status Box */}
        <div className="p-3 border-t border-[#1B2945] bg-[#080C14]/80 space-y-2">
          <div className="p-2.5 rounded-lg bg-[#0E172B] border border-[#1E2E4E] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center text-slate-400">
                <Cpu size={12} className="mr-1.5 text-cyan-400" />
                AI Inference
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                DEEPSEEK V4.1
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center text-slate-400">
                <Globe size={12} className="mr-1.5 text-indigo-400" />
                Tenant
              </span>
              <span className="text-[10px] font-mono text-slate-300 truncate max-w-[90px]" title={tenant?.name || 'Acme Telecom'}>
                {tenant?.name || 'Acme Telecom'}
              </span>
            </div>
          </div>

          {isAuthenticated ? (
            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 border border-rose-900/40 hover:border-rose-700/60 text-xs font-mono transition-all cursor-pointer"
            >
              <LogOut size={13} className="text-rose-400" />
              <span>Log Out Operator</span>
            </button>
          ) : (
            <a
              href="/login"
              className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg bg-cyan-950/20 hover:bg-cyan-900/40 text-cyan-300 border border-cyan-900/40 hover:border-cyan-700/60 text-xs font-mono transition-all"
            >
              <LogIn size={13} className="text-cyan-400" />
              <span>Log In Operator</span>
            </a>
          )}
        </div>

      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#080C14]">
        
        {/* Stitch Header */}
        <header className="h-16 bg-[#0B101D]/90 backdrop-blur-md border-b border-[#1B2945] flex items-center justify-between px-6 shrink-0 z-10">
          
          {/* Quick Search with shortcut */}
          <div className="flex items-center bg-[#10192D] border border-[#1E2E4E] rounded-lg px-3 py-1.5 w-96 text-xs text-slate-400 focus-within:border-cyan-500/60 focus-within:shadow-[0_0_12px_rgba(0,240,255,0.15)] transition-all">
            <Search size={14} className="text-slate-500 mr-2 shrink-0" />
            <input 
              type="text" 
              placeholder="Search cells, alerts, sites, telemetry..." 
              className="bg-transparent border-none focus:outline-none w-full text-slate-200 placeholder-slate-500"
            />
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-[#16233F] border border-slate-700/60 rounded">
              ⌘K
            </kbd>
          </div>

          {/* Telemetry Status Ticker & User Pill */}
          <div className="flex items-center space-x-4">
            
            {/* Live UTC Clock */}
            <div className="hidden lg:flex items-center space-x-1.5 text-xs font-mono text-slate-400 bg-[#10192D] border border-[#1E2E4E] px-2.5 py-1 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>{currentTime || 'NOC ONLINE'}</span>
            </div>

            {/* SLA Status */}
            <div className="hidden md:flex items-center space-x-2 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-3 py-1 rounded-md">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span className="font-semibold font-mono">SLA 99.98%</span>
            </div>

            {/* Active Tenant / Operator & Logout */}
            <div className="flex items-center space-x-3 pl-2 border-l border-[#1B2945]">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md border border-indigo-400/30">
                      {userInitials}
                    </div>
                    <div className="hidden sm:block text-left">
                      <span className="text-xs font-semibold text-slate-200 block leading-tight">
                        {user?.name || 'Admin Operator'}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 block leading-tight">
                        {tenant?.name || 'Acme Telecom'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => logout()}
                    title="Sign Out / Disconnect Session"
                    className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 text-xs transition-all cursor-pointer font-mono"
                  >
                    <LogOut size={13} />
                    <span className="hidden md:inline">Sign Out</span>
                  </button>
                </div>
              ) : (
                <a
                  href="/login"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 text-xs transition-all font-mono"
                >
                  <LogIn size={13} />
                  <span>Sign In</span>
                </a>
              )}
            </div>

          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-1 overflow-y-auto p-6 text-slate-200">
          {children}
        </main>

      </div>
    </div>
  );
}
