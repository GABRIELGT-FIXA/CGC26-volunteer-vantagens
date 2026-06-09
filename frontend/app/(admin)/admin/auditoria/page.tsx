'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Participation } from '@/types';
import { format } from 'date-fns';
import { Check, X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

const BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

type Filter = 'all' | 'pending' | 'considered' | 'disconsidered';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'considered', label: 'Consideradas' },
  { key: 'disconsidered', label: 'Desconsideradas' },
];

export default function AuditoriaPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>('pending');
  const [zoom, setZoom] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<Participation[]>({
    queryKey: ['audit', filter],
    queryFn: () => api.get(`/participations/audit${filter === 'all' ? '' : `?status=${filter}`}`).then((r) => r.data),
  });

  async function review(id: string, consider: boolean) {
    setActingId(id);
    try {
      await api.put(`/participations/${id}/review`, { consider });
      toast.success(consider ? 'Participação considerada' : 'Participação desconsiderada');
      qc.invalidateQueries({ queryKey: ['audit'] });
      qc.invalidateQueries({ queryKey: ['ranking-individual'] });
      qc.invalidateQueries({ queryKey: ['ranking-teams'] });
    } catch {
      toast.error('Erro ao revisar');
    } finally { setActingId(null); }
  }

  function statusBadge(p: Participation) {
    if (!p.reviewed) return <Badge variant="secondary">Pendente</Badge>;
    if (p.pointsAwarded > 0) return <Badge>Considerada · {p.pointsAwarded} pts</Badge>;
    return <Badge variant="destructive">Desconsiderada</Badge>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-bold text-xl">Auditoria de fotos</h2>
        <p className="text-sm text-muted-foreground">Revise as fotos de check-in e check-out e considere ou desconsidere cada participação.</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm border transition-colors',
              filter === f.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
      ) : !data?.length ? (
        <p className="text-center text-muted-foreground text-sm py-12">Nenhuma participação nesta categoria.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <div key={p.id} className="rounded-xl bg-card border border-border overflow-hidden flex flex-col">
              {/* Cabeçalho */}
              <div className="p-3 flex items-center gap-2 border-b border-border">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={p.user?.profilePhoto ? `${BASE}${p.user.profilePhoto}` : undefined} />
                  <AvatarFallback className="text-xs">{p.user?.fullName?.[0] ?? '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.user?.fullName ?? '—'}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.task.name} · {p.team?.name}</p>
                </div>
                {statusBadge(p)}
              </div>

              {/* Fotos */}
              <div className="grid grid-cols-2 gap-px bg-border">
                <PhotoCell label="Entrada" photo={p.checkInPhoto} time={p.checkInTime} onZoom={setZoom} />
                <PhotoCell label="Saída" photo={p.checkOutPhoto} time={p.checkOutTime} onZoom={setZoom} />
              </div>

              {/* Ações */}
              <div className="p-3 flex gap-2 mt-auto">
                <Button
                  size="sm" variant="outline"
                  className="flex-1 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                  disabled={actingId === p.id}
                  onClick={() => review(p.id, true)}
                >
                  <Check size={15} className="mr-1" /> Considerar
                </Button>
                <Button
                  size="sm" variant="outline"
                  className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-white"
                  disabled={actingId === p.id}
                  onClick={() => review(p.id, false)}
                >
                  <X size={15} className="mr-1" /> Desconsiderar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zoom da foto */}
      <Dialog open={!!zoom} onOpenChange={(o) => !o && setZoom(null)}>
        <DialogContent className="max-w-2xl p-2">
          {zoom && <img src={zoom} alt="Foto" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PhotoCell({ label, photo, time, onZoom }: {
  label: string;
  photo: string | null;
  time: string | null;
  onZoom: (url: string) => void;
}) {
  const url = photo ? `${BASE}${photo}` : null;
  return (
    <div className="bg-card relative aspect-square">
      {url ? (
        <button className="w-full h-full group" onClick={() => onZoom(url)}>
          <img src={url} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100" />
          </div>
        </button>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Sem foto</div>
      )}
      <span className="absolute top-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
        {label}{time ? ` ${format(new Date(time), 'HH:mm')}` : ''}
      </span>
    </div>
  );
}
