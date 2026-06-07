'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function RootPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace('/entrar');
    else if (user.role === 'ADMIN') router.replace('/admin/dashboard');
    else router.replace('/dashboard');
  }, [user, isLoading, router]);

  return null;
}
