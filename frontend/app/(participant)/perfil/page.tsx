'use client';

import { useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Camera } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

export default function PerfilPage() {
  const { user, logout, setUser } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 50);
    } catch {
      toast.error('Não foi possível acessar a câmera.');
    }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      closeCamera();
      setUploading(true);
      const fd = new FormData();
      fd.append('photo', blob, 'foto.jpg');
      try {
        const res = await api.put('/users/me/photo', fd);
        setUser(res.data);
        toast.success('Foto atualizada!');
      } catch {
        toast.error('Erro ao atualizar foto');
      } finally {
        setUploading(false);
      }
    }, 'image/jpeg', 0.9);
  }, [setUser]);

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
    queryClient.clear(); // limpa cache do usuário atual
    logout();
    router.replace('/entrar');
  }

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-xl">Meu perfil</h2>

      {/* Avatar + câmera */}
      <div className="flex flex-col items-center gap-3">
        {cameraOpen ? (
          <div className="w-full max-w-xs space-y-2">
            <div className="relative rounded-xl overflow-hidden aspect-square bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={closeCamera}>Cancelar</Button>
              <Button className="flex-1" onClick={capturePhoto}>
                <Camera size={16} className="mr-1" /> Tirar foto
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Avatar className="w-20 h-20">
              <AvatarImage src={user?.profilePhoto ? `${BASE}${user.profilePhoto}` : undefined} />
              <AvatarFallback className="text-2xl">{user?.fullName?.[0]}</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" onClick={openCamera} disabled={uploading}>
              <Camera size={15} className="mr-1" /> {uploading ? 'Enviando...' : 'Trocar foto'}
            </Button>
            <p className="text-xs text-muted-foreground">A foto deve ser tirada na hora pela câmera.</p>
          </>
        )}
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
