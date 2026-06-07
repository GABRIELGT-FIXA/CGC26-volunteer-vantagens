import { Request, Response, NextFunction } from 'express';
import * as rankingService from '../services/ranking.service';

export async function individualRanking(req: Request, res: Response, next: NextFunction) {
  try { res.json(await rankingService.individualRanking()); } catch (e) { next(e); }
}

export async function teamsRanking(req: Request, res: Response, next: NextFunction) {
  try { res.json(await rankingService.teamsRanking()); } catch (e) { next(e); }
}
