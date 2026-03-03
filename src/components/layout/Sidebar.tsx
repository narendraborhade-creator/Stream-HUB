'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Music, 
  Video, 
  Search, 
  Library,
  PlayCircle,
  Heart
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/music', label: 'Music', icon: Music },
  { href: '/videos', label: 'Videos', icon: Video },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/search', label: 'Search', icon: Search },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 h-screen fixed left-0 top-0 flex flex-col border-r border-gray-800">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
            <PlayCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">StreamHub</span>
        </Link>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 px-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Quick Access
          </h3>
          <ul className="space-y-1">
            <li>
              <Link
                href="/favorites"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200"
              >
                <Heart className="w-5 h-5" />
                <span className="font-medium">Favorites</span>
              </Link>
            </li>
            <li>
              <Link
                href="/downloads"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200"
              >
                <Library className="w-5 h-5" />
                <span className="font-medium">Downloads</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Free streaming & downloads</p>
          <p className="text-xs text-gray-500 mt-1">No subscription required</p>
        </div>
      </div>
    </aside>
  );
}
