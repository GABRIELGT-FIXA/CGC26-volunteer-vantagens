'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api, setAccessToken } from '@/lib/api';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// Normaliza nome de time para slug de tema
function teamToThemeSlug(teamName: string): string {
  return teamName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/\s+/g, '')
    .replace(/ç/g, 'c');
}

const VALID_THEMES = [
  'alcance','cathering','central','creative','danca',
  'femininas','filiais','horizonte','link','music',
  'producao','store','teatro','welcome',
];

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { login, logout, setLoading } = useAuthStore();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const res = await api.post('/auth/refresh');
        const token = res.data.accessToken;
        setAccessToken(token);
        const me = await api.get('/users/me');
        login(token, me.data);

        // Auto-aplica tema do time somente se o usuário não tiver override manual
        const hasManual = localStorage.getItem('cc26-theme-manual');
        if (!hasManual && me.data.teams?.length > 0) {
          const slug = teamToThemeSlug(me.data.teams[0].team.name);
          if (VALID_THEMES.includes(slug)) {
            document.documentElement.setAttribute('data-theme', slug);
            localStorage.setItem('cc26-theme', slug);
          }
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    })();
  }, [login, logout, setLoading]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>
        {children}
        <Toaster richColors position="top-right" />
      </AuthBootstrap>
    </QueryClientProvider>
  );
}
