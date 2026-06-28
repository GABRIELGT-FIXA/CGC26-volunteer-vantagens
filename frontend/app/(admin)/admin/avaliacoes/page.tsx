'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { EvaluationRow } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Star } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

export default function AvaliacoesAdminPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<EvaluationRow[]>({
    queryKey: ['all-evaluations'],
    queryFn: () => api.get('/leader/all-evaluations').then((r) => r.data),
  });

  const filtered = useMemo(() => {
    return (data ?? []).filter((e) =>
      e.pessoa.toLowerCase().includes(search.toLowerCase()) ||
      e.lider.toLowerCase().includes(search.toLowerCase()) ||
      e.time.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-bold text-xl flex items-center gap-2"><Star size={20} className="text-primary" /> Avaliações</h2>
        <p className="text-sm text-muted-foreground">Verificação: qual líder votou em qual participante.</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por pessoa, líder ou time..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : !filtered.length ? (
        <p className="text-center text-muted-foreground text-sm py-10">Nenhuma avaliação registrada.</p>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">Pessoa</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Time</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Líder (votou)</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Nota</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.pessoaId} className="border-t border-border">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7"><AvatarImage src={e.profilePhoto ? `${BASE}${e.profilePhoto}` : undefined} /><AvatarFallback className="text-xs">{e.pessoa[0]}</AvatarFallback></Avatar>
                        <span className="font-medium">{e.pessoa}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{e.time}</td>
                    <td className="p-3">{e.lider}</td>
                    <td className="p-3 font-bold text-primary">{e.nota}</td>
                    <td className="p-3 text-muted-foreground">{format(new Date(e.data), 'dd/MM HH:mm', { locale: ptBR })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-2">
            {filtered.map((e) => (
              <div key={e.pessoaId} className="rounded-xl bg-card border border-border p-3 flex items-center gap-3">
                <Avatar className="h-9 w-9 shrink-0"><AvatarImage src={e.profilePhoto ? `${BASE}${e.profilePhoto}` : undefined} /><AvatarFallback>{e.pessoa[0]}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{e.pessoa} <span className="text-muted-foreground font-normal">· {e.time}</span></p>
                  <p className="text-xs text-muted-foreground">Líder: {e.lider} · {format(new Date(e.data), 'dd/MM HH:mm')}</p>
                </div>
                <span className="font-bold text-primary shrink-0">{e.nota}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
