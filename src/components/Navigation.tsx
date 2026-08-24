'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  Package,
  PlusCircle,
  Truck,
  Shield,
  Search,
  Layers,
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/', icon: Compass },
    { label: 'Customer Portal', href: '/dashboard', icon: Package },
    { label: 'New Shipment', href: '/orders/new', icon: PlusCircle },
    { label: 'Delivery Agent App', href: '/agent', icon: Truck },
    { label: 'Admin Command', href: '/admin', icon: Shield },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-[41px] z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Layers className="w-5 h-5 text-indigo-400 group-hover:text-emerald-400 transition-colors" />
                </div>
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  LogiTrack<span className="text-indigo-400">.Engine</span>
                </span>
                <span className="block text-[10px] text-slate-400 font-mono tracking-wider">
                  LAST-MILE LOGISTICS ARCHITECTURE
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Track Input */}
          <div className="flex items-center gap-2">
            <Link
              href="/track/LOGI-119483"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Track Demo:</span>
              <span className="font-mono text-indigo-300 font-semibold">LOGI-119483</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
