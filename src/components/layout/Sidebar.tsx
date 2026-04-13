'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, PlayCircle, ShieldCheck } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Threat Dashboard', icon: ShieldCheck },
  { href: '/', label: 'Website Compare', icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-fuchsia-600">
            <PlayCircle className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">SecureScope</span>
        </Link>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === '/' && index === 0;

            return (
              <li key={item.label + index}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600/20 to-fuchsia-600/20 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-cyan-300' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-xl bg-gradient-to-r from-cyan-600/10 to-fuchsia-600/10 p-4">
          <p className="text-sm text-slate-300">DNS + TLS + Header intelligence</p>
          <p className="mt-1 text-xs text-slate-500">Built with React + Node.js APIs</p>
        </div>
      </div>
    </aside>
  );
}
