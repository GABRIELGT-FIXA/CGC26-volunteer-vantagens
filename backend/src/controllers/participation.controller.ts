import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as participationService from '../services/participation.service';

export async function checkIn(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) { res.status(400).json({ error: 'Foto obrigatória' }); return; }
    const { teamId } = z.object({ teamId: z.string().uuid().optional() }).parse(req.body);
    res.status(201).json(
      await participationService.checkIn(req.params.taskId as string, req.user!.userId, teamId ?? null, req.file.filename)
    );
  } catch (e) { next(e); }
}

export async function checkOut(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) { res.status(400).json({ error: 'Foto obrigatória' }); return; }
    res.json(await participationService.checkOut(req.params.taskId as string, req.user!.userId, req.file.filename));
  } catch (e) { next(e); }
}

export async function getMyParticipations(req: Request, res: Response, next: NextFunction) {
  try { res.json(await participationService.getMyParticipations(req.user!.userId)); } catch (e) { next(e); }
}

export async function updatePoints(req: Request, res: Response, next: NextFunction) {
  try {
    const { points } = z.object({ points: z.number().int().min(0) }).parse(req.body);
    res.json(await participationService.updatePoints(req.params.id as string, points));
  } catch (e) { next(e); }
}

export async function listForAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;
    res.json(await participationService.listForAudit({ status }));
  } catch (e) { next(e); }
}

export async function reviewParticipation(req: Request, res: Response, next: NextFunction) {
  try {
    const { consider } = z.object({ consider: z.boolean() }).parse(req.body);
    res.json(await participationService.reviewParticipation(req.params.id as string, consider));
  } catch (e) { next(e); }
}
