'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Votable } from '@/types';
import { Star, Search, Lock, Trash2 } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';
const MAX = 650;

interface VotablesResponse { max: number; people: Votable[] }

export default function AvaliacaoPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user && !user.leaderTeamId) router.replace('/dashboard');
  }, [user, isLoading, router]);

  const { data, isLoading: loading } = useQuery<VotablesResponse>({
    queryKey: ['leader-votables'],
    queryFn: () => api.get('/leader/votables').then((r) => r.data),
    enabled: !!user?.leaderTeamId,
  });

  const teams = useMemo(() => {
    const s = new Set<string>();
    data?.people.forEach((p) => p.teams.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    return (data?.people ?? []).filter((p) => {
      const okSearch = p.fullName.toLowerCase().includes(search.toLowerCase());
      const okTeam = !teamFilter || p.teams.includes(teamFilter);
      return okSearch && okTeam;
    });
  }, [data, search, teamFilter]);

  const myVote = useMemo(() => data?.people.find((p) => p.status === 'mine'), [data]);

  async function vote(id: string) {
    const raw = drafts[id];
    const points = Number(raw);
    if (raw === undefined || raw === '' || isNaN(points) || points < 0 || points > MAX) {
      toast.error(`Informe uma nota de 0 a ${MAX}`);
      return;
    }
    setSavingId(id);
    try {
      await api.post('/leader/evaluate', { userId: id, points });
      toast.success('Voto registrado!');
      refresh();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Erro ao votar');
    } finally { setSavingId(null); }
  }

  async function removeVote(id: string) {
    setSavingId(id);
    try {
      await api.delete(`/leader/evaluate/${id}`);
      toast.success('Voto removido');
      setDrafts((d) => { const n = { ...d }; delete n[id]; return n; });
      refresh();
    } catch {
      toast.error('Erro ao remover voto');
    } finally { setSavingId(null); }
  }

  function refresh() {
    qc.invalidateQueries({ queryKey: ['leader-votables'] });
    qc.invalidateQueries({ queryKey: ['ranking-individual'] });
    qc.invalidateQueries({ queryKey: ['ranking-teams'] });
  }

  if (isLoading || !user?.leaderTeamId) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bold text-xl flex items-center gap-2">
          <Star size={20} className="text-primary" /> Votação
        </h2>
        <p className="text-sm text-muted-foreground">Você tem <strong>1 voto</strong>. Escolha uma pessoa de qualquer time e dê uma nota de 0 a {MAX}.</p>
      </div>

      {myVote ? (
        <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-sm flex items-center gap-2">
          <Star size={16} className="text-primary shrink-0" />
          <span>Seu voto: <strong>{myVote.fullName}</strong> · nota <strong>{myVote.points}</strong>. Votar em outra pessoa transfere o voto.</span>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          Você ainda não votou. Use o campo ao lado da pessoa para registrar seu voto.
        </div>
      )}

      {/* Busca + filtro */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar pessoa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setTeamFilter('')}
            className={`px-3 py-1 rounded-lg text-xs border whitespace-nowrap ${!teamFilter ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}>
            Todos os times
          </button>
          {teams.map((t) => (
            <button key={t} onClick={() => setTeamFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs border whitespace-nowrap ${teamFilter === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !filtered.length ? (
        <p className="text-center text-muted-foreground text-sm py-10">Ninguém encontrado.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const draft = drafts[p.id] ?? (p.points !== null ? String(p.points) : '');
            return (
              <div key={p.id} className="rounded-xl bg-card border border-border p-3 flex items-center gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={p.profilePhoto ? `${BASE}${p.profilePhoto}` : undefined} />
                  <AvatarFallback>{p.fullName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.teams.join(' · ') || 'Sem time'}</p>
                </div>

                {p.status === 'locked' ? (
                  <Badge variant="secondary" className="shrink-0">
                    <Lock size={11} className="mr-1" /> {p.evaluatedBy}
                  </Badge>
                ) : (
                  <div className="flex items-center gap-1 shrink-0">
                    <Input
                      type="number" min={0} max={MAX} inputMode="numeric"
                      value={draft}
                      onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                      className="w-16 text-center text-base"
                      placeholder="0"
                    />
                    <Button size="sm" disabled={savingId === p.id} onClick={() => vote(p.id)}>
                      {p.status === 'mine' ? 'Salvar' : 'Votar'}
                    </Button>
                    {p.status === 'mine' && (
                      <Button size="icon" variant="ghost" className="text-destructive shrink-0" disabled={savingId === p.id} onClick={() => removeVote(p.id)}>
                        <Trash2 size={15} />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
