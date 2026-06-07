'use client';

import { cn } from '@/lib/utils';
import type { Task, Participation } from '@/types';
import { format } from 'date-fns';
import { Trophy } from 'lucide-react';

interface Props {
  task: Task;
  participation?: Participation;
  onClick: () => void;
}

export function ActivityOrb({ task, participation, onClick }: Props) {
  const completed = participation?.status === 'COMPLETED';

  // Checagem leve client-side só para o efeito de pulso
  const now = Date.now();
  const start = new Date(task.startTime).getTime();
  const end = new Date(task.endTime).getTime();
  const winMs = task.windowMinutes * 60_000;
  const offMs = (task.checkOutOffsetMinutes ?? 0) * 60_000;

  const checkinOpen = !participation && now >= start && now <= start + winMs;
  const checkoutOpen = participation?.status === 'CHECKED_IN' && now >= end + offMs && now <= end + winMs;
  const active = checkinOpen || checkoutOpen;

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 w-28 shrink-0">
      <div className="relative animate-float">
        {active && (
          <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
        )}
        <div
          className={cn(
            'relative w-20 h-20 rounded-full flex items-center justify-center shadow-md',
            completed ? 'bg-primary' : 'bg-brand-gradient'
          )}
        >
          {completed ? (
            <Trophy size={30} className="text-white" />
          ) : (
            <div className="text-center leading-none">
              <span className="text-white font-bold text-xl drop-shadow">{task.points}</span>
              <p className="text-white/80 text-[9px] mt-0.5">pts</p>
            </div>
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-medium truncate w-28 px-1">{task.name}</p>
        <p className="text-[10px] text-muted-foreground">{format(new Date(task.startTime), 'HH:mm')}</p>
      </div>
    </button>
  );
}
