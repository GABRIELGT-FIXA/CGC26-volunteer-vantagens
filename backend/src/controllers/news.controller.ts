import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as newsService from '../services/news.service';

export async function listNews(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await newsService.listNews()); } catch (e) { next(e); }
}

export async function getNews(req: Request, res: Response, next: NextFunction) {
  try { res.json(await newsService.getNews(req.params.id as string)); } catch (e) { next(e); }
}

export async function createNews(req: Request, res: Response, next: NextFunction) {
  try {
    const data = z.object({
      title: z.string().min(2),
      description: z.string().min(1),
    }).parse(req.body);
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;
    res.status(201).json(await newsService.createNews({ ...data, image, createdById: req.user!.userId }));
  } catch (e) { next(e); }
}

export async function updateNews(req: Request, res: Response, next: NextFunction) {
  try {
    const data = z.object({
      title: z.string().min(2).optional(),
      description: z.string().min(1).optional(),
    }).parse(req.body);
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;
    res.json(await newsService.updateNews(req.params.id as string, { ...data, ...(image ? { image } : {}) }));
  } catch (e) { next(e); }
}

export async function deleteNews(req: Request, res: Response, next: NextFunction) {
  try { await newsService.deleteNews(req.params.id as string); res.status(204).send(); } catch (e) { next(e); }
}
