'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { WindowStatus } from '@/types';
import { Camera, RefreshCw, Check } from 'lucide-react';

interface Props {
  taskId: string;
  type: 'checkin' | 'checkout';
}

export function PhotoCapture({ taskId, type }: Props) {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<'idle' | 'camera' | 'preview'>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [teamId, setTeamId] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const multipleTeams = (user?.teams.length ?? 0) > 1;

  const { data: ws } = useQuery<WindowStatus>({
    queryKey: ['window-status', taskId],
    queryFn: () => api.get(`/tasks/${taskId}/window-status`).then((r) => r.data),
  });

  const isOpen = type === 'checkin' ? ws?.checkInOpen : ws?.checkOutOpen;

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setMode('camera');
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 50);
    } catch {
      toast.error('Não foi possível acessar a câmera. Use o upload de arquivo.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  const capture = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setPhotoBlob(blob);
      setPreview(URL.createObjectURL(blob));
      setMode('preview');
      stopCamera();
    }, 'image/jpeg', 0.85);
  }, []);

  function reset() {
    setMode('idle');
    setPreview(null);
    setPhotoBlob(null);
  }

  async function handleSend() {
    if (!photoBlob) return;
    if (type === 'checkin' && multipleTeams && !teamId) {
      toast.error('Selecione um time');
      return;
    }

    setSending(true);
    try {
      const fd = new FormData();
      fd.append('photo', photoBlob, 'photo.jpg');
      if (type === 'checkin') {
        const selectedTeam = teamId || user!.teams[0]?.teamId;
        if (selectedTeam) fd.append('teamId', selectedTeam);
      }

      await api.post(`/participations/${taskId}/${type === 'checkin' ? 'checkin' : 'checkout'}`, fd);

      setDone(true);
      qc.invalidateQueries({ queryKey: ['my-participations'] });
      qc.invalidateQueries({ queryKey: ['window-status', taskId] });
      toast.success(type === 'checkin' ? 'Chegada registrada!' : 'Saída registrada!');
      setTimeout(() => router.replace('/dashboard'), 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Erro ao registrar');
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
          <Check size={40} className="text-primary" />
        </div>
        <p className="font-semibold text-lg">{type === 'checkin' ? 'Chegada registrada!' : 'Saída registrada!'}</p>
        <p className="text-sm text-muted-foreground">Redirecionando...</p>
      </div>
    );
  }

  if (!isOpen && ws) {
    return (
      <div className="text-center space-y-3 py-10">
        <p className="text-4xl">🔒</p>
        <p className="font-semibold">Janela fechada</p>
        <p className="text-sm text-muted-foreground">
          {type === 'checkin' ? 'O check-in' : 'O check-out'} não está disponível no momento.
        </p>
        <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <p className="font-semibold text-lg">{ws?.task.name}</p>
        <p className="text-sm text-muted-foreground">
          {type === 'checkin' ? 'Registrar chegada' : 'Registrar saída'}
        </p>
      </div>

      {/* Team select for checkin with multiple teams */}
      {type === 'checkin' && multipleTeams && mode !== 'preview' && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Para qual time vai este ponto?</p>
          <Select value={teamId} onValueChange={(v) => { if (v) setTeamId(v); }}>
            <SelectTrigger><SelectValue placeholder="Selecione o time" /></SelectTrigger>
            <SelectContent>
              {user?.teams.map((ut) => (
                <SelectItem key={ut.teamId} value={ut.teamId ?? ''}>{ut.team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Camera only — sem upload de arquivo */}
      {mode === 'idle' && (
        <div className="space-y-3">
          <Button className="w-full" size="lg" onClick={startCamera}>
            <Camera size={18} className="mr-2" /> Abrir câmera
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            A foto deve ser tirada na hora pela câmera.
          </p>
        </div>
      )}

      {mode === 'camera' && (
        <div className="space-y-3">
          <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { stopCamera(); setMode('idle'); }}>Cancelar</Button>
            <Button className="flex-1" onClick={capture}>
              <Camera size={18} className="mr-1" /> Tirar foto
            </Button>
          </div>
        </div>
      )}

      {mode === 'preview' && preview && (
        <div className="space-y-3">
          <div className="aspect-[4/3] rounded-xl overflow-hidden">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={reset}>
              <RefreshCw size={16} className="mr-1" /> Refazer
            </Button>
            <Button className="flex-1" onClick={handleSend} disabled={sending || (type === 'checkin' && multipleTeams && !teamId)}>
              {sending ? 'Enviando...' : 'Confirmar ✓'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
