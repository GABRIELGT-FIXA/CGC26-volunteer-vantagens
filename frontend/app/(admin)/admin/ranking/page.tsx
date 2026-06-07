'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { RankingEntry, TeamRankingEntry } from '@/types';
import { cn } from '@/lib/utils';

const BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

const PODIUM_BORDER = ['border-yellow-400 bg-yellow-400/10', 'border-zinc-400 bg-zinc-400/10', 'border-amber-600 bg-amber-600/10'];
const PODIUM_TEXT   = ['text-yellow-400', 'text-zinc-400', 'text-amber-600'];

function PodiumCard({ entry, size }: { entry: RankingEntry; size: 'lg' | 'md' }) {
  const idx = entry.position - 1;
  const avatarSize = size === 'lg' ? 'h-16 w-16' : 'h-12 w-12';
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      {entry.position === 1 && <span className="text-yellow-400 text-base">★</span>}
      <Avatar className={cn(avatarSize, 'border-2', PODIUM_BORDER[idx]?.split(' ')[0])}>
        <AvatarImage src={entry.user?.profilePhoto ? `${BASE}${entry.user.profilePhoto}` : undefined} />
        <AvatarFallback className={size === 'lg' ? 'text-lg' : 'text-sm'}>{entry.user?.fullName?.[0] ?? '?'}</AvatarFallback>
      </Avatar>
      <p className="text-xs font-medium text-center truncate w-full px-1 leading-tight text-white drop-shadow">{entry.user?.fullName?.split(' ')[0] ?? '—'}</p>
      <div className={cn('rounded-lg border px-2 py-1 text-center w-full bg-black/20 backdrop-blur-sm', PODIUM_BORDER[idx])}>
        <p className={cn('font-bold text-xs', PODIUM_TEXT[idx])}>{entry.position}°</p>
        <p className="text-xs font-semibold text-white">{entry.totalPoints} pts</p>
      </div>
    </div>
  );
}

function IndividualRanking() {
  const { data, isLoading } = useQuery<RankingEntry[]>({
    queryKey: ['ranking-individual'],
    queryFn: () => api.get('/rankings/individual').then((r) => r.data),
    refetchInterval: 30_000,
  });

  if (isLoading) return (
    <div className="space-y-3">
      <Skeleton className="h-32 rounded-2xl" />
      {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
    </div>
  );

  if (!data?.length) return <p className="text-center text-muted-foreground text-sm py-16">Nenhuma pontuação ainda.</p>;

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <div className="space-y-4">
      {/* Pódio */}
      <div className="bg-brand-gradient border border-border rounded-2xl p-4 shadow-md">
        <div className="flex items-end justify-center gap-3">
          <div className="flex flex-col items-center flex-1 pb-2">
            {top3[1] && <PodiumCard entry={top3[1]} size="md" />}
          </div>
          <div className="flex flex-col items-center flex-1">
            {top3[0] && <PodiumCard entry={top3[0]} size="lg" />}
          </div>
          <div className="flex flex-col items-center flex-1 pb-4">
            {top3[2] && <PodiumCard entry={top3[2]} size="md" />}
          </div>
        </div>
      </div>

      {/* Lista do 4º em diante */}
      {rest.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          {rest.map((entry) => (
            <div key={entry.user?.id ?? entry.position} className="flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-b-0 bg-card">
              <span className="w-7 text-center text-sm text-muted-foreground shrink-0">#{entry.position}</span>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={entry.user?.profilePhoto ? `${BASE}${entry.user.profilePhoto}` : undefined} />
                <AvatarFallback className="text-xs">{entry.user?.fullName?.[0] ?? '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{entry.user?.fullName ?? '—'}</p>
                <p className="text-xs text-muted-foreground truncate">{entry.user?.teams?.map((t) => t.team.name).join(' · ')}</p>
              </div>
              <span className="font-bold text-sm shrink-0">{entry.totalPoints} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TeamsRanking() {
  const { data, isLoading } = useQuery<TeamRankingEntry[]>({
    queryKey: ['ranking-teams'],
    queryFn: () => api.get('/rankings/teams').then((r) => r.data),
    refetchInterval: 30_000,
  });

  if (isLoading) return <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  if (!data?.length) return <p className="text-center text-muted-foreground text-sm py-16">Nenhuma pontuação ainda.</p>;

  return (
    <div className="space-y-2">
      {data.map((entry) => {
        const idx = entry.position - 1;
        const isPodium = entry.position <= 3;
        return (
          <div key={entry.team?.id ?? entry.position} className={cn('flex items-center gap-3 p-3 rounded-xl border', isPodium ? PODIUM_BORDER[idx] : 'border-border bg-card')}>
            <span className={cn('w-8 text-center font-bold text-sm shrink-0', isPodium ? PODIUM_TEXT[idx] : 'text-muted-foreground')}>
              {isPodium ? `${entry.position}°` : `#${entry.position}`}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{entry.team?.name ?? '—'}</p>
              <p className="text-xs text-muted-foreground">{entry.team?.members?.length ?? 0} membros</p>
            </div>
            <span className={cn('font-bold shrink-0', isPodium ? PODIUM_TEXT[idx] : '')}>{entry.totalPoints} pts</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminRankingPage() {
  return (
    <div className="space-y-4">
      <h2 className="font-bold text-xl">Rankings</h2>
      <Tabs defaultValue="individual" className="flex flex-col w-full">
        <TabsList className="w-full sticky top-0 z-10 mb-4">
          <TabsTrigger value="individual" className="flex-1">Individual</TabsTrigger>
          <TabsTrigger value="times" className="flex-1">Por Time</TabsTrigger>
        </TabsList>
        <TabsContent value="individual" className="mt-0"><IndividualRanking /></TabsContent>
        <TabsContent value="times" className="mt-0"><TeamsRanking /></TabsContent>
      </Tabs>
    </div>
  );
}
