'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

const BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

export default function PerfilPage() {
  const { user, logout, setUser } = useAuthStore();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    try {
      const res = await api.put('/users/me/photo', fd);
      setUser(res.data);
      toast.success('Foto atualizada!');
    } catch {
      toast.error('Erro ao atualizar foto');
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error('As senhas não coincidem'); return; }
    setSaving(true);
    try {
      await api.put('/users/me/password', { currentPassword: currentPw, newPassword: newPw });
      toast.success('Senha atualizada!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch {
      toast.error('Senha atual incorreta');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try { await api.post('/auth/logout'); } catch {}
    logout();
    router.replace('/entrar');
  }

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-xl">Meu perfil</h2>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <Avatar className="w-20 h-20 cursor-pointer" onClick={() => fileRef.current?.click()}>
          <AvatarImage src={user?.profilePhoto ? `${BASE}${user.profilePhoto}` : undefined} />
          <AvatarFallback className="text-2xl">{user?.fullName?.[0]}</AvatarFallback>
        </Avatar>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Trocar foto</Button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
      </div>

      {/* Info */}
      <div className="rounded-xl bg-card border border-border p-4 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Nome</p>
          <p className="font-medium">{user?.fullName}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Celular</p>
          <p className="font-medium">{user?.phone}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Time(s)</p>
          <p className="font-medium">{user?.teams.map((ut) => ut.team.name).join(', ') || '—'}</p>
        </div>
        <p className="text-xs text-muted-foreground">Para alterar nome, telefone ou time, contate o administrador.</p>
      </div>

      {/* Change password */}
      <form onSubmit={handlePasswordChange} className="rounded-xl bg-card border border-border p-4 space-y-4">
        <h3 className="font-semibold">Alterar senha</h3>
        <div className="space-y-2">
          <Label>Senha atual</Label>
          <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="text-base" />
        </div>
        <div className="space-y-2">
          <Label>Nova senha</Label>
          <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="text-base" />
        </div>
        <div className="space-y-2">
          <Label>Confirmar nova senha</Label>
          <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="text-base" />
        </div>
        <Button type="submit" className="w-full" disabled={saving || !currentPw || !newPw || !confirmPw}>
          {saving ? 'Salvando...' : 'Salvar senha'}
        </Button>
      </form>

      <Button variant="destructive" className="w-full" onClick={handleLogout}>Sair</Button>
    </div>
  );
}
