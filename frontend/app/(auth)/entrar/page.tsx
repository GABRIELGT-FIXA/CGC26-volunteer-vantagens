'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';

type Step = 'phone' | 'login' | 'register';

export default function EntrarPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  async function handleCheckPhone(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/check-phone', { phone: phone.replace(/\D/g, '') });
      setStep(res.data.exists ? 'login' : 'register');
    } catch {
      toast.error('Erro ao verificar telefone');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { phone: phone.replace(/\D/g, ''), password });
      const token = res.data.accessToken;
      const me = await api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } });
      login(token, me.data);
      router.replace(me.data.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
    } catch {
      toast.error('Telefone ou senha incorretos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-primary">Volunteer Vantagens</h1>
        <p className="text-muted-foreground text-sm">Acesse sua conta</p>
      </div>

      {step === 'phone' && (
        <form onSubmit={handleCheckPhone} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Número de celular</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="11999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              autoFocus
              className="text-base"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Verificando...' : 'Continuar'}
          </Button>
        </form>
      )}

      {step === 'login' && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Bem-vindo de volta! Insira sua senha para continuar.
            </p>
            <button
              type="button"
              className="text-xs text-primary underline"
              onClick={() => { setStep('phone'); setPassword(''); }}
            >
              ← Trocar número
            </button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone-ro">Celular</Label>
            <Input id="phone-ro" value={phone} readOnly className="opacity-60" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="text-base"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
          <div className="text-center">
            <Link href="/recuperar-senha" className="text-xs text-muted-foreground hover:text-primary underline">
              Esqueci minha senha
            </Link>
          </div>
        </form>
      )}

      {step === 'register' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Número não encontrado. Vamos criar sua conta!
          </p>
          <Button
            className="w-full"
            onClick={() => router.push(`/cadastro?phone=${encodeURIComponent(phone.replace(/\D/g, ''))}`)}
          >
            Criar conta
          </Button>
          <button
            type="button"
            className="w-full text-xs text-muted-foreground underline"
            onClick={() => setStep('phone')}
          >
            ← Voltar
          </button>
        </div>
      )}
    </div>
  );
}
