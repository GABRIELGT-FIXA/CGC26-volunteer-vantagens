'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { News } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Newspaper } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';
const STORAGE_KEY = 'cc26-last-news';

function formatNewsDate(iso: string): string {
  const d = new Date(iso);
  return `${format(d, 'dd/MM', { locale: ptBR })} às ${format(d, 'HH')}h`;
}

export function NewNewsWatcher() {
  const [popup, setPopup] = useState<News | null>(null);
  const initialized = useRef(false);

  const { data: news } = useQuery<News[]>({
    queryKey: ['news'],
    queryFn: () => api.get('/news').then((r) => r.data),
    refetchInterval: 45_000,
  });

  useEffect(() => {
    if (!news?.length) return;
    const newest = news[0]; // lista vem ordenada desc
    const lastSeen = localStorage.getItem(STORAGE_KEY);

    if (!initialized.current) {
      initialized.current = true;
      // Primeira carga: se já existe registro e chegou notícia nova desde a última visita → popup
      if (lastSeen && lastSeen !== newest.id) {
        setPopup(newest);
      }
      localStorage.setItem(STORAGE_KEY, newest.id);
      return;
    }

    // Polls seguintes: notícia nova chegou enquanto logado
    if (lastSeen !== newest.id) {
      setPopup(newest);
      localStorage.setItem(STORAGE_KEY, newest.id);
    }
  }, [news]);

  return (
    <Dialog open={!!popup} onOpenChange={(o) => !o && setPopup(null)}>
      <DialogContent className="max-w-md">
        {popup && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary shrink-0">
                  <Newspaper size={16} />
                </span>
                Nova notícia!
              </DialogTitle>
            </DialogHeader>
            {popup.image && (
              <div className="rounded-lg overflow-hidden bg-muted aspect-[16/8]">
                <img src={`${BASE}${popup.image}`} alt={popup.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="space-y-1">
              <p className="font-semibold">{popup.title}</p>
              <p className="text-xs text-muted-foreground">{formatNewsDate(popup.createdAt)}</p>
              <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{popup.description}</p>
            </div>
            <Button className="w-full" onClick={() => setPopup(null)}>Entendi</Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
