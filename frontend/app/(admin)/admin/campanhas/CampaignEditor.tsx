'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Campaign } from '@/types';

const VARIABLES = [
  { key: '{{taskName}}', label: 'Nome da atividade', sample: 'Front Line' },
  { key: '{{date}}', label: 'Data', sample: '11/06' },
  { key: '{{startTime}}', label: 'Início', sample: '08:00' },
  { key: '{{endTime}}', label: 'Fim', sample: '10:00' },
  { key: '{{points}}', label: 'Pontuação', sample: '350' },
  { key: '{{windowMinutes}}', label: 'Janela (min)', sample: '10' },
];

const UNKNOWN_VAR_RE = /\{\{(?!taskName|date|startTime|endTime|points|windowMinutes)[^}]+\}\}/g;

function renderPreview(message: string): string {
  let result = message;
  VARIABLES.forEach(({ key, sample }) => {
    result = result.replaceAll(key, sample);
  });
  // Bold: *text* → <strong>
  result = result.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  // Italic: _text_ → <em>
  result = result.replace(/_(.*?)_/g, '<em>$1</em>');
  // Newlines → <br>
  result = result.replace(/\n/g, '<br>');
  return result;
}


function toDatetimeLocal(iso: string) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 16);
}

export interface CampaignInitial {
  name?: string;
  message?: string;
  scheduledAt?: string; // ISO string
}

interface Props {
  campaign?: Campaign;
  initial?: CampaignInitial;
  onSuccess: () => void;
}

export function CampaignEditor({ campaign, initial, onSuccess }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [name, setName] = useState(campaign?.name ?? initial?.name ?? '');
  const [message, setMessage] = useState(campaign?.message ?? initial?.message ?? '');
  const [scheduledAt, setScheduledAt] = useState(
    campaign?.scheduledAt ? toDatetimeLocal(campaign.scheduledAt)
    : initial?.scheduledAt ? toDatetimeLocal(initial.scheduledAt)
    : ''
  );
  const [loading, setLoading] = useState(false);
  const charCount = message.length;
  const hasUnknown = UNKNOWN_VAR_RE.test(message);

  function insertVariable(variable: string) {
    const el = textareaRef.current;
    if (!el) { setMessage((m) => m + variable); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = message.slice(0, start) + variable + message.slice(end);
    setMessage(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = { name, message, scheduledAt: new Date(scheduledAt).toISOString() };
    try {
      if (campaign) {
        await api.put(`/campaigns/${campaign.id}`, payload);
        toast.success('Campanha atualizada!');
      } else {
        await api.post('/campaigns', payload);
        toast.success('Campanha criada!');
      }
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Erro ao salvar campanha');
    } finally {
      setLoading(false);
    }
  }

  const isValid = name.trim().length >= 2 && message.trim().length > 0 && scheduledAt && !hasUnknown;

  // Mobile: aba Editar/Preview | Desktop: dois painéis
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* === EDITOR === */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da campanha</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Lembrete Front Line" required />
          </div>
          <div className="space-y-2">
            <Label>Data e hora do disparo</Label>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Mensagem</Label>
              <span className={`text-xs ${charCount > 4000 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {charCount}/4096
              </span>
            </div>

            {/* Mobile: tabs para alternar editor/preview */}
            <div className="md:hidden">
              <Tabs defaultValue="editor">
                <TabsList className="w-full mb-2">
                  <TabsTrigger value="editor" className="flex-1">Editar</TabsTrigger>
                  <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="editor">
                  <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Olá! 👋 A atividade *{{taskName}}*..."
                    rows={8}
                    className="font-mono text-sm resize-none"
                    required
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <PreviewBubble message={message} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Desktop: textarea normal */}
            <div className="hidden md:block">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Olá! 👋 A atividade *{{taskName}}*..."
                rows={10}
                className="font-mono text-sm resize-none"
                required
              />
            </div>

            {hasUnknown && (
              <p className="text-xs text-destructive">Variável não reconhecida. Verifique o texto.</p>
            )}
          </div>

          {/* Variable chips */}
          <div className="space-y-2">
            <Label className="text-xs">Variáveis disponíveis — clique para inserir</Label>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => insertVariable(key)}
                  className="text-xs px-2 py-1 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors font-mono"
                  title={label}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* === PREVIEW (desktop only) === */}
        <div className="hidden md:flex flex-col gap-3">
          <Label className="text-xs text-muted-foreground">Preview em tempo real</Label>
          <PreviewBubble message={message} />
          <p className="text-xs text-muted-foreground text-center">Valores de exemplo para visualização</p>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={!isValid || loading}>
          {loading ? 'Salvando...' : campaign ? 'Salvar alterações' : 'Criar campanha'}
        </Button>
      </div>
    </form>
  );
}

function PreviewBubble({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-muted p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">V</div>
        <div>
          <p className="text-xs font-semibold">Volunteer Vantagens</p>
          <p className="text-[10px] text-muted-foreground">WhatsApp</p>
        </div>
      </div>
      <div className="bg-background rounded-lg rounded-tl-none p-3 shadow-sm max-w-xs">
        {message ? (
          <p
            className="text-sm whitespace-pre-wrap leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderPreview(message) }}
          />
        ) : (
          <p className="text-sm text-muted-foreground italic">A mensagem aparecerá aqui...</p>
        )}
      </div>
    </div>
  );
}
