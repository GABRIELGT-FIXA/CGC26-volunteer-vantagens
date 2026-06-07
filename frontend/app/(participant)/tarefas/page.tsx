'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ActivityOrb } from '@/components/shared/ActivityOrb';
import { ActivitySheet } from '@/components/shared/ActivitySheet';
import type { Task, Participation } from '@/types';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TarefasPage() {
  const [date, setDate] = useState(new Date());
  const [selected, setSelected] = useState<Task | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const dateStr = format(date, 'yyyy-MM-dd');

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', dateStr],
    queryFn: () => api.get(`/tasks?date=${dateStr}`).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: myParticipations } = useQuery<Participation[]>({
    queryKey: ['my-participations'],
    queryFn: () => api.get('/participations/my').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const participationMap = new Map(myParticipations?.map((p) => [p.taskId, p]) ?? []);
  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  function openTask(task: Task) {
    setSelected(task);
    setSheetOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => setDate(subDays(date, 1))} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-semibold capitalize">
            {isToday ? 'Hoje' : format(date, 'EEEE', { locale: ptBR })}
          </p>
          <p className="text-xs text-muted-foreground">{format(date, "dd 'de' MMMM", { locale: ptBR })}</p>
        </div>
        <button onClick={() => setDate(addDays(date, 1))} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-28 rounded-full" />)}
        </div>
      ) : !tasks?.length ? (
        <EmptyState message={isToday ? 'Não se preocupe, não há atividades hoje!' : 'Nenhuma atividade neste dia.'} />
      ) : (
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-6 pt-4">
          {tasks.map((task) => (
            <ActivityOrb
              key={task.id}
              task={task}
              participation={participationMap.get(task.id)}
              onClick={() => openTask(task)}
            />
          ))}
        </div>
      )}

      <ActivitySheet
        task={selected}
        participation={selected ? participationMap.get(selected.id) : undefined}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
