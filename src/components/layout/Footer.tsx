import React from 'react';
import Link from 'next/link';
import { Mic } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/[0.06] bg-[#09090b] text-zinc-500 py-12 px-4 sm:px-6 lg:px-8 mt-auto text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Brand */}
        <div className="space-y-2 max-w-sm">
          <Link href="/" className="flex items-center gap-2 text-zinc-100 font-semibold tracking-tight">
            <div className="w-6 h-6 rounded-md bg-zinc-100 text-zinc-950 flex items-center justify-center">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <span>SpeakWell</span>
          </Link>
          <p className="text-zinc-500 leading-relaxed text-xs">
            A minimalist speech laboratory for structured extempore, mock interviews, and confidence building.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-zinc-400">
          <Link href="/extempore" className="hover:text-zinc-100 transition-colors">Extempore</Link>
          <Link href="/interview" className="hover:text-zinc-100 transition-colors">Interviews</Link>
          <Link href="/speaking-lab" className="hover:text-zinc-100 transition-colors">Speaking Lab</Link>
          <Link href="/vocabulary" className="hover:text-zinc-100 transition-colors">Vocabulary</Link>
          <Link href="/mistakes" className="hover:text-zinc-100 transition-colors">Notebook</Link>
          <Link href="/settings" className="hover:text-zinc-100 transition-colors">Settings</Link>
        </div>

        {/* Copyright */}
        <div className="text-zinc-600 text-[11px]">
          © 2026 SpeakWell. Thoughtful, deliberate practice.
        </div>
      </div>
    </footer>
  );
};
