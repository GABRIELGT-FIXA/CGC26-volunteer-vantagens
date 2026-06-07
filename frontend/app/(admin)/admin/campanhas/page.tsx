'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Campaign } from '@/types';
import { Plus, MoreVertical, Pencil, Zap, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CampaignEditor } from './CampaignEditor';

const STATUS_LABELS: Record<Campaign['status'], string> = {
  SCHEDULED: 'Agendada',
  SENDING: 'Enviando',
  SENT: 'Enviada',
  FAILED: 'Falhou',
  CANCELLED: 'Cancelada',
};
const STATUS_VARIANTS: Record<Campaign['status'], 'default' | 'secondary' | 'destructive'> = {
  SCHEDULED: 'default',
  SENDING: 'default',
  SENT: 'secondary',
  FAILED: 'destructive',
  CANCELLED: 'secondary',
};

export default function CampanhasPage() {
  const qc = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState<Campaign | null>(null);

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: () => api.get('/campaigns').then((r) => r.data),
  });

  async function handleCancel(id: string) {
    if (!confirm('Cancelar esta campanha?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha cancelada');
    } catch { toast.error('Erro ao cancelar'); }
  }

  async function handleSendNow(id: string) {
    if (!confirm('Disparar esta campanha agora para todos os participantes?')) return;
    try {
      await api.post(`/campaigns/${id}/send-now`);
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha disparada!');
    } catch { toast.error('Erro ao disparar'); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-xl">Campanhas WhatsApp</h2>
        <Button size="sm" onClick={() => setOpenCreate(true)}>
          <Plus size={16} className="mr-1" /> Nova campanha
        </Button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Agendado para</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Destinatários</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [1,2,3].map((i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-3" colSpan={5}><Skeleton className="h-8 w-full" /></td>
                  </tr>
                ))
              : campaigns?.map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-muted-foreground">{format(new Date(c.scheduledAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
                    <td className="p-3">
                      <Badge variant={STATUS_VARIANTS[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{c.recipientCount ?? '—'}</td>
                    <td className="p-3">
                      {c.status === 'SCHEDULED' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="icon"><MoreVertical size={16} /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setOpenEdit(c)}><Pencil size={14} className="mr-2" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendNow(c.id)}><Zap size={14} className="mr-2" /> Disparar agora</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleCancel(c.id)}><XCircle size={14} className="mr-2" /> Cancelar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? [1,2,3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />) :
          campaigns?.map((c) => (
            <div key={c.id} className="rounded-xl bg-card border border-border p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(c.scheduledAt), "dd/MM HH:mm")}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={STATUS_VARIANTS[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                  {c.status === 'SCHEDULED' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="icon"><MoreVertical size={16} /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setOpenEdit(c)}><Pencil size={14} className="mr-2" /> Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendNow(c.id)}><Zap size={14} className="mr-2" /> Disparar agora</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleCancel(c.id)}><XCircle size={14} className="mr-2" /> Cancelar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              {c.recipientCount !== null && (
                <p className="text-xs text-muted-foreground">{c.recipientCount} destinatários</p>
              )}
            </div>
          ))
        }
        {!campaigns?.length && !isLoading && (
          <p className="text-center text-muted-foreground text-sm py-8">Nenhuma campanha ainda.</p>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto w-full">
          <DialogHeader><DialogTitle>Nova campanha</DialogTitle></DialogHeader>
          <CampaignEditor onSuccess={() => { qc.invalidateQueries({ queryKey: ['campaigns'] }); setOpenCreate(false); }} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!openEdit} onOpenChange={(o) => !o && setOpenEdit(null)}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto w-full">
          <DialogHeader><DialogTitle>Editar campanha</DialogTitle></DialogHeader>
          {openEdit && (
            <CampaignEditor
              campaign={openEdit}
              onSuccess={() => { qc.invalidateQueries({ queryKey: ['campaigns'] }); setOpenEdit(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
