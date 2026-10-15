'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Mic, 
  Mail, 
  Lock, 
  AlertCircle,
  RefreshCw,
  MailCheck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { setDemoModeActive, getDemoProfile } from '@/lib/supabase/demo-storage';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'generic' | 'email_not_confirmed' | 'invalid_credentials' | null>(null);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const supabaseConfigured = isSupabaseConfigured();

  // Prefill email if provided in query string (e.g. from signup redirect)
  useEffect(() => {
    const queryEmail = searchParams.get('email');
    if (queryEmail) {
      setEmail(queryEmail);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setErrorType(null);
    setResendStatus(null);

    const supabase = createClient();
    if (!supabase) {
      setDemoModeActive(true);
      router.push('/dashboard');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setLoading(false);
        const msg = error.message.toLowerCase();

        if (msg.includes('email not confirmed') || (error as any).code === 'email_not_confirmed') {
          setErrorType('email_not_confirmed');
          setErrorMsg('Your email is not confirmed yet. Supabase requires email verification before signing in.');
        } else if (msg.includes('invalid login credentials')) {
          setErrorType('invalid_credentials');
          setErrorMsg('Invalid email or password. If you just registered, your email may require confirmation first, or the account does not exist.');
        } else {
          setErrorType('generic');
          setErrorMsg(error.message);
        }
      } else {
        setDemoModeActive(false);
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during sign in.';
      setErrorMsg(message);
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const supabase = createClient();
    if (!supabase || !email) return;

    setResending(true);
    setResendStatus(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });

      if (error) {
        setResendStatus(`Error: ${error.message}`);
      } else {
        setResendStatus('Confirmation link resent! Please check your inbox and spam folder.');
      }
    } catch {
      setResendStatus('Failed to resend confirmation email.');
    } finally {
      setResending(false);
    }
  };

  const handleDemoModeLogin = () => {
    setDemoModeActive(true);
    router.push('/dashboard');
  };

  const demoProfile = typeof window !== 'undefined' ? getDemoProfile() : null;
  const hasMatchingDemoEmail = demoProfile && demoProfile.email && email.trim() && 
    demoProfile.email.toLowerCase() === email.trim().toLowerCase();

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-zinc-100 text-zinc-950 flex items-center justify-center">
            <Mic className="w-4 h-4 text-zinc-950" />
          </div>
          <span className="text-base font-semibold tracking-tight text-zinc-100">SpeakWell</span>
        </Link>
        <h1 className="text-xl font-medium text-zinc-100 tracking-tight pt-1">
          Sign In
        </h1>
        <p className="text-xs text-zinc-400">
          Access your practice history, streak, and notes.
        </p>
      </div>

      {/* Demo Mode 1-click */}
      <div className="minimal-card p-4 text-center space-y-2 text-xs">
        <p className="text-zinc-400 text-[11px]">
          Try SpeakWell instantly without Supabase setup or email verification.
        </p>
        <button
          onClick={handleDemoModeLogin}
          className="w-full py-2 px-3 rounded-lg font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-white transition-colors cursor-pointer shadow-sm"
        >
          Continue in Demo Mode
        </button>
      </div>

      {/* Login Form */}
      <div className="minimal-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
          <div className="h-px bg-zinc-800 flex-1" />
          <span>Or Email Sign In</span>
          <div className="h-px bg-zinc-800 flex-1" />
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-zinc-900 border border-red-500/30 text-xs space-y-2">
            <div className="flex items-start gap-2 text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="leading-relaxed block">{errorMsg}</span>
              </div>
            </div>

            {/* Email Not Confirmed Action */}
            {errorType === 'email_not_confirmed' && (
              <div className="pt-2 border-t border-zinc-800 space-y-2">
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resending}
                  className="w-full py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>{resending ? 'Resending...' : 'Resend Confirmation Email'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDemoModeLogin}
                  className="w-full text-center text-[11px] text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  Or continue in Demo Mode for now →
                </button>
              </div>
            )}

            {/* Invalid credentials options */}
            {errorType === 'invalid_credentials' && (
              <div className="pt-2 border-t border-zinc-800 space-y-1.5 text-[11px]">
                {hasMatchingDemoEmail && (
                  <button
                    type="button"
                    onClick={handleDemoModeLogin}
                    className="w-full py-1.5 px-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium hover:bg-amber-500/20 transition-colors cursor-pointer text-center block"
                  >
                    Open matching Local Profile in Demo Mode
                  </button>
                )}
                <div className="flex items-center justify-between text-zinc-400 pt-0.5">
                  <Link href="/signup" className="text-zinc-300 hover:underline">
                    Create new account
                  </Link>
                  <Link href="/forgot-password" className="text-zinc-300 hover:underline">
                    Reset password
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {resendStatus && (
          <div className="p-2.5 rounded-lg bg-zinc-900 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{resendStatus}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase text-zinc-500 block">Email</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase text-zinc-500 block">Password</label>
              <Link href="/forgot-password" className="text-[11px] text-zinc-400 hover:text-zinc-200">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-white transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500">
          No account?{' '}
          <Link href="/signup" className="text-zinc-300 font-medium hover:text-white">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center animate-fade-in">
      <Suspense fallback={<div className="text-xs text-zinc-500">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
