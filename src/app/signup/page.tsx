'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Mic, 
  Mail, 
  Lock, 
  User, 
  AlertCircle,
  CheckCircle2,
  MailCheck,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { setDemoModeActive, saveDemoProfile, getDemoProfile } from '@/lib/supabase/demo-storage';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setResendStatus(null);

    const supabase = createClient();
    if (!supabase) {
      // Local demo mode fallback
      const current = getDemoProfile();
      saveDemoProfile({
        ...current,
        fullName: fullName.trim() || 'Learner',
        email: email.trim() || 'learner@speakwell.ai'
      });
      setDemoModeActive(true);
      router.push('/onboarding');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          setErrorMsg('An account with this email already exists. Please sign in below.');
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
        return;
      }

      // If Supabase project requires email confirmation, session will be null
      if (data?.user && !data?.session) {
        setConfirmationSent(true);
        setLoading(false);
        return;
      }

      // If auto-authenticated (email confirmation disabled)
      setDemoModeActive(false);
      router.push('/onboarding');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register account.';
      setErrorMsg(msg);
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
        setResendStatus('Verification link dispatched! Please check your inbox and spam folder.');
      }
    } catch {
      setResendStatus('Failed to resend confirmation email.');
    } finally {
      setResending(false);
    }
  };

  const handleContinueDemo = () => {
    const current = getDemoProfile();
    saveDemoProfile({
      ...current,
      fullName: fullName.trim() || 'Learner',
      email: email.trim() || 'learner@speakwell.ai',
    });
    setDemoModeActive(true);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-zinc-100 text-zinc-950 flex items-center justify-center">
              <Mic className="w-4 h-4 text-zinc-950" />
            </div>
            <span className="text-base font-semibold tracking-tight text-zinc-100">SpeakWell</span>
          </Link>
          <h1 className="text-xl font-medium text-zinc-100 tracking-tight pt-1">
            Create Account
          </h1>
          <p className="text-xs text-zinc-400">
            Start your speaking and deliberate practice journey.
          </p>
        </div>

        {/* Confirmation Screen */}
        {confirmationSent ? (
          <div className="minimal-card p-6 space-y-4 text-center animate-fade-in">
            <div className="w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <MailCheck className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-medium text-zinc-100">Check your email</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                We've sent a verification link to <span className="text-zinc-200 font-mono font-medium">{email}</span>.
              </p>
              <p className="text-[11px] text-zinc-500 pt-1">
                Please click the link in your email to confirm your account before signing in.
              </p>
            </div>

            {resendStatus && (
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
                {resendStatus}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Link
                href={`/login?email=${encodeURIComponent(email)}`}
                className="w-full py-2 rounded-lg font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-white transition-colors block shadow-sm"
              >
                Go to Sign In
              </Link>

              <button
                onClick={handleResendConfirmation}
                disabled={resending}
                className="w-full py-2 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>{resending ? 'Resending...' : 'Resend confirmation link'}</span>
              </button>

              <button
                onClick={handleContinueDemo}
                className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Practice in Demo Mode while waiting →
              </button>
            </div>
          </div>
        ) : (
          /* Signup Form */
          <div className="minimal-card p-6 space-y-4">
            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-red-500/20 text-red-400 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                {errorMsg.includes('already exists') && (
                  <Link href={`/login?email=${encodeURIComponent(email)}`} className="text-zinc-200 font-medium hover:underline shrink-0">
                    Sign in
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-zinc-500 block">Full Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

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
                <label className="text-[11px] font-mono uppercase text-zinc-500 block">Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-lg font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-white transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="pt-2 border-t border-white/[0.04] text-center space-y-2">
              <p className="text-xs text-zinc-500">
                Already have an account?{' '}
                <Link href="/login" className="text-zinc-300 font-medium hover:text-white">
                  Sign in
                </Link>
              </p>

              <button
                onClick={handleContinueDemo}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Continue in Demo Mode without account →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
