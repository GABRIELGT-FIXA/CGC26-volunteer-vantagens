'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Task } from '@/types';
import { Plus, Pencil, Trash2, MessageSquare, LogIn, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { CampaignEditor, type CampaignInitial } from '../campanhas/CampaignEditor';

// Resolve as variáveis da tarefa em valores reais e monta o template de campanha
function buildCampaignInitial(task: Task, type: 'checkin' | 'checkout'): CampaignInitial {
  const start = new Date(task.startTime);
  const end = new Date(task.endTime);
  const dateStr = format(start, 'dd/MM');
  const startStr = format(start, 'HH:mm');
  const endStr = format(end, 'HH:mm');

  if (type === 'checkin') {
    return {
      name: `Lembrete Check-in — ${task.name} (${dateStr})`,
      scheduledAt: task.startTime,
      message:
        `📸 *${task.name}* começou agora!\n\n` +
        `📅 Data: ${dateStr}\n` +
        `⏰ Horário: ${startStr} — ${endStr}\n` +
        `⭐ Pontuação: ${task.points} pontos\n\n` +
        `Você tem ${task.windowMinutes} minutos para registrar sua chegada.\n\n` +
        `Acesse a plataforma e tire sua foto de entrada! 🏁`,
    };
  }

  // checkout abre em endTime + offset (offset é negativo p/ "antes do fim")
  const checkoutOpen = new Date(end.getTime() + (task.checkOutOffsetMinutes ?? 0) * 60_000);
  return {
    name: `Lembrete Check-out — ${task.name} (${dateStr})`,
    scheduledAt: checkoutOpen.toISOString(),
    message:
      `📸 *${task.name}* está encerrando!\n\n` +
      `📅 Data: ${dateStr}\n` +
      `⏰ Horário: ${startStr} — ${endStr}\n` +
      `⭐ Pontuação: ${task.points} pontos\n\n` +
      `Você tem ${task.windowMinutes} minutos para registrar sua saída.\n\n` +
      `Acesse a plataforma e tire sua foto de saída! ✅`,
  };
}

type FormState = {
  name: string; description: string; points: string;
  startTime: string; endTime: string; windowMinutes: string;
  checkOutMode: 'AT_END' | 'BEFORE_END';
  checkOutBeforeMinutes: string;
};

const emptyForm: FormState = {
  name: '', description: '', points: '1',
  startTime: '', endTime: '', windowMinutes: '10',
  checkOutMode: 'AT_END', checkOutBeforeMinutes: '10',
};

function taskStatus(task: Task): { label: string; variant: 'default' | 'secondary' | 'destructive' } {
  const now = new Date();
  const windowEnd = new Date(new Date(task.endTime).getTime() + task.windowMinutes * 60_000);
  if (new Date(task.startTime) > now) return { label: 'Futura', variant: 'secondary' };
  if (windowEnd < now) return { label: 'Encerrada', variant: 'destructive' };
  return { label: 'Em andamento', variant: 'default' };
}

// Definido FORA do componente pai para não ser recriado a cada render
function TaskForm({ form, loading, editing, onChange, onSubmit }: {
  form: FormState;
  loading: boolean;
  editing: boolean;
  onChange: (key: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input value={form.name} onChange={(e) => onChange('name', e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Descrição (opcional)</Label>
        <Textarea value={form.description} onChange={(e) => onChange('description', e.target.value)} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Pontuação</Label>
          <Input type="number" min={1} value={form.points} onChange={(e) => onChange('points', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Janela (min)</Label>
          <Input type="number" min={1} value={form.windowMinutes} onChange={(e) => onChange('windowMinutes', e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Início</Label>
        <Input type="datetime-local" value={form.startTime} onChange={(e) => onChange('startTime', e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Fim</Label>
        <Input type="datetime-local" value={form.endTime} onChange={(e) => onChange('endTime', e.target.value)} required />
      </div>
      {/* Checkout mode */}
      <div className="space-y-2">
        <Label>Abertura do Check-out</Label>
        <div className="grid grid-cols-2 gap-2">
          {(['AT_END', 'BEFORE_END'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChange('checkOutMode', mode)}
              className={`p-2 rounded-lg border text-sm transition-all text-left ${
                form.checkOutMode === mode
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground'
              }`}
            >
              {mode === 'AT_END' ? 'No horário de fim' : 'Antes do fim'}
            </button>
          ))}
        </div>
        {form.checkOutMode === 'BEFORE_END' && (
          <div className="flex items-center gap-2">
            <Input
              type="number" min={1} max={120}
              value={form.checkOutBeforeMinutes}
              onChange={(e) => onChange('checkOutBeforeMinutes', e.target.value)}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">minutos antes do fim</span>
          </div>
        )}
      </div>

      {form.startTime && form.endTime && (
        <p className="text-xs text-muted-foreground bg-muted rounded p-2">
          Check-in: {form.startTime.slice(11)} → +{form.windowMinutes}min &nbsp;|&nbsp;
          Check-out: {form.checkOutMode === 'BEFORE_END'
            ? `${form.endTime.slice(11)} -${form.checkOutBeforeMinutes}min`
            : form.endTime.slice(11)} → +{form.windowMinutes}min
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Salvando...' : editing ? 'Salvar' : 'Criar tarefa'}
      </Button>
    </form>
  );
}

export default function TarefasAdminPage() {
  const qc = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState<Task | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [campaignDraft, setCampaignDraft] = useState<CampaignInitial | null>(null);

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', ''],
    queryFn: () => api.get('/tasks').then((r) => r.data),
  });

  function handleChange(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function toDatetimeLocal(iso: string) {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const checkOutOffsetMinutes = form.checkOutMode === 'BEFORE_END'
      ? -Math.abs(Number(form.checkOutBeforeMinutes))
      : 0;

    const payload = {
      name: form.name,
      description: form.description || undefined,
      points: Number(form.points),
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
      windowMinutes: Number(form.windowMinutes),
      checkOutOffsetMinutes,
    };
    try {
      if (openEdit) {
        await api.put(`/tasks/${openEdit.id}`, payload);
        toast.success('Tarefa atualizada');
        setOpenEdit(null);
      } else {
        await api.post('/tasks', payload);
        toast.success('Tarefa criada');
        setOpenCreate(false);
      }
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setForm(emptyForm);
    } catch {
      toast.error('Erro ao salvar tarefa');
    } finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta tarefa?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa excluída');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Erro ao excluir');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-xl">Tarefas</h2>
        <Dialog open={openCreate} onOpenChange={(o) => { setOpenCreate(o); if (!o) setForm(emptyForm); }}>
          <DialogTrigger>
            <Button size="sm"><Plus size={16} className="mr-1" /> Nova tarefa</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova tarefa</DialogTitle></DialogHeader>
            <TaskForm form={form} loading={loading} editing={false} onChange={handleChange} onSubmit={handleSubmit} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {tasks?.map((task) => {
            const status = taskStatus(task);
            return (
              <div key={task.id} className="rounded-xl bg-card border border-border p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{task.name}</p>
                    <Badge variant={status.variant} className="shrink-0">{status.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(task.startTime), 'dd/MM HH:mm')} — {format(new Date(task.endTime), 'HH:mm')} · {task.points} pts · janela {task.windowMinutes}min
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="icon" title="Criar campanha">
                        <MessageSquare size={15} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setCampaignDraft(buildCampaignInitial(task, 'checkin'))}>
                        <LogIn size={14} className="mr-2" /> Campanha de lembrete (Check-in)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCampaignDraft(buildCampaignInitial(task, 'checkout'))}>
                        <LogOut size={14} className="mr-2" /> Campanha de lembrete (Check-out)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="ghost" size="icon" onClick={() => {
                    setForm({
                      name: task.name,
                      description: task.description ?? '',
                      points: String(task.points),
                      startTime: toDatetimeLocal(task.startTime),
                      endTime: toDatetimeLocal(task.endTime),
                      windowMinutes: String(task.windowMinutes),
                      checkOutMode: task.checkOutOffsetMinutes < 0 ? 'BEFORE_END' : 'AT_END',
                      checkOutBeforeMinutes: String(Math.abs(task.checkOutOffsetMinutes) || 10),
                    });
                    setOpenEdit(task);
                  }}>
                    <Pencil size={15} />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(task.id)}>
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            );
          })}
          {!tasks?.length && <p className="text-center text-muted-foreground text-sm py-8">Nenhuma tarefa ainda.</p>}
        </div>
      )}

      <Dialog open={!!openEdit} onOpenChange={(o) => { if (!o) { setOpenEdit(null); setForm(emptyForm); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar tarefa</DialogTitle></DialogHeader>
          <TaskForm form={form} loading={loading} editing={true} onChange={handleChange} onSubmit={handleSubmit} />
        </DialogContent>
      </Dialog>

      {/* Criação de campanha a partir da tarefa */}
      <Dialog open={!!campaignDraft} onOpenChange={(o) => !o && setCampaignDraft(null)}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto w-full">
          <DialogHeader><DialogTitle>Nova campanha</DialogTitle></DialogHeader>
          {campaignDraft && (
            <CampaignEditor
              initial={campaignDraft}
              onSuccess={() => {
                qc.invalidateQueries({ queryKey: ['campaigns'] });
                setCampaignDraft(null);
                toast.success('Campanha criada a partir da tarefa');
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
