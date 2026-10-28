'use client';

import React, { useState, useTransition } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { loginAction, registerAction, demoLoginAction } from '@/app/actions/auth';
import { TopographicCanvas } from '@/components/ambient/TopographicCanvas';
import type { UserRole } from '@/lib/types';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
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

    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    startTransition(async () => {
      const result = await registerAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const handleDemoQuickLogin = (role: UserRole) => {
    setError(null);
    startTransition(async () => {
      await demoLoginAction(role);
    });
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#041a24] text-white selection:bg-cyan-300 selection:text-[#041a24] overflow-x-hidden">
      {/* 60fps Ambient Botanical & Celestial Topographic Canvas */}
      <TopographicCanvas />

      {/* Minimal Top Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 sm:py-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/30 bg-white/[0.08] flex items-center justify-center shrink-0">
            <span className="font-editorial italic font-normal text-sm text-white">H4</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-editorial italic text-base sm:text-lg text-white tracking-tight leading-tight">
              {BRAND.name}
            </span>
            <span className="font-mono text-[10px] text-white/60 tracking-wider uppercase leading-tight">
              Information System
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 font-mono text-[11px] text-white/50 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Operational</span>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 w-full max-w-md mx-auto">
        {/* Eyebrow & Hero Headline */}
        <div className="text-center mb-6 sm:mb-8 space-y-1.5">
          <div className="font-mono text-[11px] text-white/70 tracking-[0.2em] uppercase font-medium">
            System Authentication
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-normal text-white tracking-tight leading-tight">
            Welcome to <span className="italic">{BRAND.name}</span>
          </h1>
        </div>

        {/* Obsidian Glass Architectural Card */}
        <div className="relative w-full bg-[#041a24]/85 hover:bg-[#041a24]/90 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[6px] p-6 sm:p-8 space-y-5 transition-all duration-300 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent overflow-hidden">
          {/* Card Top Title & Supporting Text */}
          <div className="text-center space-y-1">
            <h2 className="font-editorial italic text-2xl sm:text-3xl text-white font-normal leading-tight">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="font-sans text-xs text-white/60">
              {mode === 'signin'
                ? 'Access your account.'
                : 'Create a staff profile with role permissions.'}
            </p>
          </div>

          {/* Accessible Segmented Tabs: Sign In & Register */}
          <div
            role="tablist"
            aria-label="Authentication modes"
            className="grid grid-cols-2 p-1 rounded-[4px] bg-white/[0.06] border border-white/10 font-mono text-xs uppercase tracking-wider"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`py-1.5 text-center font-medium transition-all rounded-[3px] ${
                mode === 'signin'
                  ? 'bg-white text-[#041a24] font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-1.5 text-center font-medium transition-all rounded-[3px] ${
                mode === 'register'
                  ? 'bg-white text-[#041a24] font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Message Box */}
          {error && (
            <div
              role="alert"
              className="rounded-[3px] bg-red-950/70 border border-red-500/30 px-3.5 py-2.5 text-xs text-red-200 font-mono flex items-start gap-2"
            >
              <span className="font-bold text-red-400 shrink-0">[ERROR]:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          {mode === 'signin' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="signin-email"
                  className="block text-[11px] font-mono text-white/70 uppercase tracking-wider mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="signin-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  defaultValue="admin@hope.demo"
                  placeholder="name@company.com"
                  className="w-full h-10 px-3.5 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.10] border border-white/15 focus:border-cyan-300 rounded-[3px] text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-300 transition-all font-sans"
                />
              </div>

              <div>
                <label
                  htmlFor="signin-password"
                  className="block text-[11px] font-mono text-white/70 uppercase tracking-wider mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signin-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    defaultValue="demo"
                    placeholder="••••••••"
                    className="w-full h-10 pl-3.5 pr-10 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.10] border border-white/15 focus:border-cyan-300 rounded-[3px] text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-300 transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-1 rounded focus:outline-none focus:ring-1 focus:ring-cyan-300 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-11 bg-white hover:bg-neutral-100 disabled:opacity-50 text-[#041a24] font-mono text-xs uppercase tracking-[0.15em] font-semibold rounded-[3px] shadow-sm flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#041a24] focus:ring-white"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#041a24]" />
                    <span>Signing In...</span>
                  </span>
                ) : (
                  <span>Sign In</span>
                )}
              </button>

              <div className="text-center pt-1 text-xs font-sans text-white/60">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="font-medium text-white hover:underline focus:outline-none focus:ring-1 focus:ring-cyan-300 rounded"
                >
                  Create an account
                </button>
              </div>
            </form>
          )}

          {/* Registration Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-[11px] font-mono text-white/70 uppercase tracking-wider mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="reg-name"
                  name="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Maria Santos"
                  className="w-full h-10 px-3.5 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.10] border border-white/15 focus:border-cyan-300 rounded-[3px] text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-300 transition-all font-sans"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-[11px] font-mono text-white/70 uppercase tracking-wider mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                  className="w-full h-10 px-3.5 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.10] border border-white/15 focus:border-cyan-300 rounded-[3px] text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-300 transition-all font-sans"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-[11px] font-mono text-white/70 uppercase tracking-wider mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    name="password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    className="w-full h-10 pl-3.5 pr-10 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.10] border border-white/15 focus:border-cyan-300 rounded-[3px] text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-300 transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-1 rounded focus:outline-none focus:ring-1 focus:ring-cyan-300 transition-colors"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-confirm"
                  className="block text-[11px] font-mono text-white/70 uppercase tracking-wider mb-1.5"
                >
                  Confirm Password
                </label>
                <input
                  id="reg-confirm"
                  name="confirmPassword"
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  className="w-full h-10 px-3.5 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.10] border border-white/15 focus:border-cyan-300 rounded-[3px] text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-300 transition-all font-sans"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-role"
                  className="block text-[11px] font-mono text-white/70 uppercase tracking-wider mb-1.5"
                >
                  Staff Role
                </label>
                <select
                  id="reg-role"
                  name="role"
                  defaultValue="admin"
                  className="w-full h-10 px-3.5 bg-[#041a24] border border-white/15 focus:border-cyan-300 rounded-[3px] text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-300 font-sans cursor-pointer"
                >
                  <option value="admin">Administrator (Complete access)</option>
                  <option value="sales">Sales Specialist (Orders & invoicing)</option>
                  <option value="cashier">Cashier (Collections & receipts)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-11 bg-white hover:bg-neutral-100 disabled:opacity-50 text-[#041a24] font-mono text-xs uppercase tracking-[0.15em] font-semibold rounded-[3px] shadow-sm flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#041a24] focus:ring-white"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#041a24]" />
                    <span>Creating Account...</span>
                  </span>
                ) : (
                  <span>Create Account</span>
                )}
              </button>

              <div className="text-center pt-1 text-xs font-sans text-white/60">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className="font-medium text-white hover:underline focus:outline-none focus:ring-1 focus:ring-cyan-300 rounded"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Presets for Testing & Evaluation */}
          <div className="pt-3 border-t border-white/10 flex flex-col items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
              Evaluation Presets
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDemoQuickLogin('admin')}
                disabled={isPending}
                className="px-2.5 py-1 text-[11px] font-mono text-white/70 hover:text-white bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 rounded-[2px] transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-300"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoQuickLogin('sales')}
                disabled={isPending}
                className="px-2.5 py-1 text-[11px] font-mono text-white/70 hover:text-white bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 rounded-[2px] transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-300"
              >
                Sales
              </button>
              <button
                type="button"
                onClick={() => handleDemoQuickLogin('cashier')}
                disabled={isPending}
                className="px-2.5 py-1 text-[11px] font-mono text-white/70 hover:text-white bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 rounded-[2px] transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-300"
              >
                Cashier
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Colophon Footer */}
      <footer className="relative z-10 py-6 text-center font-mono text-[10px] text-white/50 tracking-wider">
        <span className="font-editorial italic text-xs text-white/80">{BRAND.name}</span> &bull; {BRAND.systemName} &bull; 2026
      </footer>
    </div>
  );
}
