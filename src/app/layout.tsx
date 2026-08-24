import type { Metadata } from 'next';
import './globals.css';
import { DemoSwitcher } from '@/components/DemoSwitcher';
import { Navigation } from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'LogiTrack Engine | Last-Mile Delivery Tracker & Dynamic Rate Engine',
  description:
    'Production-grade logistics and delivery management platform featuring dynamic rate calculations, smart agent auto-assignment, immutable audit logs, and failed delivery rescheduling.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
        {/* Sticky Demo Role Switcher Bar */}
        <DemoSwitcher />
        
        {/* Top Navbar */}
        <Navigation />

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400">LogiTrack Engine</span>
              <span>•</span>
              <span>Autonomous Last-Mile Logistics Infrastructure</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="font-mono text-[11px]">Prisma + SQLite (PostgreSQL Ready)</span>
              <span>•</span>
              <span className="font-mono text-[11px]">Pure TypeScript Haversine Engine</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
