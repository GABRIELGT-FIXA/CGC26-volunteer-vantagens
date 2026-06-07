'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BottomSheet } from './BottomSheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Task, Participation, WindowStatus } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Star, LogIn, LogOut, Lock, CheckCircle2 } from 'lucide-react';

interface Props {
  task: Task | null;
  participation?: Participation;
  open: boolean;
  onClose: () => void;
}

export function ActivitySheet({ task, participation, open, onClose }: Props) {
  const router = useRouter();

  const { data: ws } = useQuery<WindowStatus>({
    queryKey: ['window-status', task?.id],
    queryFn: () => api.get(`/tasks/${task!.id}/window-status`).then((r) => r.data),
    enabled: !!task && open,
    refetchInterval: 10_000,
  });

  const status = participation?.status;
  const canCheckIn = !status && ws?.checkInOpen;
  const canCheckOut = status === 'CHECKED_IN' && ws?.checkOutOpen;
  const completed = status === 'COMPLETED';

  function checkInReason(): string {
    if (status) return 'Check-in já realizado';
    if (!ws?.checkInOpen) return 'Fora da janela de check-in';
    return '';
  }
  function checkOutReason(): string {
    if (completed) return 'Atividade concluída';
    if (!status) return 'Faça o check-in primeiro';
    if (!ws?.checkOutOpen) return 'Fora da janela de check-out';
    return '';
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      {task && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">{task.name}</h3>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
              )}
            </div>
            {completed && (
              <Badge className="shrink-0">🏆 Completa</Badge>
            )}
          </div>

          {/* Infos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/50 p-3 flex items-center gap-2">
              <Calendar size={18} className="text-primary shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Data</p>
                <p className="text-sm font-medium">{format(new Date(task.startTime), 'dd/MM', { locale: ptBR })}</p>
              </div>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 flex items-center gap-2">
              <Star size={18} className="text-primary shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Pontos</p>
                <p className="text-sm font-medium">{task.points}</p>
              </div>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 flex items-center gap-2 col-span-2">
              <Clock size={18} className="text-primary shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Horário</p>
                <p className="text-sm font-medium">
                  {format(new Date(task.startTime), 'HH:mm')} — {format(new Date(task.endTime), 'HH:mm')}
                  <span className="text-muted-foreground"> · janela {task.windowMinutes}min</span>
                </p>
              </div>
            </div>
          </div>

          {/* Pontos conquistados se completa */}
          {completed && (
            <div className="rounded-xl bg-primary/10 border border-primary/30 p-3 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-primary" />
              <p className="text-sm">
                Você ganhou <span className="font-bold text-primary">{participation?.pointsAwarded ?? 0} pontos</span> nesta atividade!
              </p>
            </div>
          )}

          {/* Ações */}
          {!completed && (
            <div className="space-y-2">
              {/* Check-in */}
              {canCheckIn ? (
                <Button className="w-full" onClick={() => { onClose(); router.push(`/tarefas/${task.id}/checkin`); }}>
                  <LogIn size={16} className="mr-2" /> Registrar Chegada
                </Button>
              ) : !status ? (
                <Button variant="outline" className="w-full opacity-60 cursor-not-allowed" disabled>
                  <Lock size={14} className="mr-2" /> Check-in — {checkInReason()}
                </Button>
              ) : null}

              {/* Check-out */}
              {canCheckOut ? (
                <Button className="w-full" onClick={() => { onClose(); router.push(`/tarefas/${task.id}/checkout`); }}>
                  <LogOut size={16} className="mr-2" /> Registrar Saída
                </Button>
              ) : (
                <Button variant="outline" className="w-full opacity-60 cursor-not-allowed" disabled>
                  <Lock size={14} className="mr-2" /> Check-out — {checkOutReason()}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
