'use client';

import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { News } from '@/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

function formatNewsDate(iso: string): string {
  const d = new Date(iso);
  return `${format(d, 'dd/MM', { locale: ptBR })} às ${format(d, 'HH')}h`;
}

export default function NoticiasAdminPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<News | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: news, isLoading } = useQuery<News[]>({
    queryKey: ['news'],
    queryFn: () => api.get('/news').then((r) => r.data),
  });

  function reset() {
    setTitle(''); setDescription(''); setImage(null); setPreview(null); setEditing(null);
  }

  function openNew() {
    reset();
    setOpen(true);
  }

  function openEdit(item: News) {
    setEditing(item);
    setTitle(item.title);
    setDescription(item.description);
    setImage(null);
    setPreview(item.image ? `${BASE}${item.image}` : null);
    setOpen(true);
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.append('title', title);
    fd.append('description', description);
    if (image) fd.append('image', image);
    try {
      if (editing) {
        await api.put(`/news/${editing.id}`, fd);
        toast.success('Notícia atualizada');
      } else {
        await api.post('/news', fd);
        toast.success('Notícia publicada');
      }
      qc.invalidateQueries({ queryKey: ['news'] });
      setOpen(false);
      reset();
    } catch {
      toast.error('Erro ao salvar notícia');
    } finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta notícia?')) return;
    try {
      await api.delete(`/news/${id}`);
      qc.invalidateQueries({ queryKey: ['news'] });
      toast.success('Notícia excluída');
    } catch {
      toast.error('Erro ao excluir');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-xl">Notícias</h2>
        <Button size="sm" onClick={openNew}><Plus size={16} className="mr-1" /> Nova notícia</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : !news?.length ? (
        <p className="text-center text-muted-foreground text-sm py-10">Nenhuma notícia publicada.</p>
      ) : (
        <div className="space-y-3">
          {news.map((item) => (
            <div key={item.id} className="rounded-xl bg-card border border-border overflow-hidden flex">
              {item.image && (
                <div className="w-28 shrink-0 bg-muted">
                  <img src={`${BASE}${item.image}`} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0 p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatNewsDate(item.createdAt)}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil size={15} /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar notícia' : 'Nova notícia'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} required />
            </div>
            <div className="space-y-2">
              <Label>Imagem (opcional)</Label>
              {preview && (
                <div className="rounded-lg overflow-hidden bg-muted aspect-[16/7]">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                {preview ? 'Trocar imagem' : 'Escolher imagem'}
              </Button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImage} />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !title.trim() || !description.trim()}>
              {loading ? 'Salvando...' : editing ? 'Salvar alterações' : 'Publicar notícia'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
