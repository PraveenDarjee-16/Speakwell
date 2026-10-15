'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mic, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.resetPasswordForEmail(email);
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] py-16 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-sm">
              <Mic className="w-4 h-4" />
            </div>
            <span className="text-base font-semibold text-zinc-100 tracking-tight">SpeakWell</span>
          </Link>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Reset password
          </h2>
          <p className="text-sm text-zinc-400">
            Enter your account email and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-900/60 border border-white/[0.08] p-6 shadow-xl backdrop-blur-sm space-y-5">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Email address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-white/[0.08] text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-medium text-sm text-zinc-950 bg-zinc-100 hover:bg-white active:bg-zinc-200 transition-colors cursor-pointer"
              >
                Send reset link
              </button>
            </form>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs text-center space-y-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
              <p className="font-medium text-sm">Reset link dispatched</p>
              <p className="text-emerald-400/80 leading-relaxed">
                If an account exists for {email}, a password reset link has been dispatched to your inbox.
              </p>
            </div>
          )}

          <div className="pt-2 text-center border-t border-white/[0.06]">
            <Link
              href="/login"
              className="text-xs font-medium text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
