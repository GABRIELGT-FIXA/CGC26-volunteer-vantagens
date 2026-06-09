import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as leaderService from '../services/leader.service';

export async function getTeamMembers(req: Request, res: Response, next: NextFunction) {
  try { res.json(await leaderService.getTeamMembers(req.user!.userId)); } catch (e) { next(e); }
}

export async function evaluateMember(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, points } = z.object({
      userId: z.string().uuid(),
      points: z.number().int().min(0).max(650),
    }).parse(req.body);
    res.json(await leaderService.evaluateMember(req.user!.userId, userId, points));
  } catch (e) { next(e); }
}
