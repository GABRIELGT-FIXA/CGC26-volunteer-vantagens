'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, children }: Props) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Container dedicado — evita conflito com outros nós do body (ripple etc.)
    const el = document.createElement('div');
    el.setAttribute('data-bottom-sheet-portal', '');
    document.body.appendChild(el);
    setPortalEl(el);
    return () => { el.remove(); };
  }, []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // dois frames para garantir a transição de entrada
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(r);
    } else {
      setShown(false);
      const t = setTimeout(() => setMounted(false), 320);
      return () => clearTimeout(t);
    }
  }, [open]);

  // trava o scroll do body enquanto aberto
  useEffect(() => {
    if (mounted) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [mounted]);

  if (!mounted || !portalEl) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        style={{ opacity: shown ? 1 : 0 }}
      />

      {/* Card */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl shadow-lg max-h-[88vh] overflow-y-auto transition-transform duration-300 ease-out"
        style={{ transform: shown ? 'translateY(0)' : 'translateY(100%)' }}
      >
        {/* Alça */}
        <div className="sticky top-0 bg-card pt-3 pb-2 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="px-4 pb-6">{children}</div>
      </div>
    </div>,
    portalEl
  );
}
