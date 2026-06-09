'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { LeaderMember } from '@/types';
import { Star } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';
const MAX = 650;

interface MembersResponse {
  team: { id: string; name: string } | null;
  max: number;
  members: LeaderMember[];
}

export default function AvaliacaoPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // Bloqueia quem não é líder
  useEffect(() => {
    if (!isLoading && user && !user.leaderTeamId) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  const { data, isLoading: loadingMembers } = useQuery<MembersResponse>({
    queryKey: ['leader-members'],
    queryFn: () => api.get('/leader/members').then((r) => r.data),
    enabled: !!user?.leaderTeamId,
  });

  async function handleSave(memberId: string) {
    const raw = drafts[memberId];
    const points = Number(raw);
    if (raw === undefined || raw === '' || isNaN(points) || points < 0 || points > MAX) {
      toast.error(`Informe uma nota de 0 a ${MAX}`);
      return;
    }
    setSavingId(memberId);
    try {
      await api.post('/leader/evaluate', { userId: memberId, points });
      toast.success('Avaliação salva!');
      qc.invalidateQueries({ queryKey: ['leader-members'] });
      qc.invalidateQueries({ queryKey: ['ranking-individual'] });
      qc.invalidateQueries({ queryKey: ['ranking-teams'] });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Erro ao salvar avaliação');
    } finally {
      setSavingId(null);
    }
  }

  if (isLoading || !user?.leaderTeamId) return null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-bold text-xl flex items-center gap-2">
          <Star size={20} className="text-primary" /> Avaliação do time
        </h2>
        {data?.team && (
          <p className="text-sm text-muted-foreground">Time: {data.team.name} · nota de 0 a {MAX}</p>
        )}
      </div>

      {loadingMembers ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !data?.members.length ? (
        <p className="text-center text-muted-foreground text-sm py-10">Nenhum membro no seu time ainda.</p>
      ) : (
        <div className="space-y-3">
          {data.members.map((m) => {
            const draft = drafts[m.id] ?? (m.evaluation !== null ? String(m.evaluation) : '');
            return (
              <div key={m.id} className="rounded-xl bg-card border border-border p-3 flex items-center gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={m.profilePhoto ? `${BASE}${m.profilePhoto}` : undefined} />
                  <AvatarFallback>{m.fullName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{m.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.evaluation !== null ? `Avaliado: ${m.evaluation} pts` : 'Sem avaliação'}
                  </p>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={MAX}
                  inputMode="numeric"
                  value={draft}
                  onChange={(e) => setDrafts((d) => ({ ...d, [m.id]: e.target.value }))}
                  className="w-20 text-center text-base shrink-0"
                  placeholder="0"
                />
                <Button size="sm" className="shrink-0" disabled={savingId === m.id} onClick={() => handleSave(m.id)}>
                  {savingId === m.id ? '...' : 'Salvar'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
