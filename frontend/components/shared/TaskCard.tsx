'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Task, Participation, WindowStatus } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  task: Task;
  participation?: Participation;
}

function Countdown({ until }: { until: Date }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    function calc() {
      const diff = until.getTime() - Date.now();
      if (diff <= 0) { setRemaining('00:00'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [until]);

  return <span className="font-mono text-primary text-sm">{remaining}</span>;
}

export function TaskCard({ task, participation }: Props) {
  const router = useRouter();

  const { data: ws } = useQuery<WindowStatus>({
    queryKey: ['window-status', task.id],
    queryFn: () => api.get(`/tasks/${task.id}/window-status`).then((r) => r.data),
    refetchInterval: 10_000,
  });

  const status = participation?.status;
  const startTime = new Date(task.startTime);
  const endTime = new Date(task.endTime);
  const windowEnd = (open: boolean, base: Date) =>
    open ? new Date(base.getTime() + task.windowMinutes * 60_000) : null;

  function getStatusInfo() {
    if (!ws) return { label: '...', color: 'secondary', emoji: '⏳' };
    const now = new Date();
    const checkoutWindowEnd = new Date(endTime.getTime() + task.windowMinutes * 60_000);

    if (status === 'COMPLETED') return { label: 'Completa', color: 'default', emoji: '🏆' };
    if (status === 'CHECKED_IN' && ws.checkOutOpen) return { label: 'Check-out aberto', color: 'default', emoji: '📸' };
    if (status === 'CHECKED_IN' && !ws.checkOutOpen && now < endTime) return { label: 'Check-in feito', color: 'secondary', emoji: '✅' };
    if (status === 'CHECKED_IN' && !ws.checkOutOpen && now > checkoutWindowEnd) return { label: 'Incompleta', color: 'destructive', emoji: '⏰' };
    if (!status && ws.checkInOpen) return { label: 'Check-in aberto', color: 'default', emoji: '📸' };
    if (!status && now > checkoutWindowEnd) return { label: 'Perdida', color: 'destructive', emoji: '⏰' };
    if (!status && now < startTime) return { label: 'Em breve', color: 'secondary', emoji: '🔒' };
    return { label: 'Aguardando', color: 'secondary', emoji: '🔒' };
  }

  const info = getStatusInfo();
  const canCheckIn = !status && ws?.checkInOpen;
  const canCheckOut = status === 'CHECKED_IN' && ws?.checkOutOpen;
  const checkInWindowEnd = windowEnd(!!ws?.checkInOpen, startTime);
  const checkOutWindowEnd = windowEnd(!!ws?.checkOutOpen, endTime);

  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold">{info.emoji} {task.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(startTime, 'HH:mm', { locale: ptBR })} — {format(endTime, 'HH:mm', { locale: ptBR })} · {task.points} pts
          </p>
        </div>
        <Badge variant={info.color as 'default' | 'secondary' | 'destructive'}>{info.label}</Badge>
      </div>

      {(ws?.checkInOpen && !status) && checkInWindowEnd && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          Janela fecha em <Countdown until={checkInWindowEnd} />
        </p>
      )}
      {(ws?.checkOutOpen && status === 'CHECKED_IN') && checkOutWindowEnd && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          Janela fecha em <Countdown until={checkOutWindowEnd} />
        </p>
      )}

      {(canCheckIn || canCheckOut) && (
        <Button
          size="sm"
          className="w-full"
          onClick={() => router.push(`/tarefas/${task.id}/${canCheckIn ? 'checkin' : 'checkout'}`)}
        >
          {canCheckIn ? 'Registrar Chegada 📸' : 'Registrar Saída 📸'}
        </Button>
      )}
    </div>
  );
}
