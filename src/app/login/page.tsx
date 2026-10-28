'use client';

import React, { useState, useTransition } from 'react';
import { Cpu, Lock, Mail, User, Shield, ArrowRight } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { loginAction, registerAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await registerAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-[#041a24] py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-cyan-200 selection:text-[#041a24]">
      {/* Background Architectural Grid Lines */}
      <div 
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '3rem 3rem'
        }}
      />

      {/* Masthead Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-[2px] bg-white/10 border border-white/20 text-[#F4F4F0] mb-4">
          <Cpu className="w-6 h-6 text-cyan-300" />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-200/70 mb-1">
          IM-201 • Relational Archival Gateway
        </div>
        <h1 className="font-editorial text-3xl font-normal tracking-tight text-[#F4F4F0]">
          {BRAND.name}
        </h1>
        <p className="mt-1 text-xs text-white/60 font-sans max-w-sm mx-auto">
          {BRAND.systemName}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Raised Paper Surface Card */}
        <div className="bg-[#F4F4F0] text-[#041a24] py-8 px-6 sm:px-8 rounded-[4px] border border-[rgba(4,26,36,0.18)] shadow-2xl space-y-6">
          
          {/* Sign In / Register Tab Toggle */}
          <div className="grid grid-cols-2 p-1 rounded-[2px] bg-[#EAEAE4] border border-[rgba(4,26,36,0.12)] font-mono text-xs uppercase tracking-wider">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`py-1.5 text-center font-medium transition-all rounded-[2px] ${
                mode === 'signin'
                  ? 'bg-[#041a24] text-[#F4F4F0] shadow-sm'
                  : 'text-[rgba(4,26,36,0.7)] hover:text-[#041a24]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-1.5 text-center font-medium transition-all rounded-[2px] ${
                mode === 'register'
                  ? 'bg-[#041a24] text-[#F4F4F0] shadow-sm'
                  : 'text-[rgba(4,26,36,0.7)] hover:text-[#041a24]'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form Header */}
          <div className="border-b border-[rgba(4,26,36,0.12)] pb-3">
            <h2 className="font-editorial text-xl font-normal text-[#041a24] tracking-tight">
              {mode === 'signin' ? 'Sign In to Operations' : 'Register New Account'}
            </h2>
            <p className="text-xs text-[rgba(4,26,36,0.65)] font-sans mt-0.5">
              {mode === 'signin'
                ? 'Enter your registered staff credentials to access the ledger.'
                : 'Create a new staff profile with role-assigned permissions.'}
            </p>
          </div>

          {error && (
            <div className="rounded-[2px] bg-[#FCECEC] border border-[#862525]/30 p-3 text-xs text-[#862525] font-mono flex items-start gap-2">
              <span className="font-bold shrink-0">[ERROR]:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          {mode === 'signin' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-[rgba(4,26,36,0.75)] uppercase tracking-wider mb-1">
                  Staff Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[rgba(4,26,36,0.4)] absolute left-3 top-2.5" />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="admin@hope.demo"
                    defaultValue="admin@hope.demo"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[rgba(4,26,36,0.2)] rounded-[2px] text-xs text-[#041a24] placeholder-[rgba(4,26,36,0.4)] focus:outline-none focus:ring-1 focus:ring-[#041a24] focus:border-[#041a24] font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[rgba(4,26,36,0.75)] uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[rgba(4,26,36,0.4)] absolute left-3 top-2.5" />
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    defaultValue="demo"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[rgba(4,26,36,0.2)] rounded-[2px] text-xs text-[#041a24] placeholder-[rgba(4,26,36,0.4)] focus:outline-none focus:ring-1 focus:ring-[#041a24] focus:border-[#041a24] font-mono transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isPending}
                className="w-full py-2.5 text-xs font-mono uppercase tracking-widest font-semibold"
              >
                Sign In
              </Button>

              <div className="pt-2 text-center text-xs font-sans text-[rgba(4,26,36,0.6)]">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="font-semibold text-[#041a24] underline hover:text-[#082a38]"
                >
                  Register here
                </button>
              </div>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-[rgba(4,26,36,0.75)] uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[rgba(4,26,36,0.4)] absolute left-3 top-2.5" />
                  <input
                    name="fullName"
                    type="text"
                    required
                    placeholder="e.g. Maria Santos"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[rgba(4,26,36,0.2)] rounded-[2px] text-xs text-[#041a24] placeholder-[rgba(4,26,36,0.4)] focus:outline-none focus:ring-1 focus:ring-[#041a24] focus:border-[#041a24] font-sans transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[rgba(4,26,36,0.75)] uppercase tracking-wider mb-1">
                  Staff Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[rgba(4,26,36,0.4)] absolute left-3 top-2.5" />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="e.g. maria@hope.demo"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[rgba(4,26,36,0.2)] rounded-[2px] text-xs text-[#041a24] placeholder-[rgba(4,26,36,0.4)] focus:outline-none focus:ring-1 focus:ring-[#041a24] focus:border-[#041a24] font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[rgba(4,26,36,0.75)] uppercase tracking-wider mb-1">
                  Password (min 6 chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[rgba(4,26,36,0.4)] absolute left-3 top-2.5" />
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[rgba(4,26,36,0.2)] rounded-[2px] text-xs text-[#041a24] placeholder-[rgba(4,26,36,0.4)] focus:outline-none focus:ring-1 focus:ring-[#041a24] focus:border-[#041a24] font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[rgba(4,26,36,0.75)] uppercase tracking-wider mb-1">
                  Assigned Staff Role
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-[rgba(4,26,36,0.4)] absolute left-3 top-2.5" />
                  <select
                    name="role"
                    defaultValue="admin"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[rgba(4,26,36,0.2)] rounded-[2px] text-xs text-[#041a24] focus:outline-none focus:ring-1 focus:ring-[#041a24] focus:border-[#041a24] font-mono transition-all"
                  >
                    <option value="admin">Administrator (Complete access)</option>
                    <option value="sales">Sales Specialist (Orders & invoicing)</option>
                    <option value="cashier">Cashier / Billing (OR vouchers)</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isPending}
                className="w-full py-2.5 text-xs font-mono uppercase tracking-widest font-semibold"
              >
                Register & Sign In
              </Button>

              <div className="pt-2 text-center text-xs font-sans text-[rgba(4,26,36,0.6)]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className="font-semibold text-[#041a24] underline hover:text-[#082a38]"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Archival Footnote */}
        <div className="mt-6 text-center text-[10px] font-mono tracking-wider text-white/40 uppercase">
          {BRAND.companyName} • STRICT CANONICAL 10-TABLE SCHEMA
        </div>
      </div>
    </div>
  );
}
