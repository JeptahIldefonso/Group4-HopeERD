'use client';

import React, { useState, useTransition } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginAction, registerAction } from '@/app/actions/auth';
import { TopographicCanvas } from '@/components/ambient/TopographicCanvas';
import { HopeLogo } from '@/components/brand/HopeLogo';
import { BRAND } from '@/lib/brand';

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

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#F7F8F5] text-[#202923] selection:bg-[#285B48]/15 selection:text-[#202923] overflow-x-hidden font-sans">
      {/* Matte Light Topographic Background */}
      <TopographicCanvas />

      {/* Brand Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 sm:py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HopeLogo size={36} className="shrink-0" />
          <div className="flex flex-col">
            <span className="text-[19px] font-bold text-gray-900 leading-tight tracking-tight">
              {BRAND.name}
            </span>
            <span className="text-[12px] font-normal text-gray-500 leading-tight mt-0.5">
              {BRAND.systemName}
            </span>
          </div>
        </div>
      </header>

      {/* Main Authentication Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 w-full max-w-md mx-auto">
        {/* Pure White Architectural Authentication Card */}
        <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-7 sm:p-8 space-y-6">
          {/* Left-Aligned Card Heading & Supporting Text */}
          <div className="text-left">
            <h1 className="text-[25px] font-semibold text-[#202923] tracking-tight leading-tight">
              {mode === 'signin' ? 'Sign In' : 'Create Staff Account'}
            </h1>
            <p className="text-[14px] font-normal text-[#626C65] mt-1">
              {mode === 'signin' ? 'Access your staff account.' : 'Register a staff member.'}
            </p>
          </div>

          {/* Accessible Segmented Tabs: Sign In & Register */}
          <div
            role="tablist"
            aria-label="Authentication modes"
            className="grid grid-cols-2 p-1 rounded-[4px] bg-[#F0F2EE] border border-[#E0E5E0] text-[13px] font-medium"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`py-2 text-center transition-all rounded-[3px] font-medium ${
                mode === 'signin'
                  ? 'bg-white text-[#24352D] font-semibold shadow-xs'
                  : 'text-[#626C65] hover:text-[#202923]'
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
              className={`py-2 text-center transition-all rounded-[3px] font-medium ${
                mode === 'register'
                  ? 'bg-white text-[#24352D] font-semibold shadow-xs'
                  : 'text-[#626C65] hover:text-[#202923]'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Message Box */}
          {error && (
            <div
              role="alert"
              className="rounded-[4px] bg-[#FDF3F2] border border-[#FECDCA] p-3 text-xs text-[#B42318] flex items-start gap-2"
            >
              <span className="font-semibold text-[#B42318] shrink-0">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          {mode === 'signin' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="signin-email"
                  className="block text-[13px] font-medium text-[#202923] mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="signin-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="Enter your email address"
                  className="w-full h-11 px-3.5 bg-white border border-[#CCD5CD] focus:border-[#285B48] focus:ring-2 focus:ring-[#A8C6B2]/40 rounded-[4px] text-[14px] font-normal text-[#202923] placeholder-[#8E9A90] outline-none transition-all font-sans"
                />
              </div>

              <div>
                <label
                  htmlFor="signin-password"
                  className="block text-[13px] font-medium text-[#202923] mb-1.5"
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
                    placeholder="Enter your password"
                    className="w-full h-11 pl-3.5 pr-10 bg-white border border-[#CCD5CD] focus:border-[#285B48] focus:ring-2 focus:ring-[#A8C6B2]/40 rounded-[4px] text-[14px] font-normal text-[#202923] placeholder-[#8E9A90] outline-none transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#66736B] hover:text-[#24352D] p-1 rounded focus:outline-none focus:ring-2 focus:ring-[#A8C6B2]/40 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-11 bg-[#285B48] hover:bg-[#204737] active:bg-[#1a3b2e] disabled:opacity-50 text-white font-semibold text-[14px] rounded-[4px] shadow-xs flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A8C6B2] cursor-pointer"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <span>Sign In</span>
                )}
              </button>

              <div className="text-center pt-1 text-[14px] text-[#626C65]">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="font-medium text-[#285B48] hover:underline focus:outline-none focus:ring-1 focus:ring-[#285B48] rounded"
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
                  className="block text-[13px] font-medium text-[#202923] mb-1.5"
                >
                  Full name
                </label>
                <input
                  id="reg-name"
                  name="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Enter your full name"
                  className="w-full h-11 px-3.5 bg-white border border-[#CCD5CD] focus:border-[#285B48] focus:ring-2 focus:ring-[#A8C6B2]/40 rounded-[4px] text-[14px] font-normal text-[#202923] placeholder-[#8E9A90] outline-none transition-all font-sans"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-[13px] font-medium text-[#202923] mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Enter your email address"
                  className="w-full h-11 px-3.5 bg-white border border-[#CCD5CD] focus:border-[#285B48] focus:ring-2 focus:ring-[#A8C6B2]/40 rounded-[4px] text-[14px] font-normal text-[#202923] placeholder-[#8E9A90] outline-none transition-all font-sans"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-[13px] font-medium text-[#202923] mb-1.5"
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
                    placeholder="Enter your password"
                    className="w-full h-11 pl-3.5 pr-10 bg-white border border-[#CCD5CD] focus:border-[#285B48] focus:ring-2 focus:ring-[#A8C6B2]/40 rounded-[4px] text-[14px] font-normal text-[#202923] placeholder-[#8E9A90] outline-none transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#66736B] hover:text-[#24352D] p-1 rounded focus:outline-none focus:ring-2 focus:ring-[#A8C6B2]/40 transition-colors"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-confirm"
                  className="block text-[13px] font-medium text-[#202923] mb-1.5"
                >
                  Confirm password
                </label>
                <input
                  id="reg-confirm"
                  name="confirmPassword"
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  className="w-full h-11 px-3.5 bg-white border border-[#CCD5CD] focus:border-[#285B48] focus:ring-2 focus:ring-[#A8C6B2]/40 rounded-[4px] text-[14px] font-normal text-[#202923] placeholder-[#8E9A90] outline-none transition-all font-sans"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-role"
                  className="block text-[13px] font-medium text-[#202923] mb-1.5"
                >
                  Staff role
                </label>
                <select
                  id="reg-role"
                  name="role"
                  defaultValue="admin"
                  className="w-full h-11 px-3.5 bg-white border border-[#CCD5CD] focus:border-[#285B48] focus:ring-2 focus:ring-[#A8C6B2]/40 rounded-[4px] text-[14px] font-normal text-[#202923] outline-none transition-all font-sans cursor-pointer"
                >
                  <option value="admin">Administrator (Complete access)</option>
                  <option value="sales">Sales Specialist (Orders & invoicing)</option>
                  <option value="cashier">Cashier / Billing (OR vouchers)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-11 bg-[#285B48] hover:bg-[#204737] active:bg-[#1a3b2e] disabled:opacity-50 text-white font-semibold text-[14px] rounded-[4px] shadow-xs flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A8C6B2] cursor-pointer"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Creating account...</span>
                  </span>
                ) : (
                  <span>Create Account</span>
                )}
              </button>

              <div className="text-center pt-1 text-[14px] text-[#626C65]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className="font-medium text-[#285B48] hover:underline focus:outline-none focus:ring-1 focus:ring-[#285B48] rounded"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 text-center text-xs font-normal text-gray-500">
        {BRAND.name} &middot; {BRAND.systemName}
      </footer>
    </div>
  );
}
