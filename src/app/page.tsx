'use client';

import React from 'react';
import Link from 'next/link';
import {
  Package,
  Truck,
  Shield,
  Calculator,
  ArrowRight,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Database,
  MapPin,
  Clock,
  Send,
} from 'lucide-react';
import { RateCalculatorWidget } from '@/components/RateCalculatorWidget';

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950/40 via-slate-900/80 to-slate-950 border border-indigo-500/20 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ENTERPRISE LOGISTICS SUITE • LAST-MILE TRACKER</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Autonomous <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">Rate Calculation</span> & Smart Delivery Engine
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Engineered with dynamic zone-aware rate cards, pure TypeScript Haversine proximity routing,
            concurrency-safe agent auto-assignment, immutable audit logs, and 1-click automated failed-delivery rescheduling.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/orders/new"
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all group"
            >
              <Package className="w-4 h-4" />
              <span>Create Order with Live Quote</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/admin"
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all"
            >
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Admin Operations Center</span>
            </Link>

            <Link
              href="/track/LOGI-119483"
              className="px-4 py-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all"
            >
              <Zap className="w-4 h-4 text-rose-400" />
              <span>Test Failed Reschedule Flow</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Interactive Portal Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Customer Portal */}
        <Link
          href="/dashboard"
          className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-850/80 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">
              Customer Portal
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Place B2B/B2C shipments, view transparent volumetric cost breakdowns, and track shipments in real time.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-400">
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 2: Delivery Agent App */}
        <Link
          href="/agent"
          className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-850/80 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">
              Agent Mobile View
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mobile-first dispatch queue. 1-tap status transitions (Picked up, In Transit, Out for Delivery, Delivered, Failed).
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-amber-400">
            <span>Launch Agent App</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 3: Admin Command Center */}
        <Link
          href="/admin"
          className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-850/80 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
              Admin Command
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamic Rate Cards, Zone mapping matrix, order grid with SLA breach badges, and manual agent overrides.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-400">
            <span>Manage Operations</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 4: 1-Click Reschedule Portal */}
        <Link
          href="/reschedule/reschedule_token_demo_119483"
          className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 hover:bg-slate-850/80 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1 group-hover:text-rose-300 transition-colors">
              1-Click Reschedule
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant customer recovery for failed deliveries. Select preferred date and auto-reassign nearest agent.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-rose-400">
            <span>Demo Reschedule Link</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Interactive Rate Engine Sandbox Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-400" />
              <span>Interactive Dynamic Rate Engine Sandbox</span>
            </h2>
            <p className="text-xs text-slate-400">
              Test volumetric calculation, chargeable weight heuristics, and zone rate card lookups in real time.
            </p>
          </div>
        </div>

        <RateCalculatorWidget showOrderNowButton onOrderNow={() => (window.location.href = '/orders/new')} />
      </div>

      {/* Core Architectural Highlights Grid */}
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Senior Architectural Highlights & Business Compliance</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Zero hardcoded rates • Concurrency transaction locks • Pure Haversine geography • SLA monitoring
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <Calculator className="w-4 h-4" />
              <span>Dynamic Rate Engine</span>
            </div>
            <p className="text-slate-300">
              Computes volumetric weight <span className="font-mono text-indigo-300">(L×B×H)/5000</span>, bills on higher of actual vs volumetric, and pulls dynamic RateCards from DB.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <MapPin className="w-4 h-4" />
              <span>Pure Haversine Routing</span>
            </div>
            <p className="text-slate-300">
              Spherical trigonometric Haversine formula implemented from scratch in pure TypeScript to rank nearest agents without external geo dependencies.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <Database className="w-4 h-4" />
              <span>Race Condition Handling</span>
            </div>
            <p className="text-slate-300">
              Prisma interactive transactions lock agent assignments, preventing two concurrent orders from claiming the same capacity at the exact same millisecond.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
              <Clock className="w-4 h-4" />
              <span>Visual SLA Tracking</span>
            </div>
            <p className="text-slate-300">
              Real-time time-in-state monitoring flags shipments with Green/Yellow/Red indicators as SLAs approach or breach configured thresholds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
