'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useUser, useClerk, UserButton } from '@clerk/nextjs';
import { Key, Boxes, FileText, LayoutDashboard, LogOut } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/dashboard/keys',
    icon: Key,
    label: 'API Keys',
  },
  {
    href: '/dashboard/modules',
    icon: Boxes,
    label: 'Modules',
  },
  {
    href: '/dashboard/logs',
    icon: FileText,
    label: 'Logs',
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <TooltipProvider>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 z-50 flex h-screen w-56 flex-col bg-slate-900">
          {/* Logo */}
          <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-4">
            <LayoutDashboard className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-semibold text-white">DMDS</span>
          </div>

          {/* Nav items */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navItems.map(({ href, icon: Icon, label }) => {
              const isActive = pathname.startsWith(href);
              return (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-slate-700 px-3 py-4">
            <div className="flex items-center gap-3 rounded-md px-2 py-2">
              <UserButton afterSignOutUrl="/" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {user?.fullName ?? user?.firstName ?? 'User'}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {user?.primaryEmailAddress?.emailAddress ?? ''}
                </p>
              </div>
              <button
                onClick={() => signOut({ redirectUrl: '/' })}
                className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="ml-56 flex min-h-screen flex-1 flex-col bg-white">
          <div className="flex-1 p-6">{children}</div>
        </main>
      </div>
    </TooltipProvider>
  );
}
