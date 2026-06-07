'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomSheet } from '@/components/shared/BottomSheet';
import type { News } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

// Data + hora sem minutos/segundos: "05/06 às 14h"
function formatNewsDate(iso: string): string {
  const d = new Date(iso);
  return `${format(d, 'dd/MM', { locale: ptBR })} às ${format(d, 'HH')}h`;
}

export function NewsFeed() {
  const [selected, setSelected] = useState<News | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });

  const { data: news, isLoading } = useQuery<News[]>({
    queryKey: ['news'],
    queryFn: () => api.get('/news').then((r) => r.data),
    refetchInterval: 60_000,
  });

  function scrollBy(dir: 1 | -1) {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  }

  function onMouseDown(e: React.MouseEvent) {
    const el = scrollRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.pageX, scrollLeft: el.scrollLeft, moved: false };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!drag.current.active || !scrollRef.current) return;
    const dx = e.pageX - drag.current.startX;
    if (Math.abs(dx) > 5) drag.current.moved = true;
    scrollRef.current.scrollLeft = drag.current.scrollLeft - dx;
  }
  function endDrag() { drag.current.active = false; }

  // Evita abrir o modal logo após arrastar
  function handleClick(item: News) {
    if (drag.current.moved) return;
    setSelected(item);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Newspaper size={15} /> Notícias
        </h3>
        {(news?.length ?? 0) > 1 && (
          <div className="flex gap-1">
            <button onClick={() => scrollBy(-1)} className="p-1.5 rounded-lg bg-card border border-border hover:bg-muted transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => scrollBy(1)} className="p-1.5 rounded-lg bg-card border border-border hover:bg-muted transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {[1, 2].map((i) => <Skeleton key={i} className="h-44 w-64 rounded-xl shrink-0" />)}
        </div>
      ) : !news?.length ? (
        <p className="text-muted-foreground text-sm text-center py-8">Nenhuma notícia ainda.</p>
      ) : (
        <div
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
          style={{ scrollbarWidth: 'none' }}
        >
          {/* Lista vem ordenada desc → esquerda = mais recente, direita = mais antiga */}
          {news.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className="shrink-0 w-64 snap-start text-left rounded-xl bg-card border border-border overflow-hidden hover:border-primary/50 transition-colors"
            >
              <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                {item.image ? (
                  <img src={`${BASE}${item.image}`} alt={item.title} className="w-full h-full object-cover pointer-events-none" />
                ) : (
                  <div className="w-full h-full bg-brand-gradient flex items-center justify-center">
                    <Newspaper size={32} className="text-white/70" />
                  </div>
                )}
              </div>
              <div className="p-3 space-y-1">
                <p className="font-semibold text-sm leading-tight line-clamp-2">{item.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                <p className="text-[10px] text-muted-foreground pt-1">{formatNewsDate(item.createdAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Janela (card de baixo pra cima) com a notícia completa */}
      <BottomSheet open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold">{selected.title}</h3>
            {selected.image && (
              <div className="rounded-lg overflow-hidden bg-muted">
                <img src={`${BASE}${selected.image}`} alt={selected.title} className="w-full object-cover" />
              </div>
            )}
            <p className="text-xs text-muted-foreground">{formatNewsDate(selected.createdAt)} · {selected.createdBy.fullName}</p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{selected.description}</p>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
