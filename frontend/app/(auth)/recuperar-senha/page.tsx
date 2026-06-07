'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import Link from 'next/link';

type Step = 'phone' | 'answer' | 'reset' | 'done';

export default function RecuperarSenhaPage() {
  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  async function handlePhone(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/security-question', { phone: phone.replace(/\D/g, '') });
      setQuestion(res.data.securityQuestion);
      setStep('answer');
    } catch {
      toast.error('Número não encontrado');
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-security-answer', { phone: phone.replace(/\D/g, ''), answer });
      setResetToken(res.data.resetToken);
      setStep('reset');
    } catch {
      toast.error('Resposta incorreta');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('As senhas não coincidem'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { resetToken, newPassword });
      setStep('done');
    } catch {
      toast.error('Token expirado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold">Recuperar senha</h1>
        <Link href="/entrar" className="text-xs text-muted-foreground hover:text-primary underline">← Voltar ao login</Link>
      </div>

      {step === 'phone' && (
        <form onSubmit={handlePhone} className="space-y-4">
          <div className="space-y-2">
            <Label>Número de celular</Label>
            <Input type="tel" inputMode="numeric" pattern="[0-9]*" placeholder="11999999999" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} className="text-base" autoFocus />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Buscando...' : 'Continuar'}
          </Button>
        </form>
      )}

      {step === 'answer' && (
        <form onSubmit={handleAnswer} className="space-y-4">
          <div className="space-y-2">
            <Label>Pergunta de segurança</Label>
            <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">{question}</p>
          </div>
          <div className="space-y-2">
            <Label>Sua resposta</Label>
            <Input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Resposta" className="text-base" autoFocus />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Verificando...' : 'Verificar'}
          </Button>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={handleReset} className="space-y-4">
          <p className="text-sm text-muted-foreground">Crie uma nova senha.</p>
          <div className="space-y-2">
            <Label>Nova senha</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="text-base" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Confirmar nova senha</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" className="text-base" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </Button>
        </form>
      )}

      {step === 'done' && (
        <div className="text-center space-y-4">
          <p className="text-primary text-4xl">✓</p>
          <p className="text-sm">Senha atualizada com sucesso!</p>
          <Button className="w-full" onClick={() => router.push('/entrar')}>Fazer login</Button>
        </div>
      )}
    </div>
  );
}
