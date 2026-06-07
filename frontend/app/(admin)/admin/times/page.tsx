'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Team } from '@/types';
import { Plus, Trash2, Pencil, Users } from 'lucide-react';

export default function TimesAdminPage() {
  const qc = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState<Team | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: teams, isLoading } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => api.get('/teams').then((r) => r.data),
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/teams', { name });
      qc.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Time criado');
      setName(''); setOpenCreate(false);
    } catch {
      toast.error('Erro ao criar time');
    } finally { setLoading(false); }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!openEdit) return;
    setLoading(true);
    try {
      await api.put(`/teams/${openEdit.id}`, { name });
      qc.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Time atualizado');
      setOpenEdit(null);
    } catch {
      toast.error('Erro ao editar time');
    } finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este time?')) return;
    try {
      await api.delete(`/teams/${id}`);
      qc.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Time excluído');
    } catch {
      toast.error('Erro ao excluir time');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-xl">Times</h2>
        <Dialog open={openCreate} onOpenChange={(o) => { setOpenCreate(o); setName(''); }}>
          <DialogTrigger>
            <Button size="sm"><Plus size={16} className="mr-1" /> Novo time</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar time</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do time</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Alpha" autoFocus />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
                {loading ? 'Criando...' : 'Criar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {teams?.map((team) => (
            <div key={team.id} className="rounded-xl bg-card border border-border p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{team.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Users size={12} /> {team.members?.length ?? 0} membros
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => { setOpenEdit(team); setName(team.name); }}
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(team.id)}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
              {(team.members?.length ?? 0) > 0 && (
                <p className="text-xs text-muted-foreground truncate">
                  {team.members?.slice(0, 3).map((m) => m.user?.fullName).join(', ')}
                  {(team.members?.length ?? 0) > 3 && ` +${(team.members?.length ?? 0) - 3}`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!openEdit} onOpenChange={(o) => !o && setOpenEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar time</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do time</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
