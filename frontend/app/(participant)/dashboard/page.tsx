'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskCard } from '@/components/shared/TaskCard';
import { Reveal } from '@/components/shared/Reveal';
import { UpcomingDays } from '@/components/shared/UpcomingDays';
import { NewsFeed } from '@/components/shared/NewsFeed';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Task, Participation, MyPoints } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: tasks, isLoading: loadingTasks } = useQuery<Task[]>({
    queryKey: ['tasks', today],
    queryFn: () => api.get(`/tasks?date=${today}`).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: myParticipations } = useQuery<Participation[]>({
    queryKey: ['my-participations'],
    queryFn: () => api.get('/participations/my').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: myPoints } = useQuery<MyPoints>({
    queryKey: ['my-points'],
    queryFn: () => api.get('/users/me/points').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const participationMap = new Map(myParticipations?.map((p) => [p.taskId, p]) ?? []);
  const totalPoints = myPoints?.total ?? 0;
  const bonusPoints = myPoints?.bonusPoints ?? 0;

  return (
    <div className="space-y-6">
      <Reveal direction="down">
        <div className="rounded-xl bg-brand-gradient p-5 space-y-1 shadow-md text-white">
          <p className="text-white/80 text-sm">Olá,</p>
          <h2 className="text-xl font-bold drop-shadow">{user?.fullName.split(' ')[0]}</h2>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-4xl font-bold drop-shadow">{totalPoints}</span>
            <span className="text-white/80 text-sm">pontos acumulados</span>
          </div>
          {bonusPoints > 0 && (
            <p className="text-xs text-white/70">inclui {bonusPoints} pts de bônus</p>
          )}
          {user?.teams.length ? (
            <p className="text-xs text-white/70">
              {user.teams.map((ut) => ut.team.name).join(' • ')}
            </p>
          ) : null}
        </div>
      </Reveal>

      <div>
        <Reveal direction="left">
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
            Atividades de hoje — {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
          </h3>
        </Reveal>

        {loadingTasks ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : !tasks?.length ? (
          <EmptyState message="Não se preocupe, não há atividades hoje!" />
        ) : (
          <div className="space-y-3">
            {tasks.map((task, i) => (
              <Reveal key={task.id} direction="up" delay={i * 80}>
                <TaskCard task={task} participation={participationMap.get(task.id)} />
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {/* Próximos dias — carrossel */}
      <Reveal direction="up">
        <UpcomingDays />
      </Reveal>

      {/* Notícias */}
      <Reveal direction="up">
        <NewsFeed />
      </Reveal>
    </div>
  );
}
