import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as leaderService from '../services/leader.service';

export async function getVotables(req: Request, res: Response, next: NextFunction) {
  try { res.json(await leaderService.getVotables(req.user!.userId)); } catch (e) { next(e); }
}

export async function evaluate(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, points } = z.object({
      userId: z.string().uuid(),
      points: z.number().int().min(0).max(650),
    }).parse(req.body);
    res.json(await leaderService.evaluate(req.user!.userId, userId, points));
  } catch (e) { next(e); }
}

export async function removeVote(req: Request, res: Response, next: NextFunction) {
  try {
    await leaderService.removeVote(req.user!.userId, req.params.userId as string);
    res.status(204).send();
  } catch (e) { next(e); }
}

export async function getMyVotes(req: Request, res: Response, next: NextFunction) {
  try { res.json(await leaderService.getMyVotes(req.user!.userId)); } catch (e) { next(e); }
}

// Admin: todas as avaliações (verificação)
export async function listAll(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await leaderService.listEvaluations()); } catch (e) { next(e); }
}
