'use client';

import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import type { Task, Participation } from '@/types';
import { format, isSameDay, isToday, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DayGroup {
  date: Date;
  tasks: Task[];
}

function statusBadge(task: Task, participation?: Participation): { label: string; cls: string } {
  if (participation?.status === 'COMPLETED') return { label: '🏆 Completa', cls: 'bg-primary/15 text-primary' };
  if (participation?.status === 'CHECKED_IN') return { label: '✅ Check-in feito', cls: 'bg-muted text-muted-foreground' };
  const now = new Date();
  if (isAfter(new Date(task.startTime), now)) return { label: '🔒 Em breve', cls: 'bg-muted text-muted-foreground' };
  return { label: '⏰ Disponível', cls: 'bg-primary/15 text-primary' };
}

export function UpcomingDays() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', ''],
    queryFn: () => api.get('/tasks').then((r) => r.data),
    refetchInterval: 60_000,
  });

  const { data: myParticipations } = useQuery<Participation[]>({
    queryKey: ['my-participations'],
    queryFn: () => api.get('/participations/my').then((r) => r.data),
  });

  const participationMap = new Map(myParticipations?.map((p) => [p.taskId, p]) ?? []);

  // Agrupa tarefas de hoje em diante por dia
  const groups: DayGroup[] = [];
  const todayStart = startOfDay(new Date());
  (tasks ?? [])
    .filter((t) => {
      const d = new Date(t.startTime);
      return isToday(d) || isAfter(d, todayStart);
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .forEach((task) => {
      const d = new Date(task.startTime);
      const grp = groups.find((g) => isSameDay(g.date, d));
      if (grp) grp.tasks.push(task);
      else groups.push({ date: d, tasks: [task] });
    });

  function scrollBy(dir: 1 | -1) {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  }

  // Drag-to-scroll (mouse)
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

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-64 rounded-xl shrink-0" />)}
      </div>
    );
  }

  if (!groups.length) {
    return <p className="text-muted-foreground text-sm text-center py-8">Nenhuma atividade futura.</p>;
  }

  return (
    <div className="relative">
      {/* Botões */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Próximos dias</h3>
        <div className="flex gap-1">
          <button onClick={() => scrollBy(-1)} className="p-1.5 rounded-lg bg-card border border-border hover:bg-muted transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scrollBy(1)} className="p-1.5 rounded-lg bg-card border border-border hover:bg-muted transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Carrossel */}
      <div
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {groups.map((group) => (
          <div
            key={group.date.toISOString()}
            className={cn(
              'shrink-0 w-60 snap-start rounded-xl border p-3 space-y-2',
              isToday(group.date) ? 'border-primary bg-primary/5' : 'border-border bg-card'
            )}
          >
            <div className="flex items-baseline justify-between">
              <span className={cn('font-bold text-sm capitalize', isToday(group.date) && 'text-primary')}>
                {isToday(group.date) ? 'Hoje' : format(group.date, 'EEE', { locale: ptBR })}
              </span>
              <span className="text-xs text-muted-foreground">{format(group.date, 'dd/MM', { locale: ptBR })}</span>
            </div>

            <div className="space-y-2">
              {group.tasks.map((task) => {
                const badge = statusBadge(task, participationMap.get(task.id));
                return (
                  <div key={task.id} className="rounded-lg bg-background/40 border border-border/50 p-2">
                    <p className="font-medium text-sm truncate">{task.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(task.startTime), 'HH:mm')} · {task.points} pts
                    </p>
                    <span className={cn('inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded', badge.cls)}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
