'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DEMO_USERS, AuthUser } from '@/types/auth';
import { UserCheck, Shield, Truck, User, RefreshCw, ChevronDown, Check } from 'lucide-react';

export const DemoSwitcher: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const fetchActiveUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchActiveUser();
  }, [pathname]);

  const handleSwitch = async (userId: string) => {
    setIsSwitching(true);
    try {
      const res = await fetch('/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setIsOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-3.5 h-3.5 text-indigo-400" />;
      case 'AGENT':
        return <Truck className="w-3.5 h-3.5 text-amber-400" />;
      case 'CUSTOMER':
        return <User className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <UserCheck className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'AGENT':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'CUSTOMER':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-300">DEMO SESSION SWITCHER:</span>
            <span className="text-slate-400 hidden sm:inline">Active Persona →</span>
          </div>

          {currentUser && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-medium ${getRoleBadgeStyle(currentUser.role)}`}>
              {getRoleIcon(currentUser.role)}
              <span className="font-semibold">{currentUser.name}</span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/30 font-mono">
                {currentUser.role}
              </span>
            </div>
          )}
        </div>

        {/* Quick Click Buttons for instant testing */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {DEMO_USERS.map((user) => {
            const isActive = currentUser?.id === user.id || (!currentUser && user.id === DEMO_USERS[0].id);
            return (
              <button
                key={user.id}
                onClick={() => handleSwitch(user.id)}
                disabled={isSwitching}
                title={user.description}
                className={`px-2.5 py-1 rounded-md border transition-all flex items-center gap-1 whitespace-nowrap text-xs ${isActive
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm font-semibold'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                {getRoleIcon(user.role)}
                <span>{user.badge}</span>
                {isActive && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}

          {/* Quick Dropdown on small screens */}
          <div className="relative md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="px-2 py-1 bg-slate-800 text-slate-200 rounded border border-slate-700 flex items-center gap-1"
            >
              <span>More</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-1 z-50">
                {DEMO_USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSwitch(user.id)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-slate-800 text-slate-300 text-xs flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{user.name}</span>
                      <span className="text-[10px] text-slate-400">{user.role}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{user.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
