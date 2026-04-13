'use client';

import { Shield, Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header className="fixed left-64 right-0 top-0 z-40 h-16 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Network Security Suite</p>
          <h1 className="text-sm font-semibold text-white">Real-time DNS Threat Optimization</h1>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
          <Shield className="h-4 w-4 text-cyan-300" />
          Secure Engine
          <Sparkles className="h-4 w-4 text-fuchsia-300" />
        </div>
      </div>
    </header>
  );
}
