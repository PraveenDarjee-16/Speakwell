'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Mic, 
  Flame, 
  Menu, 
  X, 
  Settings,
  LayoutDashboard,
  Briefcase,
  Compass,
  BookOpen,
  AlertCircle,
  TrendingUp,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { isDemoModeActive, getDemoProfile } from '@/lib/supabase/demo-storage';
import { fetchUserSessionsAndStats, signOutUser } from '@/lib/data/sessions-service';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isDemo, setIsDemo] = useState(true);
  const [streakDays, setStreakDays] = useState(0);
  const [userName, setUserName] = useState('Learner');
  const [userEmail, setUserEmail] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadNavData() {
      try {
        const result = await fetchUserSessionsAndStats();
        if (isMounted) {
          setIsDemo(result.isDemo);
          setStreakDays(result.stats.streakDays);
          setUserName(result.profile?.fullName || 'Learner');
          setUserEmail(result.profile?.email || '');
        }
      } catch {
        if (isMounted) {
          const profile = getDemoProfile();
          setStreakDays(profile?.streakDays ?? 0);
          setUserName(profile?.fullName || 'Learner');
          setUserEmail(profile?.email || '');
        }
      }
    }
    loadNavData();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    await signOutUser();
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/live-interview', label: 'Live AI Interview' },
    { href: '/extempore', label: 'Extempore' },
    { href: '/interview', label: 'Interviews' },
    { href: '/speaking-lab', label: 'Speaking Lab' },
    { href: '/vocabulary', label: 'Vocabulary' },
    { href: '/mistakes', label: 'Notebook' },
    { href: '/progress', label: 'Progress' },
  ];

  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Minimalist Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center font-semibold transition-transform duration-150 group-hover:scale-105">
              <Mic className="w-4 h-4 text-zinc-950" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                SpeakWell
              </span>
            </div>
          </Link>

          {/* Minimalist Desktop Navigation */}
          {!isPublicPage && (
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'text-zinc-100 bg-zinc-800/70 border border-zinc-700/50'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Action Minimal Controls */}
          <div className="flex items-center gap-2.5">
            {!isPublicPage ? (
              <>
                {/* Streak Badge */}
                <div 
                  title={`${streakDays} days practice streak`}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{streakDays}d</span>
                </div>

                {/* Profile & Logout Dropdown */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 p-1 rounded-full hover:bg-zinc-800/60 transition-colors cursor-pointer"
                    title="User Account"
                  >
                    <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700/70 flex items-center justify-center text-xs font-medium text-zinc-200">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl py-1.5 z-50 text-xs animate-fade-in">
                      <div className="px-3.5 py-2 border-b border-white/[0.06]">
                        <p className="font-medium text-zinc-200 truncate">{userName}</p>
                        {userEmail && (
                          <p className="text-[11px] text-zinc-500 font-mono truncate">{userEmail}</p>
                        )}
                        <span className={`inline-block mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isDemo 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {isDemo ? 'Demo Mode' : 'Cloud Account'}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                        >
                          <Settings className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Settings</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-white/[0.06]">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 text-red-400" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/extempore"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-white transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/[0.06] bg-[#09090b]/95 backdrop-blur-xl px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-zinc-100 bg-zinc-800/70'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-3 mt-2 border-t border-zinc-800/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </Link>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                Home
              </Link>
            </div>

            {!isPublicPage && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 py-2 text-red-400 hover:text-red-300 transition-colors text-left cursor-pointer border-t border-zinc-800/50 pt-2"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Log Out ({userName})</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
