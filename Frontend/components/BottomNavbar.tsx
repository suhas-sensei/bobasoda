'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inbox, TrendingUp, MonitorPlay } from 'lucide-react';

export function BottomNavbar() {
  const pathname = usePathname();

  const navItems = [
    { icon: Inbox, href: '/profile', label: 'Profile' },
    { icon: TrendingUp, href: '/', label: 'Tokens' },
    { icon: MonitorPlay, href: '/mindshare', label: 'Mindshare' },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 px-6 z-50">
      <div className="w-full max-w-md mx-auto">
        {/* Navbar Container */}
        <div className="bg-gradient-to-r from-gray-800/90 via-gray-900/95 to-gray-800/90 backdrop-blur-lg rounded-full shadow-2xl border border-gray-700/50">
          <div className="flex items-center justify-around px-4 py-3">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center justify-center transition-all duration-300 ${
                    index === 1 // Trade button (center)
                      ? 'w-16 h-16 -mt-8'
                      : 'w-12 h-12'
                  }`}
                >
                  {/* Center button special styling */}
                  {index === 1 ? (
                    <div className="absolute inset-0 rounded-full shadow-lg flex items-center justify-center" style={{
                      background: 'linear-gradient(to bottom right, #f7cc36, #f0b523)',
                      boxShadow: '0 10px 15px -3px rgba(247, 204, 54, 0.5), 0 4px 6px -4px rgba(247, 204, 54, 0.5)'
                    }}>
                      <Icon
                        className="w-8 h-8 text-white"
                        strokeWidth={2.5}
                      />
                    </div>
                  ) : (
                    <div className={`flex items-center justify-center w-full h-full rounded-full transition-all ${
                      isActive
                        ? 'bg-gray-700/50 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                    }`}>
                      <Icon
                        className="w-6 h-6"
                        strokeWidth={2}
                      />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
