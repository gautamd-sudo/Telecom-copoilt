"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Radio, 
  Lock, 
  Mail, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  Building2,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('demo-tenant-001');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect && redirect.startsWith('/')) {
        return redirect;
      }
    }
    return '/dashboard';
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      window.location.href = getRedirectUrl();
    }
  }, [isAuthenticated, authLoading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const submitEmail = ((formData.get('email') as string) || email || '').trim();
    const submitPassword = (formData.get('password') as string) || password || '';
    const submitTenantId = ((formData.get('tenantId') as string) || tenantId || '').trim();

    if (!submitEmail || !submitPassword) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    const result = await login(submitEmail, submitPassword, submitTenantId || undefined);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        window.location.href = getRedirectUrl();
      }, 300);
    } else {
      setError(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string, demoTenant: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setTenantId(demoTenant);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-600/10 via-indigo-600/10 to-purple-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 shadow-[0_0_25px_rgba(0,240,255,0.35)] mb-4 border border-cyan-400/30">
            <Radio className="text-white animate-pulse" size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center space-x-2">
            <span>TELECOM</span>
            <span className="text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 text-xl font-mono">
              AI
            </span>
          </h1>
          <p className="text-xs font-mono text-slate-400 tracking-wider uppercase mt-1">
            Autonomous NOC & Command Center
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-[#0B101D]/90 border border-[#1B2945] rounded-2xl p-7 shadow-2xl backdrop-blur-xl relative">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#1B2945]">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center">
              <ShieldCheck size={15} className="text-cyan-400 mr-2" />
              Secure Authentication
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Zero Trust RBAC
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2.5 text-xs text-rose-300 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2.5 text-xs text-emerald-300">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>Authentication verified. Redirecting to NOC Command Center...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Operator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="admin@acme.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#10192D] border border-[#1E2E4E] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:shadow-[0_0_12px_rgba(0,240,255,0.2)] transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Password
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  AES-256 / bcrypt
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={15} />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#10192D] border border-[#1E2E4E] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:shadow-[0_0_12px_rgba(0,240,255,0.2)] transition-all font-mono"
                />
              </div>
            </div>

            {/* Tenant ID (Multi-tenant selector / input) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Tenant / Domain Identifier
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Building2 size={15} />
                </div>
                <input
                  type="text"
                  name="tenantId"
                  placeholder="demo-tenant-001"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#10192D] border border-[#1E2E4E] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:shadow-[0_0_12px_rgba(0,240,255,0.2)] transition-all font-mono"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full mt-2 py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-600 via-indigo-600 to-cyan-500 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(0,240,255,0.25)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-cyan-200" />
                  <span>Verifying Credentials...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 size={16} className="text-emerald-300" />
                  <span>Session Granted</span>
                </>
              ) : (
                <>
                  <span>Authenticate Operator</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Section */}
          <div className="mt-6 pt-5 border-t border-[#1B2945]">
            <p className="text-[11px] font-mono text-slate-400 mb-2.5 flex items-center">
              <KeyRound size={12} className="mr-1.5 text-cyan-400" />
              Demo Test Credentials:
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@acme.com', 'admin123!', 'demo-tenant-001')}
                className="flex items-center justify-between p-2 rounded-lg bg-[#10192D] hover:bg-[#16233F] border border-[#1E2E4E] text-left transition-all group cursor-pointer"
              >
                <div>
                  <span className="text-[11px] font-semibold text-slate-200 block group-hover:text-cyan-300">
                    Administrator (Acme Telecom)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    admin@acme.com / admin123!
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">
                  Fill
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin@tenanta.com', 'SecurePassword123!', 'Tenant A')}
                className="flex items-center justify-between p-2 rounded-lg bg-[#10192D] hover:bg-[#16233F] border border-[#1E2E4E] text-left transition-all group cursor-pointer"
              >
                <div>
                  <span className="text-[11px] font-semibold text-slate-200 block group-hover:text-cyan-300">
                    Network Administrator (Tenant A)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    admin@tenanta.com / SecurePassword123!
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">
                  Fill
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-[11px] font-mono text-slate-500">
          TELECOM-AI-OS v2.6 // SOX-2 & ISO 27001 COMPLIANT
        </div>

      </div>
    </div>
  );
}
