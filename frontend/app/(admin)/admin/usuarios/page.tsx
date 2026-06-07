'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User, Team } from '@/types';
import { Trash2, Search, Plus, Pencil } from 'lucide-react';
import { format } from 'date-fns';

const BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

const SECURITY_QUESTIONS = [
  'Qual o nome do seu primeiro animal de estimação?',
  'Qual o nome da cidade onde você nasceu?',
  'Qual o nome do seu melhor amigo de infância?',
  'Qual era o modelo do primeiro carro da sua família?',
  'Qual o nome da sua mãe antes de casar?',
  'Qual era o nome da sua escola primária?',
  'Qual o time de futebol que você torce?',
  'Qual o apelido que você tinha na infância?',
];

function TeamToggle({ teams, selected, onChange }: {
  teams: Team[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id]);
  }
  if (!teams.length) return <p className="text-xs text-muted-foreground">Nenhum time cadastrado.</p>;
  return (
    <div className="grid grid-cols-2 gap-2">
      {teams.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => toggle(t.id)}
          className={`p-2 rounded-lg border text-sm transition-all text-left ${
            selected.includes(t.id)
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground'
          }`}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}

const emptyCreate = {
  fullName: '', age: '', phone: '', password: '',
  securityQuestion: '', securityAnswer: '', teamIds: [] as string[],
};

export default function UsuariosAdminPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [viewing, setViewing] = useState<User | null>(null);

  const [createForm, setCreateForm] = useState(emptyCreate);
  const [editTeamIds, setEditTeamIds] = useState<string[]>([]);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => api.get('/teams').then((r) => r.data),
  });

  const filtered = users?.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search) ||
    u.teams.some((t) => t.team.name.toLowerCase().includes(search.toLowerCase()))
  );

  function setC(k: string, v: string) {
    setCreateForm((p) => ({ ...p, [k]: v }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', {
        fullName: createForm.fullName,
        age: Number(createForm.age),
        phone: createForm.phone,
        password: createForm.password,
        securityQuestion: createForm.securityQuestion,
        securityAnswer: createForm.securityAnswer,
        teamIds: createForm.teamIds,
      });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário criado');
      setCreating(false);
      setCreateForm(emptyCreate);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Erro ao criar usuário');
    } finally { setSaving(false); }
  }

  function openEdit(u: User) {
    setEditing(u);
    setViewing(null);
    setEditName(u.fullName);
    setEditAge(String(u.age));
    setEditPhone(u.phone);
    setEditTeamIds(u.teams.map((t) => t.teamId));
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await api.put(`/users/${editing.id}`, {
        fullName: editName,
        age: Number(editAge),
        phone: editPhone,
        teamIds: editTeamIds,
      });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário atualizado');
      setEditing(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Erro ao atualizar');
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este usuário?')) return;
    try {
      await api.delete(`/users/${id}`);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário excluído');
      setViewing(null);
    } catch {
      toast.error('Erro ao excluir usuário');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-bold text-xl">Usuários</h2>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus size={16} className="mr-1" /> Novo usuário
        </Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nome, telefone ou time..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium text-muted-foreground">Usuário</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Celular</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Time(s)</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [1,2,3,4,5].map((i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-3" colSpan={5}><Skeleton className="h-8 w-full" /></td>
                  </tr>
                ))
              : filtered?.map((u) => (
                  <tr key={u.id} className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setViewing(u)}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={u.profilePhoto ? `${BASE}${u.profilePhoto}` : undefined} />
                          <AvatarFallback className="text-xs">{u.fullName[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.phone}</td>
                    <td className="p-3">{u.teams.map((t) => t.team.name).join(', ') || '—'}</td>
                    <td className="p-3">
                      <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>{u.role}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(u); }}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); handleDelete(u.id); }}>
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {isLoading ? [1,2,3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />) :
          filtered?.map((u) => (
            <div key={u.id} className="rounded-xl bg-card border border-border p-3 flex items-center gap-3 cursor-pointer"
              onClick={() => setViewing(u)}>
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={u.profilePhoto ? `${BASE}${u.profilePhoto}` : undefined} />
                <AvatarFallback>{u.fullName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{u.fullName}</p>
                <p className="text-xs text-muted-foreground">{u.phone} · {u.teams.map((t) => t.team.name).join(', ') || 'Sem time'}</p>
              </div>
              <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'} className="shrink-0">{u.role}</Badge>
            </div>
          ))
        }
      </div>

      {/* View dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-md">
          {viewing && (
            <>
              <DialogHeader><DialogTitle>Usuário</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={viewing.profilePhoto ? `${BASE}${viewing.profilePhoto}` : undefined} />
                    <AvatarFallback className="text-2xl">{viewing.fullName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">{viewing.fullName}</p>
                    <p className="text-sm text-muted-foreground">{viewing.phone}</p>
                    <Badge variant={viewing.role === 'ADMIN' ? 'default' : 'secondary'} className="mt-1">{viewing.role}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground text-xs">Idade</p><p>{viewing.age} anos</p></div>
                  <div><p className="text-muted-foreground text-xs">Cadastro</p><p>{format(new Date(viewing.createdAt), 'dd/MM/yyyy')}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground text-xs">Times</p><p>{viewing.teams.map((t) => t.team.name).join(', ') || '—'}</p></div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => openEdit(viewing)}>
                    <Pencil size={15} className="mr-1" /> Editar
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => handleDelete(viewing.id)}>
                    <Trash2 size={15} className="mr-1" /> Excluir
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar usuário</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Idade</Label>
                <Input type="number" min={10} value={editAge} onChange={(e) => setEditAge(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Celular</Label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Times</Label>
              <TeamToggle teams={teams} selected={editTeamIds} onChange={setEditTeamIds} />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={(o) => { setCreating(o); if (!o) setCreateForm(emptyCreate); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo usuário</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input value={createForm.fullName} onChange={(e) => setC('fullName', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Idade</Label>
                <Input type="number" min={10} value={createForm.age} onChange={(e) => setC('age', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Celular</Label>
                <Input value={createForm.phone} onChange={(e) => setC('phone', e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" value={createForm.password} onChange={(e) => setC('password', e.target.value)} minLength={6} required />
            </div>
            <div className="space-y-2">
              <Label>Pergunta de segurança</Label>
              <Select value={createForm.securityQuestion} onValueChange={(v) => v && setC('securityQuestion', v)}>
                <SelectTrigger><SelectValue placeholder="Escolha uma pergunta" /></SelectTrigger>
                <SelectContent>
                  {SECURITY_QUESTIONS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resposta</Label>
              <Input value={createForm.securityAnswer} onChange={(e) => setC('securityAnswer', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Times</Label>
              <TeamToggle
                teams={teams}
                selected={createForm.teamIds}
                onChange={(ids) => setCreateForm((p) => ({ ...p, teamIds: ids }))}
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving || !createForm.securityQuestion}>
              {saving ? 'Criando...' : 'Criar usuário'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
