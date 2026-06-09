'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Shield, ListChecks, Trophy, MessageSquare, Newspaper, ImageIcon, LogOut, Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/usuarios', label: 'Usuários', icon: Users },
  { href: '/admin/times', label: 'Times', icon: Shield },
  { href: '/admin/tarefas', label: 'Tarefas', icon: ListChecks },
  { href: '/admin/auditoria', label: 'Auditoria', icon: ImageIcon },
  { href: '/admin/campanhas', label: 'Campanhas', icon: MessageSquare },
  { href: '/admin/noticias', label: 'Notícias', icon: Newspaper },
  { href: '/admin/ranking', label: 'Rankings', icon: Trophy },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onClick}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
            pathname.startsWith(href)
              ? 'bg-primary text-primary-foreground font-medium'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          <Icon size={18} />{label}
        </Link>
      ))}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace('/entrar');
    else if (user.role !== 'ADMIN') router.replace('/dashboard');
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  async function handleLogout() {
    try { await api.post('/auth/logout'); } catch {}
    queryClient.clear(); // limpa cache do usuário atual
    logout();
    toast.success('Sessão encerrada');
    router.replace('/entrar');
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card shrink-0 p-4 gap-4">
        <div className="rounded-xl bg-brand-gradient px-4 py-4 shadow-md">
          <h1 className="font-bold text-white text-lg leading-tight drop-shadow">Volunteer<br/>Vantagens</h1>
          <p className="text-xs text-white/80 mt-1">Painel Admin</p>
        </div>
        <div className="flex-1"><NavLinks /></div>
        <div className="px-2 pb-2">
          <p className="text-xs text-muted-foreground truncate mb-2">{user.fullName}</p>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
            <LogOut size={16} className="mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-40">
          <h1 className="font-bold text-primary">Admin</h1>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger>
              <Button variant="ghost" size="icon"><Menu size={20} /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4 flex flex-col gap-4">
              <div className="px-2 py-2">
                <h1 className="font-bold text-primary text-lg">Volunteer Vantagens</h1>
                <p className="text-xs text-muted-foreground">Painel Admin</p>
              </div>
              <div className="flex-1"><NavLinks onClick={() => setSheetOpen(false)} /></div>
              <Button variant="ghost" size="sm" className="justify-start text-muted-foreground" onClick={handleLogout}>
                <LogOut size={16} className="mr-2" /> Sair
              </Button>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
