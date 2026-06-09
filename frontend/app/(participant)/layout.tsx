'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { LayoutDashboard, ListChecks, Trophy, User, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NewNewsWatcher } from '@/components/shared/NewNewsWatcher';

const BASE_NAV = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/tarefas', label: 'Tarefas', icon: ListChecks },
  { href: '/ranking', label: 'Ranking', icon: Trophy },
  { href: '/perfil', label: 'Perfil', icon: User },
];

export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  // Líderes ganham o item "Avaliação"
  const NAV = user?.leaderTeamId
    ? [...BASE_NAV.slice(0, 3), { href: '/avaliacao', label: 'Avaliar', icon: Star }, BASE_NAV[3]]
    : BASE_NAV;
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace('/entrar');
    else if (user.role === 'ADMIN') router.replace('/admin/dashboard');
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col pb-16 lg:pb-0 lg:flex-row">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-card shrink-0 p-4 gap-2">
        <div className="rounded-xl bg-brand-gradient px-4 py-5 mb-2 shadow-md">
          <h1 className="font-bold text-white text-lg leading-tight drop-shadow">Volunteer<br/>Vantagens</h1>
        </div>
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === href
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <Icon size={18} />{label}
          </Link>
        ))}
      </aside>

      {/* Watcher de novas notícias */}
      <NewNewsWatcher />

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">{children}</div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2 text-[10px] transition-colors',
                pathname === href ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
