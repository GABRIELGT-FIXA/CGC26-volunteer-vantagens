'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import type { User, Task } from '@/types';
import { format } from 'date-fns';

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: users, isLoading: lu } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });
  const { data: tasks, isLoading: lt } = useQuery<Task[]>({
    queryKey: ['tasks', ''],
    queryFn: () => api.get('/tasks').then((r) => r.data),
  });
  const { data: todayTasks } = useQuery<Task[]>({
    queryKey: ['tasks', today],
    queryFn: () => api.get(`/tasks?date=${today}`).then((r) => r.data),
  });

  const participants = users?.filter((u) => u.role === 'PARTICIPANT').length ?? 0;
  const teams = Array.from(new Set(users?.flatMap((u) => (u.teams ?? []).map((t) => t.teamId)) ?? [])).length;

  const loading = lu || lt;

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-xl">Dashboard</h2>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Participantes" value={participants} />
          <StatCard label="Times" value={teams} />
          <StatCard label="Tarefas" value={tasks?.length ?? 0} />
          <StatCard label="Hoje" value={todayTasks?.length ?? 0} sub="atividades" />
        </div>
      )}

      {/* Recent tasks */}
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Próximas atividades</h3>
        <div className="space-y-2">
          {tasks?.slice(0, 5).map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border text-sm">
              <div>
                <p className="font-medium">{task.name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(task.startTime), 'dd/MM HH:mm')} — {format(new Date(task.endTime), 'HH:mm')}
                </p>
              </div>
              <span className="text-primary font-bold shrink-0">{task.points} pts</span>
            </div>
          ))}
          {!tasks?.length && !lt && (
            <p className="text-center text-muted-foreground text-sm py-6">Nenhuma tarefa cadastrada.</p>
          )}
        </div>
      </div>
    </div>
  );
}
