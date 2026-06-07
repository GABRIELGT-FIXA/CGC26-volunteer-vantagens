'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { Team } from '@/types';

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

const STEPS = ['Dados pessoais', 'Time e foto', 'Acesso', 'Segurança'];

function CadastroForm() {
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') ?? '';
  const router = useRouter();
  const { login } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [animKey, setAnimKey] = useState(0);
  const [loading, setLoading] = useState(false);

  function goNext() {
    setDirection('forward');
    setAnimKey((k) => k + 1);
    setStep((s) => s + 1);
  }

  function goBack() {
    setDirection('back');
    setAnimKey((k) => k + 1);
    setStep((s) => s - 1);
  }
  const [teams, setTeams] = useState<Team[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    age: '',
    teamIds: [] as string[],
    photo: null as File | null,
    password: '',
    confirmPassword: '',
    securityQuestion: '',
    securityAnswer: '',
  });

  useEffect(() => {
    api.get('/teams').then((r) => setTeams(r.data)).catch(() => {});
  }, []);

  function set(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleTeam(id: string) {
    setForm((prev) => ({
      ...prev,
      teamIds: prev.teamIds[0] === id ? [] : [id],
    }));
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    set('photo', file);
    setPreviewPhoto(URL.createObjectURL(file));
  }

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 50);
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
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'foto.jpg', { type: 'image/jpeg' });
      set('photo', file);
      setPreviewPhoto(URL.createObjectURL(blob));
      closeCamera();
    }, 'image/jpeg', 0.9);
  }, []);

  function canAdvance() {
    if (step === 0) return form.fullName.trim().length >= 2 && Number(form.age) >= 10;
    if (step === 1) return (teams.length === 0 || form.teamIds.length > 0) && form.photo !== null;
    if (step === 2) return form.password.length >= 6 && form.password === form.confirmPassword;
    if (step === 3) return form.securityQuestion && form.securityAnswer.trim().length > 0;
    return false;
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('fullName', form.fullName);
      fd.append('age', form.age);
      fd.append('phone', phone);
      fd.append('password', form.password);
      fd.append('securityQuestion', form.securityQuestion);
      fd.append('securityAnswer', form.securityAnswer);
      form.teamIds.forEach((id) => fd.append('teamIds', id));
      if (form.photo) fd.append('photo', form.photo);

      await api.post('/auth/register', fd);
      const loginRes = await api.post('/auth/login', { phone, password: form.password });
      const token = loginRes.data.accessToken;
      const me = await api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } });
      login(token, me.data);
      toast.success('Conta criada com sucesso!');
      router.replace('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold">Criar conta</h1>
        <p className="text-xs text-muted-foreground">{STEPS[step]} — Etapa {step + 1} de {STEPS.length}</p>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      <div
        key={animKey}
        className="space-y-4 overflow-hidden"
        style={{ animation: `${direction === 'forward' ? 'slide-in-right' : 'slide-in-left'} 280ms cubic-bezier(0.25, 0.8, 0.25, 1) both` }}
      >
        {step === 0 && (
          <>
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Seu nome" className="text-base" />
            </div>
            <div className="space-y-2">
              <Label>Idade</Label>
              <Input type="number" value={form.age} onChange={(e) => set('age', e.target.value)} placeholder="25" min={10} className="text-base" />
            </div>
            <div className="space-y-2">
              <Label>Celular</Label>
              <Input value={phone} readOnly className="opacity-60" />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label>Time(s)</Label>
              <div className="grid grid-cols-2 gap-2">
                {teams.length === 0 ? (
                  <p className="col-span-2 text-xs text-muted-foreground py-2">
                    Nenhum time cadastrado ainda — o admin adicionará você a um time depois.
                  </p>
                ) : teams.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTeam(t.id)}
                    className={`p-2 rounded-lg border text-sm transition-all ${
                      form.teamIds.includes(t.id)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label>Foto de perfil</Label>

              {/* Preview circular */}
              <div className="flex justify-center">
                <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                  {previewPhoto
                    ? <img src={previewPhoto} alt="Preview" className="w-full h-full object-cover" />
                    : <span className="text-sm text-muted-foreground">Sem foto</span>
                  }
                </div>
              </div>

              {/* Câmera aberta */}
              {cameraOpen ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={closeCamera}>
                      Cancelar
                    </Button>
                    <Button type="button" className="flex-1" onClick={capturePhoto}>
                      Tirar foto
                    </Button>
                  </div>
                </div>
              ) : (
                /* Botões de escolha */
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" className="flex-1 h-12" onClick={openCamera}>
                    Tirar foto
                  </Button>
                  <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => fileRef.current?.click()}>
                    Galeria
                  </Button>
                </div>
              )}

              {previewPhoto && !cameraOpen && (
                <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground text-xs"
                  onClick={() => { set('photo', null); setPreviewPhoto(null); }}>
                  Remover foto
                </Button>
              )}

              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhoto} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Mínimo 6 caracteres" className="text-base" />
            </div>
            <div className="space-y-2">
              <Label>Confirmar senha</Label>
              <Input type="password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} placeholder="Repita a senha" className="text-base" />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-destructive">As senhas não coincidem</p>
              )}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="space-y-2">
              <Label>Pergunta de segurança</Label>
              <Select value={form.securityQuestion} onValueChange={(v) => set('securityQuestion', v)}>
                <SelectTrigger><SelectValue placeholder="Escolha uma pergunta" /></SelectTrigger>
                <SelectContent>
                  {SECURITY_QUESTIONS.map((q) => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resposta</Label>
              <Input value={form.securityAnswer} onChange={(e) => set('securityAnswer', e.target.value)} placeholder="Sua resposta" className="text-base" />
            </div>
          </>
        )}
      </div>

      {/* Sticky footer buttons */}
      <div className="flex gap-2 pt-2">
        {step > 0 && (
          <Button variant="outline" className="flex-1" onClick={goBack}>
            Voltar
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button className="flex-1" disabled={!canAdvance()} onClick={goNext}>
            Próximo
          </Button>
        ) : (
          <Button className="flex-1" disabled={!canAdvance() || loading} onClick={handleSubmit}>
            {loading ? 'Criando conta...' : 'Finalizar'}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-muted-foreground py-10">Carregando...</div>}>
      <CadastroForm />
    </Suspense>
  );
}
