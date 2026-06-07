'use client';

import { useState, useEffect } from 'react';
import { X, Palette } from 'lucide-react';

const TEAMS = [
  { slug: 'alcance',   label: 'Alcance',   color: '#C94A1A' },
  { slug: 'cathering', label: 'Cathering', color: '#C07D1A' },
  { slug: 'central',   label: 'Central',   color: '#2E4A6B' },
  { slug: 'creative',  label: 'Creative',  color: '#D9E05A' },
  { slug: 'danca',     label: 'Dança',     color: '#A51C1C' },
  { slug: 'femininas', label: 'Femininas', color: '#C47070' },
  { slug: 'filiais',   label: 'Filiais',   color: '#2E7A72' },
  { slug: 'horizonte', label: 'Horizonte', color: '#E8A83A' },
  { slug: 'link',      label: 'Link',      color: '#52B0A6' },
  { slug: 'music',     label: 'Music',     color: '#A51C1C' },
  { slug: 'producao',  label: 'Produção',  color: '#2E4A6B' },
  { slug: 'store',     label: 'Store',     color: '#E8A83A' },
  { slug: 'teatro',    label: 'Teatro',    color: '#5C0A0A' },
  { slug: 'welcome',   label: 'Welcome',   color: '#2E7A72' },
];

export function ThemePanel() {
  const [open, setOpen] = useState(false);
  const [mode, setMode]   = useState('dark');
  const [theme, setTheme] = useState('central');

  useEffect(() => {
    const m = localStorage.getItem('cc26-mode')  || 'dark';
    const t = localStorage.getItem('cc26-theme') || 'central';
    setMode(m);
    setTheme(t);
  }, []);

  function applyMode(m: string) {
    document.documentElement.setAttribute('data-mode', m);
    localStorage.setItem('cc26-mode', m);
    setMode(m);
  }

  function applyTheme(t: string) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('cc26-theme', t);
    localStorage.setItem('cc26-theme-manual', '1'); // marca override manual
    setTheme(t);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Personalizar tema"
        style={{ background: 'var(--brand-primary, #A51C1C)' }}
        className="fixed bottom-20 right-4 lg:bottom-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95"
      >
        <Palette size={20} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      <aside
        aria-hidden={!open}
        className="fixed top-0 right-0 h-full w-72 z-50 flex flex-col shadow-lg transition-transform duration-300"
        style={{
          background: 'var(--bg-surface, #0F1B2D)',
          borderLeft: '1px solid var(--border-default)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Personalizar</span>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Mode toggle */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Modo</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'light', label: 'Claro',  icon: '☀' },
                { value: 'dark',  label: 'Escuro', icon: '☾' },
              ].map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => applyMode(value)}
                  className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-all"
                  style={{
                    background: mode === value ? 'var(--brand-primary, #A51C1C)' : 'transparent',
                    color: mode === value ? '#fff' : 'var(--text-secondary)',
                    borderColor: mode === value ? 'var(--brand-primary, #A51C1C)' : 'var(--border-default)',
                  }}
                >
                  <span>{icon}</span> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Team picker */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Time</p>
            <div className="grid grid-cols-2 gap-2">
              {TEAMS.map(({ slug, label, color }) => (
                <button
                  key={slug}
                  onClick={() => applyTheme(slug)}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium border transition-all text-left"
                  style={{
                    background: theme === slug ? color + '20' : 'transparent',
                    borderColor: theme === slug ? color : 'var(--border-default)',
                    color: theme === slug ? color : 'var(--text-secondary)',
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
